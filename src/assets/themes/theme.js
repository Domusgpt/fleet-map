/**
 * Fleet Map — Theme Base Interface
 * ===================================
 * Defines the standard structure all themes must follow.
 * Themes override colors, fonts, symbol styles, emphasis, atmosphere,
 * and decorative elements while keeping the same entity types.
 *
 * Usage:
 *   import { createTheme } from './theme.js';
 *   var myTheme = createTheme('my-theme', 'My Theme', { colors: {...}, ... });
 */

/**
 * Default theme values. Themes override specific properties.
 */
export var THEME_DEFAULTS = {
  id: 'base',
  name: 'Base',

  // Color palette — matches config.colors structure
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

  // Font stacks
  fonts: {
    display: '"Playfair Display", Georgia, serif',
    sans:    '"Josefin Sans", sans-serif',
  },

  // Per-symbol style overrides
  symbols: {
    vessel: {
      style: 'profile',        // 'topDown' | 'profile' | 'icon'
      strokeWidth: 0.5,
      fillAlpha: 0.9,
      glowRadius: 32,
      trailStyle: 'line',       // 'line' | 'dotted' | 'none'
    },
    port: {
      shape: 'dock',            // symbol ID
      pulseSpeed: 2.5,
      labelStyle: 'upper',
    },
    buoy: {
      bobAnimation: true,
      reflectionEnabled: false,
    },
    weather: {
      iconStyle: 'filled',      // 'filled' | 'outlined' | 'hand-drawn'
    },
  },

  // Scale emphasis multipliers
  emphasis: {
    vessel:  1.0,
    port:    1.5,
    marker:  1.0,
    icon:    1.0,
    text:    1.0,
    compass: 1.0,
  },

  // Canvas post-processing
  atmosphere: {
    vignetteStrength: 0.6,
    noiseTexture: true,
    colorFilter: null,          // null or 'sepia' | 'crt-green' | 'crt-amber'
  },

  // Special decorative elements
  decorations: {
    compassRose: 'classic',     // 'classic' | 'ornate' | 'minimal' | 'tactical'
    cartouche: 'bordered',      // 'bordered' | 'ribbon' | 'none' | 'scroll'
    borderStyle: 'double-line', // 'double-line' | 'rope' | 'none' | 'scanline'
    seaMonsters: false,
  },
};

/**
 * Create a theme by merging overrides into the base defaults.
 *
 * @param {string} id — unique theme identifier
 * @param {string} name — display name
 * @param {object} overrides — partial theme properties to override
 * @returns {object} complete theme object
 */
export function createTheme(id, name, overrides) {
  var theme = {};
  var key;

  // Copy defaults
  for (key in THEME_DEFAULTS) {
    if (THEME_DEFAULTS.hasOwnProperty(key)) {
      theme[key] = THEME_DEFAULTS[key];
    }
  }

  theme.id = id;
  theme.name = name;

  if (!overrides) return theme;

  // Merge top-level primitives
  for (key in overrides) {
    if (!overrides.hasOwnProperty(key)) continue;

    if (key === 'colors' || key === 'fonts' || key === 'symbols' ||
        key === 'emphasis' || key === 'atmosphere' || key === 'decorations') {
      // Deep merge objects
      theme[key] = _merge(THEME_DEFAULTS[key], overrides[key]);
    } else {
      theme[key] = overrides[key];
    }
  }

  return theme;
}

/**
 * Shallow merge two objects (one level deep).
 * @private
 */
function _merge(defaults, overrides) {
  if (!defaults) return overrides || {};
  if (!overrides) return defaults;

  var result = {};
  var k;
  for (k in defaults) {
    if (defaults.hasOwnProperty(k)) {
      result[k] = defaults[k];
    }
  }
  for (k in overrides) {
    if (overrides.hasOwnProperty(k)) {
      if (typeof overrides[k] === 'object' && !Array.isArray(overrides[k]) &&
          typeof result[k] === 'object' && !Array.isArray(result[k])) {
        // One more level of merge for nested objects like symbols.vessel
        result[k] = _merge(result[k], overrides[k]);
      } else {
        result[k] = overrides[k];
      }
    }
  }
  return result;
}
