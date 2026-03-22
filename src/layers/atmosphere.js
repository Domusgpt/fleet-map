/**
 * Fleet Map — Atmosphere Layer
 * ==============================
 * Renders fog vignette, edge darkening, subtle water shimmer, and
 * compass border details over all other layers.
 *
 * This is a STATIC layer — only redraws on resize.
 * Canvas: fleetCanvasAtmo (z-index: 5, top layer, pointer-events: none)
 *
 * Creates the "looking through a porthole" feeling with darkened
 * edges, subtle fog gradients, and gentle water light effects.
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
 * Simple hash-based pseudo-noise for subtle effects.
 */
function noise(x, y) {
  var n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Draw the atmosphere layer: vignette, fog bands, subtle light effects,
 * and decorative map border.
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

  // Parse accent color for border details
  var ouro = parseRGB(config.colors.ouro);

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
  vignette.addColorStop(0.35, rgba(r, g, b, 0));
  vignette.addColorStop(0.65, rgba(r, g, b, 0.06));
  vignette.addColorStop(0.80, rgba(r, g, b, 0.14));
  vignette.addColorStop(0.90, rgba(r, g, b, 0.22));
  vignette.addColorStop(1.0, rgba(r, g, b, 0.32));

  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);

  // ------------------------------------------------------------------
  // 3. Top fog band — top 18% of canvas
  // ------------------------------------------------------------------
  var topH = h * 0.18;
  var topFog = ctx.createLinearGradient(0, 0, 0, topH);
  topFog.addColorStop(0.0, rgba(r, g, b, 0.20));
  topFog.addColorStop(0.5, rgba(r, g, b, 0.08));
  topFog.addColorStop(1.0, rgba(r, g, b, 0));

  ctx.fillStyle = topFog;
  ctx.fillRect(0, 0, w, topH);

  // ------------------------------------------------------------------
  // 4. Bottom fog band — bottom 15% of canvas
  // ------------------------------------------------------------------
  var botH    = h * 0.15;
  var botTop  = h - botH;
  var botFog  = ctx.createLinearGradient(0, h, 0, botTop);
  botFog.addColorStop(0.0, rgba(r, g, b, 0.18));
  botFog.addColorStop(0.5, rgba(r, g, b, 0.06));
  botFog.addColorStop(1.0, rgba(r, g, b, 0));

  ctx.fillStyle = botFog;
  ctx.fillRect(0, botTop, w, botH);

  // ------------------------------------------------------------------
  // 5. Side fog bands — left and right 8% of canvas
  // ------------------------------------------------------------------
  var sideW = w * 0.08;

  // Left side
  var leftFog = ctx.createLinearGradient(0, 0, sideW, 0);
  leftFog.addColorStop(0.0, rgba(r, g, b, 0.12));
  leftFog.addColorStop(1.0, rgba(r, g, b, 0));
  ctx.fillStyle = leftFog;
  ctx.fillRect(0, 0, sideW, h);

  // Right side
  var rightFog = ctx.createLinearGradient(w, 0, w - sideW, 0);
  rightFog.addColorStop(0.0, rgba(r, g, b, 0.12));
  rightFog.addColorStop(1.0, rgba(r, g, b, 0));
  ctx.fillStyle = rightFog;
  ctx.fillRect(w - sideW, 0, sideW, h);

  // ------------------------------------------------------------------
  // 6. Subtle water light shafts — angled light beams from above
  // ------------------------------------------------------------------
  for (var shaft = 0; shaft < 4; shaft++) {
    var sx = w * (0.15 + noise(shaft * 5.7, 2.3) * 0.7);
    var shaftW = w * (0.06 + noise(shaft * 3.1, 7.2) * 0.08);

    ctx.save();
    ctx.translate(sx, 0);
    ctx.rotate(0.15 + noise(shaft, shaft) * 0.2 - 0.1);

    var shaftGrad = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    shaftGrad.addColorStop(0.0, rgba(
      Math.min(255, r + 80),
      Math.min(255, g + 110),
      Math.min(255, b + 140),
      0.06
    ));
    shaftGrad.addColorStop(0.4, rgba(
      Math.min(255, r + 50),
      Math.min(255, g + 80),
      Math.min(255, b + 110),
      0.035
    ));
    shaftGrad.addColorStop(1.0, rgba(r, g, b, 0));

    ctx.fillStyle = shaftGrad;
    ctx.fillRect(-shaftW * 0.5, 0, shaftW, h * 0.7);
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // 7. Thin decorative border — nautical chart edge
  // ------------------------------------------------------------------
  ctx.strokeStyle = rgba(ouro.r, ouro.g, ouro.b, 0.18);
  ctx.lineWidth = 1;

  // Outer border
  ctx.strokeRect(4, 4, w - 8, h - 8);

  // Inner border (double-line effect)
  ctx.strokeStyle = rgba(ouro.r, ouro.g, ouro.b, 0.08);
  ctx.lineWidth = 0.5;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  // Corner tick marks
  var tickLen = 16;
  ctx.strokeStyle = rgba(ouro.r, ouro.g, ouro.b, 0.25);
  ctx.lineWidth = 1.5;

  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(4, 4 + tickLen); ctx.lineTo(4, 4); ctx.lineTo(4 + tickLen, 4);
  ctx.stroke();

  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(w - 4 - tickLen, 4); ctx.lineTo(w - 4, 4); ctx.lineTo(w - 4, 4 + tickLen);
  ctx.stroke();

  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(4, h - 4 - tickLen); ctx.lineTo(4, h - 4); ctx.lineTo(4 + tickLen, h - 4);
  ctx.stroke();

  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(w - 4 - tickLen, h - 4); ctx.lineTo(w - 4, h - 4); ctx.lineTo(w - 4, h - 4 - tickLen);
  ctx.stroke();
}
