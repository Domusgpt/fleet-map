/**
 * FleetMap — Default Configuration
 * Override any of these when instantiating FleetMap.
 */

export var DEFAULTS = {
  // Company branding
  title: 'Fleet Tracker',
  subtitle: '',

  // Map geographic bounds
  bounds: { latN: -15, latS: -35, lonW: -55, lonE: -25 },

  // Performance
  particleCount: 250,
  particleCountMobile: 100,
  trailLength: 20,
  mobileBreakpoint: 900,

  // AIS integration
  aisEndpoint: null,   // URL string — null = use simulated drift
  aisRefreshMs: 60000, // 60 seconds

  // Color palette (CSS color strings)
  colors: {
    deep:      'rgba(4,10,16,1)',
    ouro:      'rgba(201,168,76,1)',
    verde:     'rgba(0,104,71,1)',
    blade:     'rgba(139,175,196,1)',
    creme:     'rgba(240,235,224,1)',
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

  // Vessels — array of vessel objects
  // Each vessel: { name, mmsi?, lat, lon, heading, speed, type, status, catch }
  vessels: [],

  // Ports — array of port objects
  // Each port: { name, lat, lon, size: 'major'|'minor' }
  ports: [],

  // Shipping routes — array of route arrays
  // Each route: { name, points: [[lat,lon], ...] }
  routes: [],

  // Coast data key — which coastline dataset to load
  // Built-in: 'brazil'. Or provide custom coast points array.
  coastData: 'brazil',

  // Current flow definitions
  // Built-in: 'south-atlantic'. Or provide custom array.
  currentData: 'south-atlantic',

  // Theme — which visual theme pack to use
  // Built-in: 'classic-nautical', 'treasure-map', 'tactical', 'minimal', 'tropical'
  theme: 'classic-nautical',

  // Asset rendering options
  assets: {
    vesselStyle: 'auto',       // 'auto' (theme default), 'topDown', 'profile', 'icon', 'triangle'
    showFacilities: true,      // show port facility icons
    showStatusBadges: false,   // show status pills on vessels
    showETA: false,            // show ETA to port
  },

  // Weather overlay (NOAA integration)
  weather: {
    enabled: false,            // set true to activate weather layer
    refreshMs: 900000,         // 15 minutes
    points: [],                // [{ lat, lon, name? }] — forecast grid points
    alertZone: null,           // NOAA marine zone code (e.g. 'ANZ335')
    showWind: true,
    showWaves: true,
    showTemp: false,
    showWarnings: true,
  },

  // Channel markers and navigation aids
  // Each marker: { type, lat, lon, name?, light? }
  markers: [],

  // Vessel communications (future)
  comms: {
    endpoint: null,            // REST API for captain's log / messaging
    refreshMs: 30000,
  },

  // Callbacks
  onVesselHover: null,   // function(vessel, screenPos) {}
  onVesselClick: null,   // function(vessel) {}
  onAISUpdate: null,     // function(vessels) {}
  onWeatherUpdate: null, // function(weatherData) {}
};

/**
 * Merge user config with defaults (shallow + nested colors/fonts).
 */
export function mergeConfig(userConfig) {
  var cfg = {};
  var key;
  for (key in DEFAULTS) {
    if (DEFAULTS.hasOwnProperty(key)) {
      cfg[key] = DEFAULTS[key];
    }
  }
  if (!userConfig) return cfg;
  for (key in userConfig) {
    if (!userConfig.hasOwnProperty(key)) continue;
    if (key === 'colors' || key === 'fonts' || key === 'assets' || key === 'weather' || key === 'comms') {
      cfg[key] = {};
      var def = DEFAULTS[key];
      var usr = userConfig[key] || {};
      for (var k in def) { if (def.hasOwnProperty(k)) cfg[key][k] = def[k]; }
      for (var k2 in usr) { if (usr.hasOwnProperty(k2)) cfg[key][k2] = usr[k2]; }
    } else {
      cfg[key] = userConfig[key];
    }
  }
  return cfg;
}
