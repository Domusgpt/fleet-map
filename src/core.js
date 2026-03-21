/**
 * Fleet Map — Canvas Manager
 * Creates and manages the 5-canvas parallax stack.
 * Handles DPR-aware resizing and the render loop.
 *
 * Layer stack (bottom to top):
 *   1. depth     — Bathymetry, fathom lines, grid (static)
 *   2. currents  — Particle ocean currents (60fps)
 *   3. coast     — Coastline, land, ports, routes, labels (static + port pulse)
 *   4. vessels   — Vessel triangles, trails, halos (60fps)
 *   5. atmosphere — Fog vignette (static)
 */

import { proj, invProj } from './projection.js';

var LAYER_IDS = {
  depth:      'fleetCanvasDepth',
  currents:   'fleetCanvasCurrents',
  coast:      'fleetCanvasCoast',
  markers:    'fleetCanvasMarkers',
  weather:    'fleetCanvasWeather',
  vessels:    'fleetCanvasVessels',
  atmosphere: 'fleetCanvasAtmo',
};

var LAYER_NAMES = ['depth', 'currents', 'coast', 'markers', 'weather', 'vessels', 'atmosphere'];

// Layers that are optional — don't throw if canvas is missing
var OPTIONAL_LAYERS = { markers: true, weather: true };

export class CanvasManager {
  /**
   * @param {HTMLElement} container — the .fleet-map DOM element
   * @param {object} config — merged FleetMap config
   */
  constructor(container, config) {
    this.container = container;
    this.config = config;
    this.layers = {};
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
    this.t = 0;
    this.running = false;
    this._drawFn = null;
    this._rafId = null;

    // Find each canvas by ID and build layer objects
    for (var i = 0; i < LAYER_NAMES.length; i++) {
      var name = LAYER_NAMES[i];
      var canvasId = LAYER_IDS[name];
      var canvas = container.querySelector('#' + canvasId);
      if (!canvas) {
        // If canvas not found by ID, try finding it inside the container
        // by data attribute as fallback
        canvas = container.querySelector('[data-layer="' + name + '"]');
      }
      if (!canvas) {
        if (OPTIONAL_LAYERS[name]) {
          // Optional layers: create canvas dynamically if not in DOM
          canvas = document.createElement('canvas');
          canvas.id = canvasId;
          canvas.style.position = 'absolute';
          canvas.style.top = '0';
          canvas.style.left = '0';
          canvas.style.pointerEvents = 'none';
          // Insert before the vessels canvas to maintain correct z-order
          // (markers and weather should be between coast and vessels)
          var mapArea = container.querySelector('.fleet-map-area') || container;
          var vesselCanvas = mapArea.querySelector('#fleetCanvasVessels');
          if (vesselCanvas) {
            mapArea.insertBefore(canvas, vesselCanvas);
          } else {
            mapArea.appendChild(canvas);
          }
        } else {
          throw new Error('FleetMap: missing canvas #' + canvasId);
        }
      }
      this.layers[name] = {
        canvas: canvas,
        ctx: canvas.getContext('2d'),
        dirty: true,
      };
    }

    this.resize();
  }

  /**
   * Resize all canvases to match container dimensions, respecting DPR.
   */
  resize() {
    var rect = this.container.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = rect.width;
    var h = rect.height;

    // If container has no dimensions yet (layout pending), retry shortly
    if (w < 1 || h < 1) {
      var self = this;
      setTimeout(function () { self.resize(); }, 50);
      return;
    }

    this.w = w;
    this.h = h;
    this.dpr = dpr;

    for (var i = 0; i < LAYER_NAMES.length; i++) {
      var layer = this.layers[LAYER_NAMES[i]];
      var canvas = layer.canvas;
      var ctx = layer.ctx;

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      layer.dirty = true;
    }
  }

  /**
   * Project geographic coordinates to screen coordinates.
   * @param {number} lat
   * @param {number} lon
   * @returns {{ x: number, y: number }}
   */
  proj(lat, lon) {
    return proj(lat, lon, this.config.bounds, this.w, this.h);
  }

  /**
   * Inverse project screen coordinates to geographic.
   * @param {number} x
   * @param {number} y
   * @returns {{ lat: number, lon: number }}
   */
  invProj(x, y) {
    return invProj(x, y, this.config.bounds, this.w, this.h);
  }

  /**
   * Get a layer object by name.
   * @param {string} name — one of: depth, currents, coast, vessels, atmosphere
   * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, dirty: boolean }}
   */
  getLayer(name) {
    return this.layers[name];
  }

  /**
   * Mark a layer as needing redraw.
   * @param {string} name
   */
  markDirty(name) {
    if (this.layers[name]) {
      this.layers[name].dirty = true;
    }
  }

  /**
   * Start the render loop.
   * @param {function} drawFn — called each frame with (t)
   */
  startLoop(drawFn) {
    this._drawFn = drawFn;
    this.running = true;

    var self = this;
    function tick() {
      if (!self.running) return;
      self.t += 0.008;
      self._drawFn(self.t);
      self._rafId = requestAnimationFrame(tick);
    }
    self._rafId = requestAnimationFrame(tick);
  }

  /**
   * Stop the render loop.
   */
  stopLoop() {
    this.running = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  /**
   * Clean up all resources.
   */
  destroy() {
    this.stopLoop();
    this._drawFn = null;
    this.container = null;
    this.config = null;
    for (var i = 0; i < LAYER_NAMES.length; i++) {
      var layer = this.layers[LAYER_NAMES[i]];
      if (layer) {
        layer.ctx = null;
        layer.canvas = null;
      }
    }
    this.layers = null;
  }
}
