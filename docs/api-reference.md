# Fleet Map — API Reference

Complete reference for the Fleet Map JavaScript API. All classes and functions are exported as ES modules.

---

## FleetMap

The main entry point. Creates and manages a fleet tracking map instance.

### Constructor

```js
import { FleetMap } from './src/index.js';

var map = new FleetMap(selector, config);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | `string \| HTMLElement` | CSS selector or DOM element for the `.fleet-map` container |
| `config` | `object` | Configuration overrides (see [Configuration](#configuration)) |

### Methods

#### `map.start()`

Begin rendering, AIS polling, and NOAA weather fetching. Call once after construction.

#### `map.stop()`

Pause all rendering and data polling. Can be resumed with `start()`.

#### `map.destroy()`

Clean up all resources, remove event listeners, release canvas contexts. Call when removing the map from the page. Instance cannot be reused after this.

#### `map.updateVessels(vessels)`

Replace the entire vessel list. Automatically rebuilds the roster panel and updates statistics.

```js
map.updateVessels([
  { name: 'F/V Karen L', lat: 39.85, lon: -73.65, heading: 135, speed: 7.2,
    type: 'Scalloper', status: 'Fishing', catch: 'Sea Scallops', mmsi: '338123456' }
]);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `vessels` | `Array<Vessel>` | New array of vessel objects |

#### `map.updateWeather(weatherData)`

Manually provide weather data (alternative to automatic NOAA polling).

```js
map.updateWeather({
  stations: [
    { lat: 39.7, lon: -73.8, wind: { speed: 15, direction: 225, gust: 22 },
      waves: { height: 4, period: 8 }, conditions: 'Partly Cloudy',
      temperature: { value: 62, unit: 'F' } }
  ],
  warnings: []
});
```

#### `map.updateMarkers(markers)`

Replace channel markers and navigation aids.

```js
map.updateMarkers([
  { type: 'buoy-red',   lat: 39.76, lon: -74.10, name: 'R2', light: 'Fl R 4s' },
  { type: 'buoy-green', lat: 39.76, lon: -74.11, name: 'G1' },
  { type: 'lighthouse', lat: 39.76, lon: -74.07, name: 'Barnegat Light' },
]);
```

#### `map.setTheme(themeId)`

Switch visual theme at runtime. All layers redraw automatically.

```js
map.setTheme('tactical');     // CRT green terminal
map.setTheme('treasure-map'); // Old parchment
map.setTheme('minimal');      // Clean modern
map.setTheme('tropical');     // Bright beach vibes
map.setTheme('classic-nautical'); // Default gold/blue
```

#### `map.getRegistry()`

Access the asset registry for registering custom symbols or themes.

```js
var registry = map.getRegistry();
registry.registerTheme(myCustomTheme);
registry.registerSymbols('vessels', { 'my-boat': myBoatSymbol });
```

Returns: `AssetRegistry`

#### `map.resize()`

Manually trigger a resize. Usually not needed — the map auto-resizes on window resize.

---

## Configuration

All configuration options with defaults:

```js
var config = {
  // Branding
  title: 'Fleet Tracker',
  subtitle: '',

  // Geographic bounds (decimal degrees)
  bounds: { latN: -15, latS: -35, lonW: -55, lonE: -25 },

  // Performance
  particleCount: 250,         // Ocean current particles (desktop)
  particleCountMobile: 100,   // Ocean current particles (mobile)
  trailLength: 20,            // Vessel wake trail positions
  mobileBreakpoint: 900,      // CSS breakpoint (px)

  // AIS live tracking
  aisEndpoint: null,          // REST URL or null for simulated drift
  aisRefreshMs: 60000,        // 60 seconds

  // Theme
  theme: 'classic-nautical',  // Theme pack ID

  // Asset rendering
  assets: {
    vesselStyle: 'auto',      // 'auto'|'topDown'|'profile'|'icon'|'triangle'
    showFacilities: true,     // Port facility icons
    showStatusBadges: false,  // Status pills on vessels
    showETA: false,           // ETA to port display
  },

  // NOAA weather (live API, no key required)
  weather: {
    enabled: false,
    refreshMs: 900000,        // 15 minutes
    points: [],               // [{ lat, lon, name? }]
    alertZone: null,          // NOAA zone code (e.g. 'ANZ335')
    showWind: true,
    showWaves: true,
    showTemp: false,
    showWarnings: true,
  },

  // Channel markers & nav aids
  markers: [],

  // Vessel communications (future)
  comms: {
    endpoint: null,
    refreshMs: 30000,
  },

  // Colors (CSS rgba strings)
  colors: {
    deep:      'rgba(4,10,16,1)',        // Ocean background
    ouro:      'rgba(201,168,76,1)',     // Gold accent
    verde:     'rgba(0,104,71,1)',       // Green (in-port)
    blade:     'rgba(139,175,196,1)',    // Steel blue (transit)
    creme:     'rgba(240,235,224,1)',    // Light text
    land:      ['rgba(0,42,31,0.6)', 'rgba(0,59,46,0.5)', 'rgba(0,42,31,0.4)'],
    ocean:     ['rgba(13,34,64,0.35)', 'rgba(10,28,50,0.2)', 'rgba(4,10,16,0.05)'],
    fathom:    'rgba(27,58,92,0.12)',
    grid:      'rgba(201,168,76,0.04)',
    coastGlow: 'rgba(201,168,76,0.08)',
    coastLine: 'rgba(201,168,76,0.35)',
  },

  // Fonts (must be loaded by the host page)
  fonts: {
    display: '"Playfair Display", Georgia, serif',
    sans:    '"Josefin Sans", sans-serif',
  },

  // Data
  vessels: [],
  ports: [],
  routes: [],
  coastData: 'brazil',          // 'brazil'|'lbi'|custom array
  currentData: 'south-atlantic', // 'south-atlantic'|'nj-atlantic'|custom array

  // Callbacks
  onVesselHover: null,    // function(vessel, { x, y })
  onVesselClick: null,    // function(vessel)
  onAISUpdate: null,      // function(vessels)
  onWeatherUpdate: null,  // function(weatherData)
};
```

