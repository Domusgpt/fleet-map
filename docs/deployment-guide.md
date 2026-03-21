# Fleet Map — Deployment & Monetization Guide

How to deploy Fleet Map as a commercial SaaS product on Google Cloud with Stripe billing.

---

## Architecture for SaaS

```
┌─────────────────────────────────────────────────────┐
│                    Google Cloud                       │
│                                                       │
│  ┌──────────┐    ┌──────────────┐    ┌────────────┐  │
│  │ Cloud Run │    │  Firestore   │    │ Cloud       │  │
│  │ (API +    │◄──►│  (Tenant DB) │    │ Storage     │  │
│  │  Dashboard│    │              │    │ (Static     │  │
│  │  Auth)    │    │  - fleets    │    │  Assets)    │  │
│  │           │    │  - vessels   │    │             │  │
│  └─────┬─────┘    │  - configs   │    └──────┬──────┘  │
│        │          │  - users     │           │         │
│        │          └──────────────┘           │         │
│  ┌─────▼─────┐                        ┌─────▼──────┐  │
│  │ Stripe    │                        │ CDN /       │  │
│  │ Billing   │                        │ Load        │  │
│  │           │                        │ Balancer    │  │
│  └───────────┘                        └────────────┘  │
└─────────────────────────────────────────────────────┘
         ▲                                    ▲
         │                                    │
    ┌────┴─────┐                        ┌─────┴──────┐
    │ Customer │                        │ Fleet Map  │
    │ Dashboard│                        │ (Static    │
    │ (Admin)  │                        │  JS App)   │
    └──────────┘                        └────────────┘
```

---

## Google Cloud Setup

### 1. Project Setup

```bash
# Create project
gcloud projects create fleet-map-saas --name="Fleet Map SaaS"
gcloud config set project fleet-map-saas

# Enable required APIs
gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  identitytoolkit.googleapis.com
```

### 2. Static Asset Hosting (Cloud Storage + CDN)

The Fleet Map JS library is static — serve it from a CDN bucket:

```bash
# Create bucket
gsutil mb -l us-central1 gs://fleet-map-assets

# Upload the library
gsutil -m cp -r src/ gs://fleet-map-assets/src/
gsutil -m cp -r demos/ gs://fleet-map-assets/demos/

# Make public
gsutil iam ch allUsers:objectViewer gs://fleet-map-assets

# Enable CDN via load balancer (optional)
```

Each customer's map loads from: `https://cdn.fleetmap.io/src/index.js`

### 3. Firestore Database (Multi-Tenant Data)

```
firestore/
├── tenants/
│   └── {tenantId}/
│       ├── config          # FleetMap config object
│       ├── vessels/        # Live vessel data
│       ├── ports/          # Port definitions
│       ├── markers/        # Nav aid positions
│       ├── theme           # Selected theme ID + custom overrides
│       └── billing         # Stripe customer ID, plan, status
├── users/
│   └── {userId}/
│       ├── email
│       ├── tenantId
│       ├── role            # 'owner' | 'admin' | 'viewer'
│       └── permissions
└── global/
    └── plans              # Subscription plan definitions
```

### 4. Cloud Run API Server

Simple Node.js or Python API for:
- **Auth** — Firebase Auth (Google, email/password)
- **Tenant CRUD** — Create/read/update fleet configs
- **Vessel data proxy** — Forward AIS data to correct tenant
- **Billing webhooks** — Stripe subscription events

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY server/ .
RUN npm ci --production
EXPOSE 8080
CMD ["node", "server.js"]
```

### 5. Firebase Auth

```bash
# Initialize Firebase
firebase init auth firestore

# Enable email/password and Google sign-in in Firebase Console
```

---

## Pricing Model

### Suggested Tiers

| Plan | Price | Vessels | Features |
|------|-------|---------|----------|
| **Dock** | $29/mo | Up to 10 | 1 theme, basic map, AIS tracking |
| **Fleet** | $79/mo | Up to 50 | All themes, weather, markers, roster |
| **Harbor** | $199/mo | Unlimited | Custom theme, white-label, API access, priority support |
| **Enterprise** | Custom | Unlimited | Multi-fleet, SSO, data export, SLA |

### Stripe Integration

```js
// Server-side: Create checkout session
const session = await stripe.checkout.sessions.create({
  customer_email: user.email,
  line_items: [{
    price: 'price_fleet_monthly',  // Stripe price ID
    quantity: 1,
  }],
  mode: 'subscription',
  success_url: 'https://app.fleetmap.io/dashboard?success=true',
  cancel_url: 'https://app.fleetmap.io/pricing',
  metadata: { tenantId: tenant.id },
});

