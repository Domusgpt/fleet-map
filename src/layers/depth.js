/**
 * Fleet Map — Depth Layer
 * ========================
 * Renders the ocean background: bathymetry gradient, fathom contour
 * lines, and the latitude/longitude grid.
 *
 * This is a STATIC layer — only redraws on resize.
 * Canvas: fleetCanvasDepth (z-index: 1, bottom layer)
 *
 * Customizable via config.colors:
 *   .deep    — Deepest ocean color
 *   .ocean   — Array of 3 gradient stops [center, mid, edge]
 *   .fathom  — Contour line color
 *   .grid    — Grid line color
 *
 * Customizable via config.fonts:
 *   .sans    — Font for coordinate labels
 */

// Continental shelf edge — ~14 points tracing the shelf break
// off the southeastern Brazilian coast (lat, lon pairs).
var SHELF = [
  [-15.0, -37.5],
  [-16.5, -37.0],
  [-18.0, -37.5],
  [-19.5, -38.5],
  [-21.0, -39.5],
  [-22.0, -40.0],
  [-23.0, -41.0],
  [-24.0, -42.0],
  [-25.5, -43.5],
  [-27.0, -45.0],
  [-28.5, -46.0],
  [-30.0, -47.5],
  [-32.0, -49.0],
  [-34.0, -50.5],
];

// Fathom labels placed at selected contour indices
var FATHOM_LABELS = [
  { idx: 2,  offset: 0, text: '100 fm' },
  { idx: 6,  offset: 1, text: '500 fm' },
  { idx: 10, offset: 2, text: '1000 fm' },
  { idx: 12, offset: 2, text: '2000 fm' },
];

/**
 * Format a latitude value as a label string.
 */
function latLabel(deg) {
  var abs = Math.abs(deg);
  var dir = deg >= 0 ? 'N' : 'S';
  return abs + '\u00B0' + dir;
}

/**
 * Format a longitude value as a label string.
 */
function lonLabel(deg) {
  var abs = Math.abs(deg);
  var dir = deg >= 0 ? 'E' : 'W';
  return abs + '\u00B0' + dir;
}

/**
 * Draw the depth layer: ocean gradient, lat/lon grid, and fathom contours.
 *
 * Supports two call signatures:
 *   drawDepth(ctx, cm, config)                    — CanvasManager style
 *   drawDepth(ctx, w, h, projFn, config, t)       — explicit style
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasManager|number} cmOrW
 * @param {object|number} configOrH
 */