---

## Data Formats

### Vessel

```js
{
  name: 'F/V Karen L',       // Display name
  mmsi: '338123456',          // AIS MMSI (optional, enables live tracking)
  lat: 39.85,                 // Latitude (negative = south)
  lon: -73.65,                // Longitude (negative = west)
  heading: 135,               // Degrees (0=N, 90=E, 180=S, 270=W)
  speed: 7.2,                 // Knots
  type: 'Scalloper',          // Vessel type (see vessel types below)
  status: 'Fishing',          // Status (see statuses below)
  catch: 'Sea Scallops',      // Current catch description

  // Optional future fields
  eta: '14:30',               // Estimated arrival time
  etaPort: 'Barnegat Light',  // Destination port
  message: 'Good haul today', // Captain's log message
  catchWeight: 1200,          // Catch weight (lbs)
  fuelLevel: 0.65,            // Fuel percentage (0-1)
}
```

**Vessel Types**: `Trawler`, `Dragger`, `Longliner`, `Scalloper`, `Gillnetter`, `Lobster`, `Cargo`, `Sailboat`

**Vessel Statuses**: `Fishing`, `Scalloping`, `In Transit`, `Returning`, `In Port`

### Port

```js
{
  name: 'Barnegat Light',
  lat: 39.76,
  lon: -74.11,
  size: 'major',              // 'major' or 'minor'
  facilities: ['fuel', 'ice-house', 'fish-market'],  // optional
}
```

**Facility Types**: `dock`, `mooring`, `fuel`, `ice-house`, `fish-market`, `boat-ramp`, `harbor-master`, `anchorage`

### Route

```js
{
  name: 'US East Coast',
  points: [[-23.96, -46.33], [-22, -42], [5, -40], [40.7, -74]],
}
```

### Marker

```js
{
  type: 'buoy-red',           // Symbol type (see marker types below)
  lat: 39.76,
  lon: -74.10,
  name: 'R2',                 // Optional display label
  light: 'Fl R 4s',           // Optional light characteristic
}
```

**Nav Aid Types**: `buoy-red`, `buoy-green`, `buoy-yellow`, `buoy-cardinal-n`, `buoy-cardinal-s`, `buoy-cardinal-e`, `buoy-cardinal-w`, `lighthouse`, `beacon`, `daymark-triangle`, `daymark-square`

**Channel Marker Types**: `lateral-port`, `lateral-starboard`, `safe-water`, `isolated-danger`, `special`

---

## AIS Integration

Fleet Map polls any REST endpoint that returns vessel position data:

```js
var map = new FleetMap('#fleetMap', {
  aisEndpoint: 'https://your-api.com/api/vessels',
  aisRefreshMs: 60000,
});
```

**Expected API response** (JSON array):

```json
[
  {
    "mmsi": "338123456",
    "lat": 39.85,
    "lon": -73.65,
    "heading": 135,
    "speed": 7.2,
    "name": "F/V Karen L",
    "status": "Fishing",
    "timestamp": "2025-01-15T14:30:00Z"
  }
]
```

The client sends: `GET {endpoint}?mmsi=338123456,338654321,...`

Vessels are matched by MMSI and positions merge into the local vessel array.

---

## NOAA Weather Integration

Enable live marine weather from NOAA (free, no API key):

```js
var map = new FleetMap('#fleetMap', {
  weather: {
    enabled: true,
    refreshMs: 900000,
    points: [
      { lat: 39.5, lon: -73.8, name: 'Offshore NJ' },
      { lat: 39.8, lon: -74.0, name: 'Near Shore' },
    ],
    alertZone: 'ANZ335',
    showWind: true,
    showWaves: true,
    showWarnings: true,
  },
});
```

Weather updates trigger the `onWeatherUpdate` callback with station and warning data.

---

## Asset Registry

Register custom symbols and themes at runtime:

```js
var registry = map.getRegistry();

// Custom vessel symbol
registry.registerSymbols('vessels', {
  'research-vessel': {
    id: 'research-vessel',
    drawTopDown: function(ctx, size, color) { /* ... */ },
    drawProfile: function(ctx, size, color) { /* ... */ },
    drawIcon: function(ctx, size, color) { /* ... */ },
  }
});

// Custom theme
import { createTheme } from './src/assets/themes/theme.js';

var myTheme = createTheme('my-brand', 'My Brand', {
  colors: { deep: 'rgba(10,20,40,1)', ouro: 'rgba(255,100,50,1)' },
  fonts: { display: '"My Font", serif' },
  symbols: { vessel: { style: 'topDown' } },
});

registry.registerTheme(myTheme);
map.setTheme('my-brand');
```

---

## Events & Callbacks

```js
var map = new FleetMap('#fleetMap', {
  onVesselHover: function(vessel, screenPos) {
    console.log(vessel.name, 'at', screenPos.x, screenPos.y);
  },
  onVesselClick: function(vessel) {
    showVesselDetail(vessel);
  },
  onAISUpdate: function(vessels) {
    updateDashboardTable(vessels);
  },
  onWeatherUpdate: function(data) {
    updateWeatherPanel(data.stations, data.warnings);
  },
});
```
