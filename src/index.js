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
import { LBI_COAST } from './data/lbi-coast.js';
import { SA_CURRENTS } from './data/currents-sa.js';
import { NJ_CURRENTS } from './data/currents-nj.js';
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
    } else if (this.config.coastData === 'lbi') {
      this.coastData = LBI_COAST;
    } else if (Array.isArray(this.config.coastData)) {
      this.coastData = this.config.coastData;
    } else {
      this.coastData = [];
    }

    // Resolve current flow data
    if (this.config.currentData === 'south-atlantic') {
      this.currentData = SA_CURRENTS;
    } else if (this.config.currentData === 'nj-atlantic') {
      this.currentData = NJ_CURRENTS;
    } else if (Array.isArray(this.config.currentData)) {
      this.currentData = this.config.currentData;
    } else {
      this.currentData = [];
    }

    // Create canvas manager
    this.cm = new CanvasManager(this.container, this.config);

    // Init current particles
    this.particles = initParticles(this.config);

    // Build roster panel — search parent or document for #rosterList
    var rosterScope = this.container.parentElement || document;
    this.rosterEl = buildRoster(rosterScope, this.vessels, this.config);

    // Setup mouse/touch interaction
    this._interactionCleanup = setupInteraction(this.container, this.vessels, this.config);

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

    // Zoom state
    this._baseBounds = {
      latN: this.config.bounds.latN,
      latS: this.config.bounds.latS,
      lonW: this.config.bounds.lonW,
      lonE: this.config.bounds.lonE,
    };
    this._zoom = {
      active: false,
      progress: 0,
      duration: 0.65, // in animation time units (~1.35 real seconds at 60fps)
      startTime: 0,
      direction: 'in', // 'in' or 'out'
      vessel: null,
      fromBounds: null,
      toBounds: null,
    };
    this._zoomedVessel = null;
    this._detailCard = null;

    // Wire up zoom callbacks
    var zoomSelf = this;
    this.config.onVesselZoom = function (vessel) {
      zoomSelf.zoomToVessel(vessel);
    };
    this.config.onMapZoomOut = function () {
      zoomSelf.zoomOut();
    };
  }

  /**
   * Cinematic zoom to a vessel. Double-tap a vessel to invoke.
   * @param {object} vessel — vessel object with lat/lon
   */
  zoomToVessel(vessel) {
    if (!vessel || !this.cm) return;

    // If already zoomed to this vessel, zoom out instead
    if (this._zoomedVessel && this._zoomedVessel.name === vessel.name) {
      this.zoomOut();
      return;
    }

    // Calculate zoomed bounds (5x zoom centered on vessel)
    var latRange = this._baseBounds.latN - this._baseBounds.latS;
    var lonRange = this._baseBounds.lonE - this._baseBounds.lonW;
    var zoomFactor = 5;
    var halfLat = (latRange / zoomFactor) * 0.5;
    var halfLon = (lonRange / zoomFactor) * 0.5;

    var targetBounds = {
      latN: vessel.lat + halfLat,
      latS: vessel.lat - halfLat,
      lonW: vessel.lon - halfLon,
      lonE: vessel.lon + halfLon,
    };

    // Start zoom animation
    this._zoom.active = true;
    this._zoom.progress = 0;
    this._zoom.startTime = this.cm.t;
    this._zoom.direction = 'in';
    this._zoom.vessel = vessel;
    this._zoom.fromBounds = {
      latN: this.config.bounds.latN,
      latS: this.config.bounds.latS,
      lonW: this.config.bounds.lonW,
      lonE: this.config.bounds.lonE,
    };
    this._zoom.toBounds = targetBounds;
    this._zoomedVessel = vessel;

    // Hide the hover tooltip during zoom
    var tooltip = this.container.querySelector('#vesselInfo');
    if (tooltip) tooltip.classList.remove('active');
  }

  /**
   * Zoom back to the full map view.
   */
  zoomOut() {
    if (!this._zoomedVessel || !this.cm) return;

    this._zoom.active = true;
    this._zoom.progress = 0;
    this._zoom.startTime = this.cm.t;
    this._zoom.direction = 'out';
    this._zoom.fromBounds = {
      latN: this.config.bounds.latN,
      latS: this.config.bounds.latS,
      lonW: this.config.bounds.lonW,
      lonE: this.config.bounds.lonE,
    };
    this._zoom.toBounds = {
      latN: this._baseBounds.latN,
      latS: this._baseBounds.latS,
      lonW: this._baseBounds.lonW,
      lonE: this._baseBounds.lonE,
    };

    this._hideDetailCard();
    this._zoomedVessel = null;
  }

  /**
   * Create the vessel detail card DOM element.
   * @private
   */
  _createDetailCard() {
    if (this._detailCard) return this._detailCard;

    var card = document.createElement('div');
    card.className = 'vessel-detail-card';
    card.innerHTML = '<div class="vdc-close">\u00d7</div>' +
      '<div class="vdc-photo"><div class="vdc-photo-placeholder"></div></div>' +
      '<div class="vdc-content">' +
        '<h3 class="vdc-name"></h3>' +
        '<div class="vdc-type"></div>' +
        '<div class="vdc-stats">' +
          '<div class="vdc-stat"><span class="vdc-stat-label">Speed</span><span class="vdc-stat-value vdc-speed"></span></div>' +
          '<div class="vdc-stat"><span class="vdc-stat-label">Heading</span><span class="vdc-stat-value vdc-heading"></span></div>' +
          '<div class="vdc-stat"><span class="vdc-stat-label">Catch</span><span class="vdc-stat-value vdc-catch"></span></div>' +
        '</div>' +
        '<span class="vdc-status"></span>' +
        '<div class="vdc-coords"></div>' +
      '</div>';

    // Close button
    var closeSelf = this;
    card.querySelector('.vdc-close').addEventListener('click', function (e) {
      e.stopPropagation();
      closeSelf.zoomOut();
    });

    this.container.appendChild(card);
    this._detailCard = card;
    return card;
  }

  /**
   * Show the vessel detail card with vessel info.
   * @param {object} vessel
   * @private
   */
  _showDetailCard(vessel) {
    var card = this._createDetailCard();
    var colors = this.config.colors;

    // Update content
    card.querySelector('.vdc-name').textContent = vessel.name;
    card.querySelector('.vdc-type').textContent = vessel.type || 'Vessel';

    card.querySelector('.vdc-speed').textContent = (vessel.speed || 0) + ' kts';
    card.querySelector('.vdc-heading').textContent = Math.round(vessel.heading || 0) + '\u00b0';

    var catchVal = vessel.catch && vessel.catch !== '\u2014' ? vessel.catch : 'None';
    card.querySelector('.vdc-catch').textContent = catchVal;

    var statusEl = card.querySelector('.vdc-status');
    statusEl.textContent = vessel.status || '';
    statusEl.className = 'vdc-status';
    var statusClass = (vessel.status || '').toLowerCase().replace(/\s+/g, '-');
    statusEl.classList.add('vdc-status-' + statusClass);

    // Coordinates
    var latDir = vessel.lat >= 0 ? 'N' : 'S';
    var lonDir = vessel.lon >= 0 ? 'E' : 'W';
    card.querySelector('.vdc-coords').textContent =
      Math.abs(vessel.lat).toFixed(4) + '\u00b0' + latDir + '  ' +
      Math.abs(vessel.lon).toFixed(4) + '\u00b0' + lonDir;

    // Photo placeholder — show vessel initial in a styled circle
    var photoArea = card.querySelector('.vdc-photo-placeholder');
    var initial = (vessel.name || 'V').replace(/^F\/V\s*/i, '').charAt(0).toUpperCase();
    photoArea.textContent = initial;
    photoArea.style.background = '';
    photoArea.style.backgroundSize = '';

    // If vessel has an image URL, use it
    if (vessel.image) {
      var img = new Image();
      var imgUrl = vessel.image;
      img.onload = function () {
        photoArea.textContent = '';
        photoArea.style.background = 'url(' + imgUrl + ') center/cover no-repeat';
      };
      img.src = vessel.image;
    }

    // Animate in
    card.classList.add('active');
  }

  /**
   * Hide the vessel detail card.
   * @private
   */
  _hideDetailCard() {
    if (this._detailCard) {
      this._detailCard.classList.remove('active');
    }
  }

  /**
   * Update zoom animation each frame. Returns true if zoom is animating.
   * @param {number} t — current time
   * @private
   */
  _updateZoom(t) {
    if (!this._zoom.active) return false;

    var elapsed = t - this._zoom.startTime;
    var progress = Math.min(1, elapsed / this._zoom.duration);

    // Easing: ease-out-back for zoom in, ease-in-out for zoom out
    var eased;
    if (this._zoom.direction === 'in') {
      // Ease out with slight overshoot then settle
      var c1 = 1.2;
      var c3 = c1 + 1;
      eased = 1 + c3 * Math.pow(progress - 1, 3) + c1 * Math.pow(progress - 1, 2);
    } else {
      // Smooth ease-in-out for zoom out
      eased = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    }

    // Clamp
    if (eased < 0) eased = 0;
    if (eased > 1.02) eased = 1.02; // allow slight overshoot

    // Interpolate bounds
    var from = this._zoom.fromBounds;
    var to = this._zoom.toBounds;
    this.config.bounds.latN = from.latN + (to.latN - from.latN) * eased;
    this.config.bounds.latS = from.latS + (to.latS - from.latS) * eased;
    this.config.bounds.lonW = from.lonW + (to.lonW - from.lonW) * eased;
    this.config.bounds.lonE = from.lonE + (to.lonE - from.lonE) * eased;

    // Mark all layers dirty during zoom
    this._drawStatic();

    if (progress >= 1) {
      // Animation complete — snap to exact target
      this.config.bounds.latN = to.latN;
      this.config.bounds.latS = to.latS;
      this.config.bounds.lonW = to.lonW;
      this.config.bounds.lonE = to.lonE;
      this._zoom.active = false;

      // Show detail card when zoom-in completes
      if (this._zoom.direction === 'in' && this._zoom.vessel) {
        this._showDetailCard(this._zoom.vessel);
      }

      // Final static redraw
      this._drawStatic();
    }

    return true;
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

    // Remove detail card
    if (this._detailCard && this._detailCard.parentNode) {
      this._detailCard.parentNode.removeChild(this._detailCard);
    }
    this._detailCard = null;
    this._zoomedVessel = null;
    this._zoom = null;

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
      var rosterScope2 = this.container.parentElement || document;
      this.rosterEl = buildRoster(rosterScope2, this.vessels, this.config);
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
    // Skip frame if canvas has no dimensions yet (layout pending)
    if (cm.w < 1 || cm.h < 1) return;

    try {

    // --- Zoom animation ---
    this._updateZoom(this.cm.t);

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

    } catch (err) {
      // Render error to the depth canvas so we can see what went wrong
      var errCtx = cm.getLayer('depth').ctx;
      errCtx.fillStyle = 'rgba(0,0,0,0.85)';
      errCtx.fillRect(0, 0, cm.w, cm.h);
      errCtx.fillStyle = '#ff4444';
      errCtx.font = '14px monospace';
      errCtx.fillText('RENDER ERROR: ' + err.message, 20, 30);
      errCtx.fillStyle = '#ffaa44';
      errCtx.font = '11px monospace';
      var stack = (err.stack || '').split('\n');
      for (var si = 0; si < Math.min(stack.length, 10); si++) {
        errCtx.fillText(stack[si], 20, 50 + si * 16);
      }
      cm.stopLoop();
    }

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
      if (status === 'fishing' || status === 'scalloping') counts.fishing++;
      else if (status === 'in transit') counts.transit++;
      else if (status === 'in port') counts.port++;
      else if (status === 'returning') counts.returning++;
    }

    // Update stat elements if they exist (search document, not just container)
    var statKeys = ['total', 'fishing', 'transit', 'port', 'returning'];
    for (var j = 0; j < statKeys.length; j++) {
      var el = document.querySelector('.fleet-stat-' + j);
      if (el) {
        el.textContent = counts[statKeys[j]];
      }
    }
  }
}
