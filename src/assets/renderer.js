/**
 * Fleet Map — Asset Renderer
 * ============================
 * Central rendering pipeline. Bridges the asset registry (symbol definitions)
 * and canvas contexts. Handles scale, theme styling, rotation, and emphasis.
 *
 * Usage:
 *   var renderer = new AssetRenderer(registry, theme, canvasWidth);
 *   renderer.draw(ctx, 'vessels', 'trawler', x, y, { size: 'md', rotation: heading, color: gold });
 *   renderer.drawVessel(ctx, vessel, { x, y }, { t: animTime });
 */

import { scaleFor, emphasisFor } from './scale.js';

var TAU = Math.PI * 2;

/**
 * Map vessel type strings to symbol IDs.
 */
var VESSEL_TYPE_MAP = {
  'Trawler':    'trawler',
  'Dragger':    'trawler',
  'Longliner':  'longliner',
  'Scalloper':  'scalloper',
  'Gillnetter': 'gillnetter',
  'Lobster':    'lobster',
  'Cargo':      'cargo',
  'Sailboat':   'sailboat',
  'Pot Boat':   'lobster',
};

export class AssetRenderer {
  /**
   * @param {import('./registry.js').AssetRegistry} registry
   * @param {object} theme   — resolved theme object
   * @param {number} canvasWidth — logical canvas width (for scaling)
   */
  constructor(registry, theme, canvasWidth) {
    this.registry = registry;
    this.theme = theme;
    this.w = canvasWidth;
  }

  /**
   * Update canvas width (call on resize).
   * @param {number} w
   */
  setWidth(w) {
    this.w = w;
  }

  /**
   * Draw a symbol from the registry at a given position.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} category — 'vessels', 'nav-aids', 'ports', etc.
   * @param {string} id       — symbol ID within category
   * @param {number} x        — screen x
   * @param {number} y        — screen y
   * @param {object} [opts]   — drawing options
   * @param {string} [opts.size='md']      — scale step
   * @param {number} [opts.rotation=0]     — radians
   * @param {string} [opts.color]          — fill color override
   * @param {number} [opts.alpha=1]        — globalAlpha
   * @param {number} [opts.t=0]            — animation time
   * @param {string} [opts.style]          — draw variant: 'topDown', 'profile', 'icon'
   */
  draw(ctx, category, id, x, y, opts) {
    var sym = this.registry.getSymbol(category, id);
    if (!sym) return;

    opts = opts || {};
    var size     = opts.size || 'md';
    var rotation = opts.rotation || 0;
    var alpha    = opts.alpha !== undefined ? opts.alpha : 1;
    var t        = opts.t || 0;
    var emphasis = emphasisFor(category, this.theme);
    var px       = scaleFor(category, size, this.w, emphasis);
    var color    = opts.color || (this.theme && this.theme.colors && this.theme.colors.creme) || 'rgba(240,235,224,1)';

    // Determine which draw variant to use
    var style = opts.style || (this.theme && this.theme.symbols && this.theme.symbols.vessel && this.theme.symbols.vessel.style) || 'profile';
    var drawFn = null;

    if (style === 'topDown' && sym.drawTopDown) {
      drawFn = sym.drawTopDown;
    } else if (style === 'icon' && sym.drawIcon) {
      drawFn = sym.drawIcon;
    } else if (sym.drawProfile) {
      drawFn = sym.drawProfile;
    } else if (sym.draw) {
      drawFn = sym.draw;
    }

    if (!drawFn) return;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    if (rotation) ctx.rotate(rotation);

    drawFn(ctx, px, color, t);

    ctx.restore();
  }

