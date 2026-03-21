/**
 * Fleet Map — Main Entry Point
 * =============================
 * A reusable, configurable fleet tracking map for the fishing industry.
 *
 * Usage:
 *   import { FleetMap } from './fleet-map/index.js';
 *
 *   var map = new FleetMap('#fleetMap', {
 *     title: 'My Fleet',
 *     bounds: { latN: -15, latS: -35, lonW: -55, lonE: -25 },
 *     vessels: [ { name: 'Boat 1', lat: -24, lon: -44, heading: 135, speed: 7, type: 'Longliner', status: 'Fishing', catch: 'Swordfish' } ],
 *     ports: [ { name: 'Santos', lat: -23.96, lon: -46.33, size: 'major' } ],
 *     routes: [ { name: 'US East Coast', points: [[-23.96,-46.33],[-22,-42],[5,-40],[40.7,-74]] } ],
 *   });
 *
 *   map.start();  // Begin rendering
 *   map.stop();   // Pause
 *   map.destroy(); // Clean up
 *   map.updateVessels([...]); // Update vessel data (e.g., from dashboard)
 *
 * Configuration:
 *   See config.js for all available options including colors, fonts,
 *   AIS endpoint, particle count, and more.
 *
 * Vessel Data Format:
 *   Each vessel object: {
 *     name: string,         — Display name
 *     mmsi: string|null,    — AIS MMSI number (for live tracking)
 *     lat: number,          — Latitude (decimal degrees, negative = south)
 *     lon: number,          — Longitude (decimal degrees, negative = west)
 *     heading: number,      — Heading in degrees (0 = north, 90 = east)
 *     speed: number,        — Speed in knots
 *     type: string,         — Vessel type ('Longliner', 'Trawler', etc.)
 *     status: string,       — 'Fishing' | 'In Transit' | 'In Port' | 'Returning'
 *     catch: string,        — Current catch description
 *   }
 *
 * Adding/Removing Vessels:
 *   Simply call map.updateVessels(newArray) with the updated list.
 *   The roster panel, stats, and map all update automatically.
 *   For a future dashboard UI, this method is the integration point.
 */

import { mergeConfig } from './config.js';
import { CanvasManager } from './core.js';
import { drawDepth } from './layers/depth.js';
import { drawCurrents, initParticles } from './layers/currents.js';
import { drawCoast } from './layers/coast.js';
import { drawVessels } from './layers/vessels.js';
import { drawAtmosphere } from './layers/atmosphere.js';
import { drawWeather } from './layers/weather.js';
import { drawMarkers } from './layers/markers.js';
import { buildRoster } from './roster.js';
import { setupInteraction } from './interaction.js';
import { AISClient } from './ais.js';
import { BRAZIL_COAST } from './data/brazil-coast.js';
import { SA_CURRENTS } from './data/currents-sa.js';
import { createDefaultRegistry } from './assets/registry.js';
import { AssetRenderer } from './assets/renderer.js';
import { NOAAClient } from './services/noaa.js';

/**
 * Deep-copy an array of plain objects (one level deep).
 */
function cloneArray(arr) {
  if (!arr) return [];
  var out = [];
  for (var i = 0; i < arr.length; i++) {
    var obj = arr[i];
    var copy = {};
    for (var k in obj) {
      if (obj.hasOwnProperty(k)) {
        copy[k] = obj[k];
      }
    }
    out.push(copy);
  }
  return out;
}

/**
 * Ensure each vessel in the array has a trail and screen-position fields.
 */
function prepareVessels(vessels) {
  for (var i = 0; i < vessels.length; i++) {
    var v = vessels[i];
    if (!v.trail) v.trail = [];
    if (v._sx === undefined) v._sx = 0;
    if (v._sy === undefined) v._sy = 0;
  }
  return vessels;
}

