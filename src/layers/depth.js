/**
 * Fleet Map — Depth Layer
 * ========================
 * Renders the ocean background: bathymetry gradient, depth zone bands,
 * fathom contour lines, underwater caustic patterns, and the
 * latitude/longitude grid.
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

// Continental shelf edge — Brazil coast (lat, lon pairs).
var SHELF_BRAZIL = [
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

// Continental shelf edge — NJ coast
var SHELF_NJ = [
  [40.8, -72.8],
  [40.5, -72.6],
  [40.2, -72.5],
  [40.0, -72.4],
  [39.8, -72.3],
  [39.6, -72.4],
  [39.4, -72.5],
  [39.2, -72.7],
  [39.0, -72.9],
  [38.8, -73.1],
];

// Keep backwards-compat alias
var SHELF = SHELF_BRAZIL;

// Fathom labels placed at selected contour indices
var FATHOM_LABELS_BRAZIL = [
  { idx: 2,  offset: 0, text: '100 fm' },
  { idx: 6,  offset: 1, text: '500 fm' },
  { idx: 10, offset: 2, text: '1000 fm' },
  { idx: 12, offset: 2, text: '2000 fm' },
];

var FATHOM_LABELS_NJ = [
  { idx: 1,  offset: 0, text: '50 fm' },
  { idx: 4,  offset: 1, text: '200 fm' },
  { idx: 7,  offset: 2, text: '1000 fm' },
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
 * Simple deterministic pseudo-noise for caustic patterns.
 * Returns a value between 0 and 1.
 */
function noise2d(x, y) {
  var n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

/**
 * Smooth interpolated noise for organic-looking caustic patterns.
 */
function smoothNoise(x, y) {
  var ix = Math.floor(x);
  var iy = Math.floor(y);
  var fx = x - ix;
  var fy = y - iy;

  // Smooth interpolation
  fx = fx * fx * (3 - 2 * fx);
  fy = fy * fy * (3 - 2 * fy);

  var a = noise2d(ix, iy);
  var b = noise2d(ix + 1, iy);
  var c = noise2d(ix, iy + 1);
  var d = noise2d(ix + 1, iy + 1);

  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/**
 * Parse r, g, b from an rgba() string.
 */
function parseRGB(rgbaStr) {
  var m = rgbaStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (!m) return { r: 4, g: 10, b: 16 };
  return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10) };
}

