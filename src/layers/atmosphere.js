/**
 * Fleet Map — Atmosphere Layer
 * ==============================
 * Renders fog vignette and edge darkening over all other layers.
 *
 * This is a STATIC layer — only redraws on resize.
 * Canvas: fleetCanvasAtmo (z-index: 5, top layer, pointer-events: none)
 *
 * Creates the "looking through a porthole" feeling with darkened
 * edges and subtle fog gradients at top and bottom.
 */

/**
 * Parse the r, g, b channels from a CSS rgba string like 'rgba(4,10,16,1)'.
 * Returns an object { r, g, b }.
 */
function parseRGB(rgbaStr) {
  var m = rgbaStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return { r: 4, g: 10, b: 16 }; // fallback to default deep
  return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10) };
}

/**
 * Build an rgba() color string from r, g, b values and an alpha.
 */
function rgba(r, g, b, a) {
  return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
}

/**
 * Draw the atmosphere layer: vignette, top fog, and bottom fog.
 *
 * @param {CanvasRenderingContext2D} ctx    — canvas context
 * @param {number}   w      — logical canvas width
 * @param {number}   h      — logical canvas height
 * @param {object}   config — merged FleetMap config
 */
export function drawAtmosphere(ctx, wOrCm, hOrConfig, config) {
  var w, h;
  if (typeof wOrCm === 'object' && wOrCm.w !== undefined) {
    // CanvasManager style: (ctx, cm, config)
    w = wOrCm.w;
    h = wOrCm.h;
    config = hOrConfig;
  } else {
    // Explicit style: (ctx, w, h, config)
    w = wOrCm;
    h = hOrConfig;
  }
  var deep = parseRGB(config.colors.deep);
  var r = deep.r;
  var g = deep.g;
  var b = deep.b;

  // ------------------------------------------------------------------
  // 1. Clear to transparent
  // ------------------------------------------------------------------
  ctx.clearRect(0, 0, w, h);

  // ------------------------------------------------------------------
  // 2. Radial vignette — transparent center, darkened edges
  // ------------------------------------------------------------------
  var cx = w * 0.5;
  var cy = h * 0.5;
  // Radius reaches the corners
  var cornerR = Math.sqrt(cx * cx + cy * cy);

  var vignette = ctx.createRadialGradient(cx, cy, 0, cx, cy, cornerR);
  vignette.addColorStop(0.0, rgba(r, g, b, 0));
  vignette.addColorStop(0.4, rgba(r, g, b, 0));
  vignette.addColorStop(0.7, rgba(r, g, b, 0.08));
  vignette.addColorStop(0.85, rgba(r, g, b, 0.15));
  vignette.addColorStop(1.0, rgba(r, g, b, 0.22));

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // ------------------------------------------------------------------
  // 3. Top fog band — top 15% of canvas
  // ------------------------------------------------------------------
  var topH = h * 0.15;
  var topFog = ctx.createLinearGradient(0, 0, 0, topH);
  topFog.addColorStop(0.0, rgba(r, g, b, 0.15));
  topFog.addColorStop(1.0, rgba(r, g, b, 0));

  ctx.fillStyle = topFog;
  ctx.fillRect(0, 0, w, topH);

  // ------------------------------------------------------------------
  // 4. Bottom fog band — bottom 12% of canvas
  // ------------------------------------------------------------------
  var botH    = h * 0.12;
  var botTop  = h - botH;
  var botFog  = ctx.createLinearGradient(0, h, 0, botTop);
  botFog.addColorStop(0.0, rgba(r, g, b, 0.12));
  botFog.addColorStop(1.0, rgba(r, g, b, 0));

  ctx.fillStyle = botFog;
  ctx.fillRect(0, botTop, w, botH);
}