export class FleetMap {
  /**
   * @param {string|HTMLElement} selector — CSS selector or DOM element for the .fleet-map container
   * @param {object} userConfig — configuration overrides (see config.js for defaults)
   */
  constructor(selector, userConfig) {
    // Merge user config with defaults
    this.config = mergeConfig(userConfig);

    // Resolve container element
    if (typeof selector === 'string') {
      this.container = document.querySelector(selector);
    } else {
      this.container = selector;
    }
    if (!this.container) {
      throw new Error('FleetMap: container not found — ' + selector);
    }

    // Deep copy vessel, port, and route data so we don't mutate originals
    this.vessels = prepareVessels(cloneArray(this.config.vessels));
    this.ports = cloneArray(this.config.ports);
    this.routes = cloneArray(this.config.routes);

    // Resolve coast data
    if (this.config.coastData === 'brazil') {
      this.coastData = BRAZIL_COAST;
    } else if (Array.isArray(this.config.coastData)) {
      this.coastData = this.config.coastData;
    } else {
      this.coastData = [];
    }

    // Resolve current flow data
    if (this.config.currentData === 'south-atlantic') {
      this.currentData = SA_CURRENTS;
    } else if (Array.isArray(this.config.currentData)) {
      this.currentData = this.config.currentData;
    } else {
      this.currentData = [];
    }

    // Create canvas manager
    this.cm = new CanvasManager(this.container, this.config);

    // Init current particles
    this.particles = initParticles(this.config);

    // Build roster panel
    this.rosterEl = buildRoster(this.container, this.vessels, this.config);

    // Setup mouse/touch interaction
    this._interactionCleanup = setupInteraction(this.cm, this.vessels, this.config);

    // AIS live-tracking client
    this.aisClient = null;
    if (this.config.aisEndpoint) {
      this.aisClient = new AISClient(this.config.aisEndpoint, this.config.aisRefreshMs);
    }

    // Asset system — registry, theme, renderer
    this.registry = createDefaultRegistry();
    this.theme = this.registry.getTheme(this.config.theme || 'classic-nautical') || this.registry.getTheme('classic-nautical');
    this.renderer = new AssetRenderer(this.registry, this.theme, this.cm.w);

    // Markers data
    this.markers = cloneArray(this.config.markers);

    // NOAA weather client
    this.noaaClient = null;
    this.weatherData = null;
    if (this.config.weather && this.config.weather.enabled) {
      this.noaaClient = new NOAAClient(this.config.weather);
    }

    // State
    this.started = false;
    this._resizeBound = this.resize.bind(this);
  }

  /**
   * Begin rendering and (optionally) AIS polling.
   */
  start() {
    if (this.started) return;
    this.started = true;

    // Draw static layers once — they'll render on the next frame
    this._drawStatic();

    // Start the animation loop
    var self = this;
    this.cm.startLoop(function (t) {
      self._draw(t);
    });

    // Start AIS polling if configured
    if (this.aisClient) {
      var self2 = this;
      this.aisClient.start(function (updatedVessels) {
        self2.updateVessels(updatedVessels);
      });
    }

    // Start NOAA weather polling if configured
    if (this.noaaClient) {
      var self3 = this;
      this.noaaClient.start(function (weatherData) {
        self3.weatherData = weatherData;
        self3.cm.markDirty('weather');
        if (self3.config && typeof self3.config.onWeatherUpdate === 'function') {
          self3.config.onWeatherUpdate(weatherData);
        }
      });
    }

    // Listen for window resize
    window.addEventListener('resize', this._resizeBound);
  }

  /**
   * Pause rendering and AIS polling.
   */
  stop() {
    if (!this.started) return;
    this.started = false;

    this.cm.stopLoop();

    if (this.aisClient) {
      this.aisClient.stop();
    }
    if (this.noaaClient) {
      this.noaaClient.stop();
    }
  }

