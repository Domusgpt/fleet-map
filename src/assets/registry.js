/**
 * Fleet Map — Asset Registry
 * ============================
 * Central registry for discovering and loading symbol packs and themes.
 * All built-in assets are registered at startup. Custom packs can be
 * registered at runtime for customer-specific presets.
 *
 * Usage:
 *   import { createDefaultRegistry } from './assets/registry.js';
 *   var registry = createDefaultRegistry();
 *   var symbol = registry.getSymbol('vessels', 'trawler');
 *   var theme  = registry.getTheme('classic-nautical');
 */

// Built-in symbol packs
import { VESSEL_SYMBOLS }   from './symbols/vessels.js';
import { NAV_AID_SYMBOLS }  from './symbols/nav-aids.js';
import { CHANNEL_SYMBOLS }  from './symbols/channel-markers.js';
import { PORT_SYMBOLS }     from './symbols/ports.js';
import { WEATHER_SYMBOLS }  from './symbols/weather.js';
import { CARTO_SYMBOLS }    from './symbols/cartography.js';
import { STATUS_SYMBOLS }   from './symbols/status.js';

// Built-in themes
import { CLASSIC_NAUTICAL } from './themes/classic-nautical.js';
import { TREASURE_MAP }     from './themes/treasure-map.js';
import { TACTICAL }         from './themes/tactical.js';
import { MINIMAL }          from './themes/minimal.js';
import { TROPICAL }         from './themes/tropical.js';

export class AssetRegistry {
  constructor() {
    /** @type {Object<string, Object<string, object>>} category → { id → symbol } */
    this.symbols = {};
    /** @type {Object<string, object>} themeId → theme object */
    this.themes = {};
  }

  // -------------------------------------------------------------------
  // Symbols
  // -------------------------------------------------------------------

  /**
   * Register a map of symbols under a category.
   * @param {string} category — e.g. 'vessels', 'nav-aids', 'weather'
   * @param {Object<string, object>} symbolMap — { id: symbolDef, ... }
   */
  registerSymbols(category, symbolMap) {
    if (!this.symbols[category]) {
      this.symbols[category] = {};
    }
    for (var id in symbolMap) {
      if (symbolMap.hasOwnProperty(id)) {
        this.symbols[category][id] = symbolMap[id];
      }
    }
  }

  /**
   * Get a single symbol definition.
   * @param {string} category
   * @param {string} id
   * @returns {object|null}
   */
  getSymbol(category, id) {
    var cat = this.symbols[category];
    return (cat && cat[id]) || null;
  }

  /**
   * List all symbol IDs in a category.
   * @param {string} [category] — if omitted, returns all categories
   * @returns {string[]}
   */
  listSymbols(category) {
    if (category) {
      return this.symbols[category] ? Object.keys(this.symbols[category]) : [];
    }
    return Object.keys(this.symbols);
  }

  /**
   * Get all symbols in a category.
   * @param {string} category
   * @returns {Object<string, object>}
   */
  getCategory(category) {
    return this.symbols[category] || {};
  }

  // -------------------------------------------------------------------
  // Themes
  // -------------------------------------------------------------------

  /**
   * Register a theme.
   * @param {object} theme — must have an `id` property
   */
  registerTheme(theme) {
    if (!theme || !theme.id) {
      throw new Error('AssetRegistry: theme must have an id');
    }
    this.themes[theme.id] = theme;
  }

  /**
   * Get a theme by ID.
   * @param {string} id
   * @returns {object|null}
   */
  getTheme(id) {
    return this.themes[id] || null;
  }

  /**
   * List all registered theme IDs.
   * @returns {string[]}
   */
  listThemes() {
    return Object.keys(this.themes);
  }
}

/**
 * Create a registry pre-loaded with all built-in symbols and themes.
 * @returns {AssetRegistry}
 */
export function createDefaultRegistry() {
  var reg = new AssetRegistry();

  // Register built-in symbol packs
  reg.registerSymbols('vessels',         VESSEL_SYMBOLS);
  reg.registerSymbols('nav-aids',        NAV_AID_SYMBOLS);
  reg.registerSymbols('channel-markers', CHANNEL_SYMBOLS);
  reg.registerSymbols('ports',           PORT_SYMBOLS);
  reg.registerSymbols('weather',         WEATHER_SYMBOLS);
  reg.registerSymbols('cartography',     CARTO_SYMBOLS);
  reg.registerSymbols('status',          STATUS_SYMBOLS);

  // Register built-in themes
  reg.registerTheme(CLASSIC_NAUTICAL);
  reg.registerTheme(TREASURE_MAP);
  reg.registerTheme(TACTICAL);
  reg.registerTheme(MINIMAL);
  reg.registerTheme(TROPICAL);

  return reg;
}
