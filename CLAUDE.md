# DASCOLA Fleet Map — Project Intelligence

## What This Is

DASCOLA is a commercial-grade, zero-dependency fleet tracking visualization platform for the fishing industry. It renders real-time vessel positions on canvas-based nautical charts with AIS integration, NOAA weather overlays, and a modular theming system. It is designed to be sold as a monthly SaaS product to fishing docks, harbormasters, and fleet operators.

## Architecture

### Tech Stack
- **Vanilla JavaScript ES modules** — no build step, no bundler, no framework
- **HTML5 Canvas 2D** — 7-layer composited rendering (depth, currents, coast, markers, weather, vessels, atmosphere)
- **Zero dependencies** — everything is hand-rolled canvas drawing
- **GitHub Pages** for static hosting (will migrate to Google Cloud for SaaS)

### Key Design Decisions
- All visuals are **procedural canvas drawings**, not SVG/PNG assets — this keeps the bundle tiny and everything scalable
- The **asset system** uses draw functions, not image files — each symbol is a JS function that paints to canvas
- **Theme packs** swap colors, fonts, emphasis, and symbol styles while keeping the same entity types
- Each vessel symbol has **3 draw variants**: `drawTopDown`, `drawProfile`, `drawIcon` — themes select which variant
- The project uses `var` and ES5-compatible patterns intentionally for maximum browser compatibility

### Layer Stack (bottom to top)
1. `depth` — Bathymetry, fathom contours, lat/lon grid (static)
2. `currents` — 250-particle ocean current animation (60fps)
3. `coast` — Coastline, land fill, ports, routes, labels (static + animated elements)
4. `markers` — Channel markers, nav aids, buoys, lighthouses (semi-static)
5. `weather` — NOAA weather data overlay (semi-static)
6. `vessels` — Ship icons, trails, halos, compass rose (60fps)
7. `atmosphere` — Fog vignette overlay (static)

### Directory Structure
```
src/
├── index.js          # FleetMap main class — public API entry point
├── config.js         # DEFAULTS + mergeConfig()
├── core.js           # CanvasManager — 7-layer canvas stack
├── projection.js     # Equirectangular lat/lon ↔ screen
├── ais.js            # AIS REST polling client
├── roster.js         # Vessel sidebar/panel UI
├── interaction.js    # Mouse/touch hover + click
├── styles.css        # CSS custom properties design system
├── layers/           # Canvas rendering layers
├── data/             # Geographic datasets (coast + currents)
├── assets/           # Modular asset design system
│   ├── scale.js      # Sizing constants + scaleFor()
│   ├── renderer.js   # AssetRenderer — bridges registry → canvas
│   ├── registry.js   # AssetRegistry — symbol/theme discovery
│   ├── symbols/      # 7 symbol packs (53 symbols total)
│   ├── themes/       # 5 theme packs + base interface
│   └── text/         # Label system (12 text styles)
└── services/         # External data integrations
    ├── noaa.js       # Live NOAA weather API client
    └── vessel-comms.js  # Captain's log / messaging (stub)
```

### Critical Patterns

**Dual call signatures**: The layer draw functions (`drawVessels`, `drawCoast`, `drawDepth`) support TWO call patterns:
- CanvasManager style: `drawVessels(ctx, cm, vessels, config, t, renderer)` — used by `index.js`
- Explicit style: `drawVessels(ctx, w, h, projFn, config, t, vessels, renderer)` — used standalone

The demos in `demos/viking-village/layers/` OVERRIDE the `src/layers/` files with their own region-specific implementations. The `index.js` always uses the CanvasManager call pattern.

**Config merging**: `mergeConfig()` does shallow copy for top-level keys but deep merges `colors`, `fonts`, `assets`, `weather`, and `comms` objects.

**Color format**: All colors use `rgba(r,g,b,a)` strings. Status colors are derived by regex-replacing the alpha: `base.replace(/[\d.]+\)$/, alpha + ')')`.

## Development Rules

### Do
- Keep zero-dependency philosophy — no npm, no build tools
- Use `var` not `let/const` — intentional for compat
- All new symbols must implement a `draw(ctx, size, color, t)` function at minimum
- New vessel types need all 3 variants: `drawTopDown`, `drawProfile`, `drawIcon`
- New themes must use `createTheme()` from `theme.js` and register in `registry.js`
- Test in both demos (Viking Village NJ + D'Ascola Brazil)

### Don't
- Don't add npm dependencies or build steps
- Don't use arrow functions or template literals in core src/ (ES5 compat)
- Don't modify demo layer files when changing src/layers — demos override intentionally
- Don't hardcode colors — always use `config.colors` or theme colors
- Don't break the existing `updateVessels()` API — dashboards depend on it

## Data Formats

### Vessel Object
```js
{ name, mmsi, lat, lon, heading, speed, type, status, catch,
  // Optional future fields:
  eta, etaPort, message, messageTs, messagePublic, catchWeight,
  fuelLevel, crewCount, permissions }
```

### Marker Object
```js
{ type: 'buoy-red'|'lighthouse'|..., lat, lon, name?, light? }
```

### Weather Station (from NOAA)
```js
{ lat, lon, conditions, wind: { speed, direction, gust },
  waves: { height, period }, temperature: { value, unit } }
```

## Business Context

This is being productized as a SaaS platform. Key requirements:
- **Multi-tenant**: Each customer gets their own fleet config, theme, branding
- **Theme presets**: Customers pick from 5 built-in themes or request custom
- **Monthly billing**: Google Cloud deployment with Stripe integration planned
- **Dashboard**: Customer-facing admin panel for fleet management
- **Data privacy**: Vessel comms have permission levels (public, fleet, owner)

## Testing

No automated test suite yet. Visual verification:
1. Load Viking Village demo — check vessel rendering, trails, compass
2. Load D'Ascola demo — check coastline, currents, ports
3. Add `theme: 'tactical'` to config — verify green CRT aesthetic
4. Add `weather: { enabled: true, points: [...] }` — verify NOAA icons
5. Add `markers: [...]` — verify buoys render at positions
6. Call `map.setTheme('treasure-map')` in console — verify live theme switch