  /**
   * Clean up all resources. Call this when removing the map from the page.
   */
  destroy() {
    this.stop();

    window.removeEventListener('resize', this._resizeBound);

    if (this._interactionCleanup) {
      this._interactionCleanup();
      this._interactionCleanup = null;
    }

    if (this.cm) {
      this.cm.destroy();
      this.cm = null;
    }

    if (this.aisClient) {
      this.aisClient.stop();
      this.aisClient = null;
    }
    if (this.noaaClient) {
      this.noaaClient.stop();
      this.noaaClient = null;
    }

    this.vessels = null;
    this.ports = null;
    this.routes = null;
    this.markers = null;
    this.coastData = null;
    this.currentData = null;
    this.particles = null;
    this.weatherData = null;
    this.registry = null;
    this.renderer = null;
    this.theme = null;
    this.rosterEl = null;
    this.container = null;
    this.config = null;
  }

  /**
   * Replace the vessel list. Rebuilds the roster and updates stats.
   * This is the main integration point for dashboard UIs.
   *
   * @param {Array} arr — new array of vessel objects
   */
  updateVessels(arr) {
    this.vessels = prepareVessels(cloneArray(arr));

    // Rebuild the roster panel
    if (this.container && this.config) {
      this.rosterEl = buildRoster(this.container, this.vessels, this.config);
    }

    // Update stats display
    this._updateStats();

    // Fire callback
    if (this.config && typeof this.config.onAISUpdate === 'function') {
      this.config.onAISUpdate(this.vessels);
    }
  }

  /**
   * Update weather data manually (alternative to NOAA auto-polling).
   * @param {object} weatherData — { stations: [...], warnings: [...] }
   */
  updateWeather(weatherData) {
    this.weatherData = weatherData;
    if (this.cm) this.cm.markDirty('weather');
  }

  /**
   * Update markers data.
   * @param {Array} markers — array of marker objects
   */
  updateMarkers(markers) {
    this.markers = cloneArray(markers);
    if (this.cm) this.cm.markDirty('markers');
  }

  /**
   * Switch theme at runtime.
   * @param {string} themeId — theme identifier
   */
  setTheme(themeId) {
    var theme = this.registry.getTheme(themeId);
    if (!theme) return;
    this.theme = theme;
    this.renderer = new AssetRenderer(this.registry, theme, this.cm ? this.cm.w : 1200);

    // Apply theme colors to config for layer compatibility
    if (theme.colors) {
      for (var k in theme.colors) {
        if (theme.colors.hasOwnProperty(k)) {
          this.config.colors[k] = theme.colors[k];
        }
      }
    }
    if (theme.fonts) {
      for (var f in theme.fonts) {
        if (theme.fonts.hasOwnProperty(f)) {
          this.config.fonts[f] = theme.fonts[f];
        }
      }
    }

    // Redraw everything
    if (this.cm) {
      this.cm.markDirty('depth');
      this.cm.markDirty('coast');
      this.cm.markDirty('markers');
      this.cm.markDirty('weather');
      this.cm.markDirty('atmosphere');
    }
    this._drawStatic();
  }

  /**
   * Get the asset registry for custom symbol/theme registration.
   * @returns {import('./assets/registry.js').AssetRegistry}
   */
  getRegistry() {
    return this.registry;
  }

  /**
   * Handle container resize.
   */
  resize() {
    if (!this.cm) return;

    this.cm.resize();

    // All layers need redraw after resize
    this.cm.markDirty('depth');
    this.cm.markDirty('currents');
    this.cm.markDirty('coast');
    this.cm.markDirty('markers');
    this.cm.markDirty('weather');
    this.cm.markDirty('vessels');
    this.cm.markDirty('atmosphere');

    // Update renderer canvas width
    if (this.renderer) {
      this.renderer.setWidth(this.cm.w);
    }

    // Redraw static layers
    this._drawStatic();
  }