// Webhook: Handle subscription events
app.post('/webhooks/stripe', (req, res) => {
  const event = stripe.webhooks.constructEvent(req.body, sig, secret);

  switch (event.type) {
    case 'customer.subscription.created':
      activateTenant(event.data.object.metadata.tenantId);
      break;
    case 'customer.subscription.deleted':
      deactivateTenant(event.data.object.metadata.tenantId);
      break;
    case 'invoice.payment_failed':
      notifyPaymentFailed(event.data.object);
      break;
  }
});
```

---

## Multi-Tenant Architecture

Each customer (tenant) gets:

1. **Unique subdomain or path**: `acme-fishing.fleetmap.io` or `app.fleetmap.io/acme`
2. **Isolated config**: Stored in Firestore under `tenants/{id}/config`
3. **Their own vessel data**: Either self-hosted AIS endpoint or managed
4. **Theme selection**: Pick from presets or request custom
5. **User management**: Owner invites admins/viewers via email

### Tenant Config Storage

```json
{
  "tenantId": "viking-village",
  "name": "Viking Village Inc.",
  "plan": "fleet",
  "theme": "classic-nautical",
  "config": {
    "title": "Viking Village Fleet",
    "subtitle": "Est. 1927 — Barnegat Light, NJ",
    "bounds": { "latN": 41, "latS": 38.5, "lonW": -75, "lonE": -72 },
    "aisEndpoint": "https://ais.vikingvillage.com/api/vessels",
    "weather": { "enabled": true, "alertZone": "ANZ335" }
  },
  "customColors": null,
  "logoUrl": null,
  "stripeCustomerId": "cus_...",
  "active": true
}
```

### Loading a Tenant's Map

```html
<script type="module">
  // Fetch tenant config from API
  const resp = await fetch('/api/tenant/viking-village/config');
  const tenantConfig = await resp.json();

  import { FleetMap } from '/src/index.js';
  const map = new FleetMap('#fleetMap', tenantConfig.config);
  map.setTheme(tenantConfig.theme);
  map.start();
</script>
```

---

## Domain & SSL

```bash
# Custom domain mapping for Cloud Run
gcloud run domain-mappings create \
  --service=fleet-map-api \
  --domain=app.fleetmap.io

# SSL is automatic with Cloud Run managed certificates
```

---

## Cost Estimates (Google Cloud)

| Service | Free Tier | ~50 customers | ~500 customers |
|---------|-----------|---------------|----------------|
| Cloud Run | 2M requests/mo | $5-15/mo | $30-80/mo |
| Firestore | 50K reads/day | $1-5/mo | $10-30/mo |
| Cloud Storage | 5GB | $0.50/mo | $2-5/mo |
| Firebase Auth | 50K users/mo | Free | Free |
| **Total infra** | **~Free** | **~$10-25/mo** | **~$50-120/mo** |

At 50 Fleet-tier customers ($79/mo each) = **$3,950/mo revenue** on ~$20/mo infra.

---

## Launch Checklist

- [ ] Register domain (fleetmap.io or similar)
- [ ] Set up Google Cloud project
- [ ] Deploy static assets to Cloud Storage
- [ ] Set up Firestore schema
- [ ] Build Cloud Run API (auth, tenant CRUD, billing)
- [ ] Integrate Stripe (products, prices, checkout, webhooks)
- [ ] Build customer dashboard (see `dashboard/` in repo)
- [ ] Set up Firebase Auth
- [ ] Configure custom domain + SSL
- [ ] Create landing page with pricing
- [ ] Set up monitoring (Cloud Monitoring, error alerting)
- [ ] Legal: Terms of Service, Privacy Policy
- [ ] Beta test with 2-3 fishing docks
