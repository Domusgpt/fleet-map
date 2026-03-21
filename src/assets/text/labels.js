/**
 * Fleet Map — Label System
 * ==========================
 * Standardized text rendering for different label types on the map.
 * Each label type defines font, size, alpha, letter spacing, and
 * text transform so all map text is consistent and theme-aware.
 *
 * Usage:
 *   import { LABEL_STYLES, drawLabel } from './text/labels.js';
 *   drawLabel(ctx, 'port-name', 'BARNEGAT LIGHT', x, y, { w, fonts, colors });
 */

import { scaleFor, emphasisFor } from '../scale.js';

/**
 * Label style definitions.
 * Each style has: sizeStep, fontKey, alpha, transform, tracking, align, baseline.
 */
export var LABEL_STYLES = {
  'water-body': {
    sizeStep: 'lg',
    fontKey: 'display',
    alpha: 0.08,
    transform: 'spaced-upper',   // "S O U T H   A T L A N T I C"
    align: 'center',
    baseline: 'middle',
  },

  'land-mass': {
    sizeStep: 'lg',
    fontKey: 'display',
    alpha: 0.35,
    transform: 'spaced-upper',
    align: 'center',
    baseline: 'middle',
  },

  'port-name': {
    sizeStep: 'sm',
    fontKey: 'sans',
    alpha: 0.65,
    transform: 'upper',
    align: 'left',
    baseline: 'middle',
  },

  'vessel-name': {
    sizeStep: 'xs',
    fontKey: 'sans',
    alpha: 0.3,
    transform: 'none',
    align: 'center',
    baseline: 'top',
  },

  'depth-sounding': {
    sizeStep: 'xs',
    fontKey: 'sans',
    alpha: 0.2,
    transform: 'none',
    align: 'center',
    baseline: 'middle',
  },

  'coordinate': {
    sizeStep: 'xs',
    fontKey: 'sans',
    alpha: 0.15,
    transform: 'none',
    align: 'left',
    baseline: 'top',
  },

  'fishing-ground': {
    sizeStep: 'sm',
    fontKey: 'sans',
    alpha: 0.12,
    transform: 'none',
    align: 'center',
    baseline: 'middle',
    italic: true,
  },

  'warning': {
    sizeStep: 'md',
    fontKey: 'sans',
    alpha: 0.9,
    transform: 'upper',
    align: 'center',
    baseline: 'middle',
    bold: true,
  },

  'route-label': {
    sizeStep: 'xs',
    fontKey: 'sans',
    alpha: 0.25,
    transform: 'none',
    align: 'left',
    baseline: 'middle',
  },

  'title': {
    sizeStep: 'xl',
    fontKey: 'display',
    alpha: 0.6,
    transform: 'none',
    align: 'left',
    baseline: 'top',
  },

  'subtitle': {
    sizeStep: 'sm',
    fontKey: 'sans',
    alpha: 0.4,
    transform: 'none',
    align: 'left',
    baseline: 'top',
  },

  'stat-value': {
    sizeStep: 'lg',
    fontKey: 'display',
    alpha: 0.8,
    transform: 'none',
    align: 'center',
    baseline: 'middle',
  },

  'stat-label': {
    sizeStep: 'xs',
    fontKey: 'sans',
    alpha: 0.4,
    transform: 'upper',
    align: 'center',
    baseline: 'top',
  },
};

/**
 * Apply text transform to a string.
 * @param {string} text
 * @param {string} transform — 'none', 'upper', 'spaced-upper'
 * @returns {string}
 */
function applyTransform(text, transform) {
  if (!text) return '';
  switch (transform) {
    case 'upper':
      return text.toUpperCase();
    case 'spaced-upper':
      return text.toUpperCase().split('').join(' ');
    default:
      return text;
  }
}

/**
 * Draw a label at the given position using a named label style.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {string} styleId  — key from LABEL_STYLES
 * @param {string} text     — text to render
 * @param {number} x        — screen x
 * @param {number} y        — screen y
 * @param {object} opts
 * @param {number} opts.w       — canvas width (for scaling)
 * @param {object} opts.fonts   — { display, sans }
 * @param {object} opts.colors  — color palette
 * @param {string} [opts.color] — explicit color override
 * @param {number} [opts.alpha] — explicit alpha override
 * @param {number} [opts.rotation] — text rotation in radians
 * @param {object} [opts.theme] — theme for emphasis overrides
 */
export function drawLabel(ctx, styleId, text, x, y, opts) {
  var style = LABEL_STYLES[styleId];
  if (!style) return;

  var w      = opts.w || 1200;
  var fonts  = opts.fonts || {};
  var colors = opts.colors || {};
  var theme  = opts.theme || null;

  var emphasis = emphasisFor('text', theme);
  var px = scaleFor('text', style.sizeStep, w, emphasis);

  var fontFamily = (style.fontKey === 'display') ? (fonts.display || 'serif') : (fonts.sans || 'sans-serif');
  var fontPrefix = '';
  if (style.italic) fontPrefix += 'italic ';
  if (style.bold) fontPrefix += 'bold ';

  var displayText = applyTransform(text, style.transform);
  var alpha = (opts.alpha !== undefined) ? opts.alpha : style.alpha;
  var color = opts.color || colors.creme || 'rgba(240,235,224,1)';

  ctx.save();

  if (opts.rotation) {
    ctx.translate(x, y);
    ctx.rotate(opts.rotation);
    x = 0;
    y = 0;
  }

  ctx.font         = fontPrefix + px + 'px ' + fontFamily;
  ctx.fillStyle    = color;
  ctx.globalAlpha  = alpha;
  ctx.textAlign    = style.align;
  ctx.textBaseline = style.baseline;
  ctx.fillText(displayText, x, y);

  ctx.restore();
}