export function drawDepth(ctx, cmOrW, configOrH, projFnArg, configArg, tArg) {
  var w, h, projFn, config, t;

  if (typeof cmOrW === 'object' && cmOrW.w !== undefined) {
    // CanvasManager style: (ctx, cm, config)
    w = cmOrW.w;
    h = cmOrW.h;
    projFn = cmOrW.proj.bind(cmOrW);
    config = configOrH;
    t = 0;
  } else {
    // Explicit style: (ctx, w, h, projFn, config, t)
    w = cmOrW;
    h = configOrH;
    projFn = projFnArg;
    config = configArg;
    t = tArg || 0;
  }

  var colors = config.colors;
  var fonts  = config.fonts;
  var bounds = config.bounds;

  // ------------------------------------------------------------------
  // 1. Clear canvas with the deepest ocean color
  // ------------------------------------------------------------------
  ctx.fillStyle = colors.deep;
  ctx.fillRect(0, 0, w, h);

  // ------------------------------------------------------------------
  // 2. Radial ocean gradient (3 stops from center outward)
  // ------------------------------------------------------------------
  var cx = w * 0.5;
  var cy = h * 0.5;
  var maxR = Math.sqrt(cx * cx + cy * cy);
  var oceanStops = colors.ocean; // [center, mid, edge]

  var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
  grad.addColorStop(0.0, oceanStops[0]);
  grad.addColorStop(0.5, oceanStops[1]);
  grad.addColorStop(1.0, oceanStops[2]);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // ------------------------------------------------------------------
  // 3. Lat/Lon grid — every 5 degrees
  // ------------------------------------------------------------------
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth   = 1;
  ctx.setLineDash([4, 8]);

  var lat, lon, p1, p2;

  // Latitude lines (horizontal)
  var latStart = Math.ceil(bounds.latS / 5) * 5;
  var latEnd   = Math.floor(bounds.latN / 5) * 5;
  for (lat = latStart; lat <= latEnd; lat += 5) {
    p1 = projFn(lat, bounds.lonW);
    p2 = projFn(lat, bounds.lonE);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // Longitude lines (vertical)
  var lonStart = Math.ceil(bounds.lonW / 5) * 5;
  var lonEnd   = Math.floor(bounds.lonE / 5) * 5;
  for (lon = lonStart; lon <= lonEnd; lon += 5) {
    p1 = projFn(bounds.latN, lon);
    p2 = projFn(bounds.latS, lon);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  ctx.setLineDash([]);

  // Grid labels
  var fontSize = Math.max(9, Math.round(w * 0.009));
  ctx.font      = fontSize + 'px ' + fonts.sans;
  ctx.fillStyle = colors.grid;
  ctx.textBaseline = 'top';

  // Latitude labels (left edge)
  ctx.textAlign = 'left';
  for (lat = latStart; lat <= latEnd; lat += 5) {
    var pLabel = projFn(lat, bounds.lonW);
    ctx.fillText(latLabel(lat), 6, pLabel.y + 3);
  }

  // Longitude labels (bottom edge)
  ctx.textBaseline = 'bottom';
  ctx.textAlign    = 'center';
  for (lon = lonStart; lon <= lonEnd; lon += 5) {
    var pLonLabel = projFn(bounds.latS, lon);
    ctx.fillText(lonLabel(lon), pLonLabel.x, h - 4);
  }

  // ------------------------------------------------------------------
  // 4. Depth contour lines (continental shelf)
  // ------------------------------------------------------------------
  ctx.strokeStyle = colors.fathom;
  ctx.lineWidth   = 1;

  // Draw 3 parallel contours, each offset further offshore
  for (var c = 0; c < 3; c++) {
    var offset = c * 1.5; // degrees offshore

    ctx.beginPath();

    for (var i = 0; i < SHELF.length; i++) {
      var sLat = SHELF[i][0];
      var sLon = SHELF[i][1] - offset;

      // Subtle sin() wave animation along the contour
      var wave = Math.sin(t * 0.6 + i * 0.9 + c * 1.2) * 0.15;
      sLat += wave;
      sLon += wave * 0.5;

      var sp = projFn(sLat, sLon);

      if (i === 0) {
        ctx.moveTo(sp.x, sp.y);
      } else {
        // Smooth curve through points using quadratic bezier
        var prev  = SHELF[i - 1];
        var pLat  = prev[0] + Math.sin(t * 0.6 + (i - 1) * 0.9 + c * 1.2) * 0.15;
        var pLon  = prev[1] - offset + Math.sin(t * 0.6 + (i - 1) * 0.9 + c * 1.2) * 0.15 * 0.5;
        var pp    = projFn(pLat, pLon);
        var cpx   = (pp.x + sp.x) * 0.5;
        var cpy   = (pp.y + sp.y) * 0.5;
        ctx.quadraticCurveTo(pp.x, pp.y, cpx, cpy);
      }
    }

    // Draw the last segment to the final point
    var last = SHELF[SHELF.length - 1];
    var lastWave = Math.sin(t * 0.6 + (SHELF.length - 1) * 0.9 + c * 1.2) * 0.15;
    var lastP = projFn(last[0] + lastWave, last[1] - offset + lastWave * 0.5);
    ctx.lineTo(lastP.x, lastP.y);

    ctx.stroke();
  }

  // Fathom labels
  var fathomFontSize = Math.max(8, Math.round(w * 0.008));
  ctx.font      = fathomFontSize + 'px ' + fonts.sans;
  ctx.fillStyle = colors.fathom;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (var f = 0; f < FATHOM_LABELS.length; f++) {
    var fl    = FATHOM_LABELS[f];
    var si    = fl.idx;
    var so    = fl.offset * 1.5;
    var sWave = Math.sin(t * 0.6 + si * 0.9 + fl.offset * 1.2) * 0.15;
    var fp    = projFn(
      SHELF[si][0] + sWave - 0.6,
      SHELF[si][1] - so + sWave * 0.5
    );
    ctx.fillText(fl.text, fp.x, fp.y);
  }
}