/**
 * Draw the depth layer: ocean gradient, depth zones, caustics,
 * lat/lon grid, and fathom contours.
 *
 * Supports two call signatures:
 *   drawDepth(ctx, cm, config)                    — CanvasManager style
 *   drawDepth(ctx, w, h, projFn, config, t)       — explicit style
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

  // Determine which shelf data to use based on coastData config
  var isNJ = (config.coastData === 'lbi');
  var shelfData = isNJ ? SHELF_NJ : SHELF_BRAZIL;
  var fathomLabels = isNJ ? FATHOM_LABELS_NJ : FATHOM_LABELS_BRAZIL;

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
  // 3. Depth zone bands — concentric gradient zones showing bathymetry
  // ------------------------------------------------------------------
  var deep = parseRGB(colors.deep);

  // Shallow zone near coast (right side for Brazil / left side depends on coast)
  // We create horizontal bands that get darker moving away from coast
  var zoneCount = 5;
  for (var z = 0; z < zoneCount; z++) {
    var zFrac = z / zoneCount;
    var nextFrac = (z + 1) / zoneCount;

    // Brightness decreases with depth
    var brightMul = 1.0 - zFrac * 0.6;
    var zoneAlpha = 0.12 * brightMul;

    // For NJ, coast is on the left (west); for Brazil, coast is on the right (east)
    var zoneGrad;
    if (isNJ) {
      // Shallow on left, deep on right
      var x0 = w * zFrac;
      var x1 = w * nextFrac;
      zoneGrad = ctx.createLinearGradient(x0, 0, x1, 0);
    } else {
      // Shallow on right, deep on left
      var rx0 = w * (1 - zFrac);
      var rx1 = w * (1 - nextFrac);
      zoneGrad = ctx.createLinearGradient(rx0, 0, rx1, 0);
    }

    // Lighter water color for shallow zones
    var zr = Math.min(255, deep.r + Math.round(60 * brightMul));
    var zg = Math.min(255, deep.g + Math.round(90 * brightMul));
    var zb = Math.min(255, deep.b + Math.round(120 * brightMul));

    zoneGrad.addColorStop(0.0, 'rgba(' + zr + ',' + zg + ',' + zb + ',' + zoneAlpha + ')');
    zoneGrad.addColorStop(1.0, 'rgba(' + zr + ',' + zg + ',' + zb + ',0)');

    ctx.fillStyle = zoneGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // ------------------------------------------------------------------
  // 4. Underwater caustic light pattern — subtle light dapples
  // ------------------------------------------------------------------
  var causticScale = Math.max(1, Math.round(w / 200));
  var cellW = w / causticScale;
  var cellH = h / causticScale;

  // Draw caustics as subtle bright spots
  for (var cy2 = 0; cy2 < causticScale; cy2++) {
    for (var cx2 = 0; cx2 < causticScale; cx2++) {
      var nVal = smoothNoise(cx2 * 0.8, cy2 * 0.8);
      var nVal2 = smoothNoise(cx2 * 1.6 + 50, cy2 * 1.6 + 50);
      var combined = (nVal + nVal2) * 0.5;

      // Only draw bright spots (caustic peaks)
      if (combined > 0.5) {
        var intensity = (combined - 0.5) / 0.5;
        var alpha = intensity * 0.09;

        ctx.fillStyle = 'rgba(' +
          Math.min(255, deep.r + 100) + ',' +
          Math.min(255, deep.g + 140) + ',' +
          Math.min(255, deep.b + 180) + ',' +
          alpha + ')';
        ctx.fillRect(
          cx2 * cellW,
          cy2 * cellH,
          cellW + 1,
          cellH + 1
        );
      }
    }
  }

  // ------------------------------------------------------------------
  // 5. Depth shimmer highlights — larger gentle light bands
  // ------------------------------------------------------------------
  for (var si = 0; si < 10; si++) {
    var shimX = w * (0.05 + noise2d(si * 3.7, 1.2) * 0.9);
    var shimY = h * (0.05 + noise2d(1.2, si * 3.7) * 0.9);
    var shimR = Math.min(w, h) * (0.1 + noise2d(si, si) * 0.18);

    var shimGrad = ctx.createRadialGradient(shimX, shimY, 0, shimX, shimY, shimR);
    shimGrad.addColorStop(0.0, 'rgba(' +
      Math.min(255, deep.r + 70) + ',' +
      Math.min(255, deep.g + 100) + ',' +
      Math.min(255, deep.b + 130) + ',0.12)');
    shimGrad.addColorStop(1.0, 'rgba(' +
      Math.min(255, deep.r + 70) + ',' +
      Math.min(255, deep.g + 100) + ',' +
      Math.min(255, deep.b + 130) + ',0)');

    ctx.fillStyle = shimGrad;
    ctx.fillRect(0, 0, w, h);
  }

  // ------------------------------------------------------------------
  // 6. Lat/Lon grid — every 5 degrees (or 1 degree for small bounds)
  // ------------------------------------------------------------------
  var latRange = bounds.latN - bounds.latS;
  var lonRange = bounds.lonE - bounds.lonW;
  var gridStep = (latRange < 5 || lonRange < 5) ? 1 : 5;

  ctx.strokeStyle = colors.grid;
  ctx.lineWidth   = 0.5;
  ctx.setLineDash([2, 6]);

  var lat, lon, p1, p2;

  // Latitude lines (horizontal)
  var latStart = Math.ceil(bounds.latS / gridStep) * gridStep;
  var latEnd   = Math.floor(bounds.latN / gridStep) * gridStep;
  for (lat = latStart; lat <= latEnd; lat += gridStep) {
    p1 = projFn(lat, bounds.lonW);
    p2 = projFn(lat, bounds.lonE);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // Longitude lines (vertical)
  var lonStart = Math.ceil(bounds.lonW / gridStep) * gridStep;
  var lonEnd   = Math.floor(bounds.lonE / gridStep) * gridStep;
  for (lon = lonStart; lon <= lonEnd; lon += gridStep) {
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
  for (lat = latStart; lat <= latEnd; lat += gridStep) {
    var pLabel = projFn(lat, bounds.lonW);
    ctx.fillText(latLabel(lat), 6, pLabel.y + 3);
  }

  // Longitude labels (bottom edge)
  ctx.textBaseline = 'bottom';
  ctx.textAlign    = 'center';
  for (lon = lonStart; lon <= lonEnd; lon += gridStep) {
    var pLonLabel = projFn(bounds.latS, lon);
    ctx.fillText(lonLabel(lon), pLonLabel.x, h - 4);
  }

  // ------------------------------------------------------------------
  // 7. Depth contour lines (continental shelf) with glow
  // ------------------------------------------------------------------
  var contourCount = isNJ ? 4 : 3;
  var contourSpacing = isNJ ? 0.6 : 1.5;

  // Parse fathom color for glow
  var fathomRGB = parseRGB(colors.fathom);

  for (var c = 0; c < contourCount; c++) {
    var offset = c * contourSpacing;

    // Contour glow (wider, more transparent)
    ctx.beginPath();
    for (var gi = 0; gi < shelfData.length; gi++) {
      var gLat = shelfData[gi][0];
      var gLon = shelfData[gi][1] - offset;
      var gWave = Math.sin(t * 0.6 + gi * 0.9 + c * 1.2) * 0.15;
      gLat += gWave;
      gLon += gWave * 0.5;
      var gp = projFn(gLat, gLon);

      if (gi === 0) {
        ctx.moveTo(gp.x, gp.y);
      } else {
        var gPrev = shelfData[gi - 1];
        var gPLat = gPrev[0] + Math.sin(t * 0.6 + (gi - 1) * 0.9 + c * 1.2) * 0.15;
        var gPLon = gPrev[1] - offset + Math.sin(t * 0.6 + (gi - 1) * 0.9 + c * 1.2) * 0.15 * 0.5;
        var gpp = projFn(gPLat, gPLon);
        var gcpx = (gpp.x + gp.x) * 0.5;
        var gcpy = (gpp.y + gp.y) * 0.5;
        ctx.quadraticCurveTo(gpp.x, gpp.y, gcpx, gcpy);
      }
    }
    var gLast = shelfData[shelfData.length - 1];
    var gLastWave = Math.sin(t * 0.6 + (shelfData.length - 1) * 0.9 + c * 1.2) * 0.15;
    var gLastP = projFn(gLast[0] + gLastWave, gLast[1] - offset + gLastWave * 0.5);
    ctx.lineTo(gLastP.x, gLastP.y);

    // Glow stroke
    ctx.strokeStyle = 'rgba(' + fathomRGB.r + ',' + fathomRGB.g + ',' + fathomRGB.b + ',0.18)';
    ctx.lineWidth = 8;
    ctx.stroke();

    // Crisp contour line
    ctx.beginPath();
    for (var i = 0; i < shelfData.length; i++) {
      var sLat = shelfData[i][0];
      var sLon = shelfData[i][1] - offset;

      // Subtle sin() wave animation along the contour
      var wave = Math.sin(t * 0.6 + i * 0.9 + c * 1.2) * 0.15;
      sLat += wave;
      sLon += wave * 0.5;

      var sp = projFn(sLat, sLon);

      if (i === 0) {
        ctx.moveTo(sp.x, sp.y);
      } else {
        // Smooth curve through points using quadratic bezier
        var prev  = shelfData[i - 1];
        var pLat  = prev[0] + Math.sin(t * 0.6 + (i - 1) * 0.9 + c * 1.2) * 0.15;
        var pLon  = prev[1] - offset + Math.sin(t * 0.6 + (i - 1) * 0.9 + c * 1.2) * 0.15 * 0.5;
        var pp    = projFn(pLat, pLon);
        var cpx   = (pp.x + sp.x) * 0.5;
        var cpy   = (pp.y + sp.y) * 0.5;
        ctx.quadraticCurveTo(pp.x, pp.y, cpx, cpy);
      }
    }

    // Draw the last segment to the final point
    var last = shelfData[shelfData.length - 1];
    var lastWave = Math.sin(t * 0.6 + (shelfData.length - 1) * 0.9 + c * 1.2) * 0.15;
    var lastP = projFn(last[0] + lastWave, last[1] - offset + lastWave * 0.5);
    ctx.lineTo(lastP.x, lastP.y);

    // Vary line opacity by depth
    var contourAlpha = 0.4 - c * 0.08;
    if (contourAlpha < 0.12) contourAlpha = 0.12;
    ctx.strokeStyle = 'rgba(' + fathomRGB.r + ',' + fathomRGB.g + ',' + fathomRGB.b + ',' + contourAlpha + ')';
    ctx.lineWidth = 1.8 - c * 0.2;
    if (ctx.lineWidth < 0.8) ctx.lineWidth = 0.8;
    ctx.stroke();
  }

  // Fathom labels
  var fathomFontSize = Math.max(8, Math.round(w * 0.008));
  ctx.font      = fathomFontSize + 'px ' + fonts.sans;
  ctx.fillStyle = colors.fathom;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (var f = 0; f < fathomLabels.length; f++) {
    var fl    = fathomLabels[f];
    if (fl.idx >= shelfData.length) continue;
    var fsi   = fl.idx;
    var so    = fl.offset * contourSpacing;
    var sWave = Math.sin(t * 0.6 + fsi * 0.9 + fl.offset * 1.2) * 0.15;
    var fp    = projFn(
      shelfData[fsi][0] + sWave - 0.3,
      shelfData[fsi][1] - so + sWave * 0.5
    );
    ctx.fillText(fl.text, fp.x, fp.y);
  }

  // ------------------------------------------------------------------
  // 8. Depth sounding dots — scattered depth markers
  // ------------------------------------------------------------------
  var soundingFontSize = Math.max(7, Math.round(w * 0.007));
  ctx.font = soundingFontSize + 'px ' + fonts.sans;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Generate deterministic sounding positions within bounds
  var soundingCount = 12;
  for (var sd = 0; sd < soundingCount; sd++) {
    var sdLat = bounds.latS + (bounds.latN - bounds.latS) * noise2d(sd * 7.3, 2.1);
    var sdLon = bounds.lonW + (bounds.lonE - bounds.lonW) * noise2d(3.7, sd * 5.1);
    var sdP = projFn(sdLat, sdLon);

    // Calculate a pseudo-depth based on distance from coast (approximate)
    var coastFrac = isNJ
      ? (sdLon - bounds.lonW) / (bounds.lonE - bounds.lonW)
      : 1.0 - (sdLon - bounds.lonW) / (bounds.lonE - bounds.lonW);
    var depthVal = Math.round(20 + coastFrac * 2000 * noise2d(sd * 2.3, sd * 1.7));

    // Small dot
    ctx.beginPath();
    ctx.arc(sdP.x, sdP.y, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(' + fathomRGB.r + ',' + fathomRGB.g + ',' + fathomRGB.b + ',0.3)';
    ctx.fill();

    // Depth number
    ctx.fillStyle = 'rgba(' + fathomRGB.r + ',' + fathomRGB.g + ',' + fathomRGB.b + ',0.25)';
    ctx.fillText(depthVal + '', sdP.x, sdP.y - 6);
  }
}