  /**
   * Draw a vessel with full decoration: halo, trail, icon, ping, label, badge.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} vessel    — vessel data object
   * @param {{ x: number, y: number }} sp — screen position
   * @param {object} opts
   * @param {number} opts.t           — animation time
   * @param {object} opts.colors      — color palette
   * @param {object} opts.fonts       — font config
   * @param {number} opts.w           — canvas width
   * @param {number} opts.index       — vessel index (for phase offset)
   */
  drawVessel(ctx, vessel, sp, opts) {
    var colors = opts.colors;
    var fonts  = opts.fonts;
    var t      = opts.t || 0;
    var i      = opts.index || 0;
    var w      = opts.w || this.w;

    var statusCol = this._statusColor(colors, vessel.status, 0.9);
    var heading   = (vessel.heading || 0) * Math.PI / 180;

    // Resolve symbol ID from vessel type
    var symId = VESSEL_TYPE_MAP[vessel.type] || 'generic';
    var style = (this.theme && this.theme.symbols && this.theme.symbols.vessel && this.theme.symbols.vessel.style) || 'profile';

    // Draw the vessel symbol
    this.draw(ctx, 'vessels', symId, sp.x, sp.y, {
      size: 'md',
      rotation: heading,
      color: statusCol,
      alpha: vessel.status === 'In Port' ? 0.7 : 0.9,
      t: t,
      style: style,
    });
  }

  /**
   * Draw a port using asset symbols instead of a plain dot.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} port — { name, lat, lon, size, facilities? }
   * @param {{ x: number, y: number }} pp — screen position
   * @param {object} opts — { t, colors, fonts, w }
   */
  drawPort(ctx, port, pp, opts) {
    var colors = opts.colors;
    var t      = opts.t || 0;
    var major  = port.size === 'major';
    var portColor = colors.verde || 'rgba(0,104,71,1)';

    // Draw dock symbol
    this.draw(ctx, 'ports', 'dock', pp.x, pp.y, {
      size: major ? 'lg' : 'md',
      color: portColor,
      alpha: 0.85,
      t: t,
    });

    // Draw facility icons if present
    if (port.facilities && port.facilities.length) {
      var spacing = scaleFor('icon', 'xs', this.w, emphasisFor('icon', this.theme));
      for (var fi = 0; fi < port.facilities.length; fi++) {
        var facId = port.facilities[fi];
        this.draw(ctx, 'ports', facId, pp.x + (fi + 1) * spacing * 1.5, pp.y - spacing, {
          size: 'xs',
          color: portColor,
          alpha: 0.5,
          t: t,
        });
      }
    }
  }

  /**
   * Draw a weather station — cluster of weather icons at a point.
   *
   * @param {CanvasRenderingContext2D} ctx
   * @param {object} data — { wind: { speed, direction }, waves, temp, conditions, warnings }
   * @param {{ x: number, y: number }} sp — screen position
   * @param {object} opts — { t, colors }
   */
  drawWeatherStation(ctx, data, sp, opts) {
    var t = opts.t || 0;
    var warnColor = 'rgba(220,60,60,0.9)';
    var normalColor = (opts.colors && opts.colors.blade) || 'rgba(139,175,196,1)';

    // Wind barb
    if (data.wind) {
      var windDir = (data.wind.direction || 0) * Math.PI / 180;
      this.draw(ctx, 'weather', 'wind-barb', sp.x, sp.y, {
        size: 'md',
        rotation: windDir,
        color: normalColor,
        alpha: 0.7,
        t: t,
      });
    }

    // Wave height indicator (offset below)
    if (data.waves) {
      this.draw(ctx, 'weather', 'wave-height', sp.x, sp.y + 20, {
        size: 'sm',
        color: normalColor,
        alpha: 0.6,
        t: t,
      });
    }

    // Warning flag
    if (data.warnings && data.warnings.length) {
      this.draw(ctx, 'weather', 'storm-warning', sp.x + 16, sp.y - 16, {
        size: 'sm',
        color: warnColor,
        alpha: 0.9,
        t: t,
      });
    }
  }

  /**
   * Return a fill color for a vessel based on status.
   * @private
   */
  _statusColor(colors, status, alpha) {
    var base;
    switch (status) {
      case 'Fishing':
      case 'Scalloping': base = colors.ouro;  break;
      case 'In Port':    base = colors.verde; break;
      case 'In Transit':
      case 'Returning':  base = colors.blade; break;
      default:           base = colors.blade; break;
    }
    if (alpha !== undefined && alpha !== 1) {
      return base.replace(/[\d.]+\)$/, alpha + ')');
    }
    return base;
  }
}