  /**
   * Main per-frame draw function. Called by the canvas manager loop.
   * @param {number} t — elapsed time counter
   * @private
   */
  _draw(t) {
    var cm = this.cm;
    if (!cm) return;

    // --- Static layers: only redraw when dirty ---

    var depthLayer = cm.getLayer('depth');
    if (depthLayer.dirty) {
      drawDepth(depthLayer.ctx, cm, this.config);
      depthLayer.dirty = false;
    }

    var coastLayer = cm.getLayer('coast');
    if (coastLayer.dirty) {
      drawCoast(coastLayer.ctx, cm, this.coastData, this.ports, this.routes, this.config, t, this.renderer);
      coastLayer.dirty = false;
    }

    // Markers layer (semi-static, redraws when dirty or has animated elements)
    var markersLayer = cm.getLayer('markers');
    if (markersLayer && markersLayer.dirty) {
      var projFnM = cm.proj.bind(cm);
      drawMarkers(markersLayer.ctx, cm.w, cm.h, projFnM, this.config, t, this.markers, this.renderer);
      markersLayer.dirty = false;
    }

    // Weather layer (semi-static, redraws when dirty)
    var weatherLayer = cm.getLayer('weather');
    if (weatherLayer && weatherLayer.dirty) {
      var projFnW = cm.proj.bind(cm);
      drawWeather(weatherLayer.ctx, cm.w, cm.h, projFnW, this.config, t, this.weatherData, this.renderer);
      weatherLayer.dirty = false;
    }

    var atmoLayer = cm.getLayer('atmosphere');
    if (atmoLayer.dirty) {
      drawAtmosphere(atmoLayer.ctx, cm, this.config);
      atmoLayer.dirty = false;
    }

    // --- Animated layers: always redraw (60fps) ---

    var currLayer = cm.getLayer('currents');
    drawCurrents(currLayer.ctx, cm, this.particles, this.currentData, this.config, t);

    var vesselLayer = cm.getLayer('vessels');
    drawVessels(vesselLayer.ctx, cm, this.vessels, this.config, t, this.renderer);

    // --- Simulated vessel drift (when no AIS endpoint) ---

    if (!this.config.aisEndpoint && this.vessels) {
      for (var i = 0; i < this.vessels.length; i++) {
        var v = this.vessels[i];
        // Small sin/cos wobble to simulate GPS drift
        var phase = i * 1.7 + t * 0.3;
        v.lat += Math.sin(phase) * 0.00004;
        v.lon += Math.cos(phase * 0.7) * 0.00005;

        // Slowly rotate heading
        v.heading = (v.heading + Math.sin(t + i) * 0.15) % 360;
        if (v.heading < 0) v.heading += 360;
      }
    }
  }

  /**
   * Mark static layers dirty so they redraw on the next frame.
   * @private
   */
  _drawStatic() {
    if (!this.cm) return;
    this.cm.markDirty('depth');
    this.cm.markDirty('coast');
    this.cm.markDirty('markers');
    this.cm.markDirty('weather');
    this.cm.markDirty('atmosphere');
  }

  /**
   * Update the fleet stats display elements if they exist in the DOM.
   * Looks for elements with class `fleet-stat-n` where n is 0-based.
   * @private
   */
  _updateStats() {
    if (!this.vessels || !this.container) return;

    // Count vessels by status
    var counts = {
      total: this.vessels.length,
      fishing: 0,
      transit: 0,
      port: 0,
      returning: 0,
    };

    for (var i = 0; i < this.vessels.length; i++) {
      var status = (this.vessels[i].status || '').toLowerCase();
      if (status === 'fishing') counts.fishing++;
      else if (status === 'in transit') counts.transit++;
      else if (status === 'in port') counts.port++;
      else if (status === 'returning') counts.returning++;
    }

    // Update stat elements if they exist
    var statKeys = ['total', 'fishing', 'transit', 'port', 'returning'];
    for (var j = 0; j < statKeys.length; j++) {
      var el = this.container.querySelector('.fleet-stat-' + j);
      if (el) {
        el.textContent = counts[statKeys[j]];
      }
    }
  }
}
