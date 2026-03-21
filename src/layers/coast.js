/**
 * Fleet Map — Coast Layer
 * ========================
 * Renders the coastline, land fill, labels, ports, shipping routes,
 * and a decorative cartouche.
 *
 * This layer redraws each frame when animated elements are present
 * (shipping route dashes, port pulses).
 * Canvas: fleetCanvasCoast (z-index: 2)
 *
 * Customizable via config.colors:
 *   .land       — Array of 3 gradient stops [dark, mid, dark]
 *   .coastLine  — Coast outline color
 *   .coastGlow  — Outer glow color
 *   .verde      — Port marker color
 *   .blade      — Subtle text / route color
 *   .ouro       — Accent gold
 *   .creme      — Light text color
 *
 * Customizable via config.fonts:
 *   .display    — Display / title font
 *   .sans       — Sans-serif for labels
 */

/**
 * Build the smooth coastline path using quadratic bezier curves.
 * Uses midpoints between consecutive projected points as curve targets
 * so the line passes smoothly near each data point.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array}    coastData — [[lat,lon], ...]
 * @param {function} projFn    — projFn(lat,lon) => {x,y}
 * @returns {{ first: {x,y}, last: {x,y} }}
 */
function traceCoast(ctx, coastData, projFn) {
  var pts = [];
  var i, p;
  for (i = 0; i < coastData.length; i++) {
    pts.push(projFn(coastData[i][0], coastData[i][1]));
  }

  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);

  for (i = 0; i < pts.length - 1; i++) {
    var mx = (pts[i].x + pts[i + 1].x) * 0.5;
    var my = (pts[i].y + pts[i + 1].y) * 0.5;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my);
  }

  // Final segment to last point
  var last = pts[pts.length - 1];
  ctx.lineTo(last.x, last.y);

  return { first: pts[0], last: last };
}

/**
 * Draw the coast layer.
 *
 * Supports two call signatures:
 *   drawCoast(ctx, cm, coastData, ports, routes, config, t)         — CanvasManager style
 *   drawCoast(ctx, w, h, projFn, config, t, coastData, ports, routes) — explicit style
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasManager|number} cmOrW
 * @param {Array|number} coastDataOrH
 * @param {Array|function} portsOrProjFn
 * @param {Array|object} routesOrConfig
 * @param {object|number} configOrT
 * @param {number} [tOrCoastData]
 */
export function drawCoast(ctx, cmOrW, coastDataOrH, portsOrProjFn, routesOrConfig, configOrT, tOrCoastData) {
  var w, h, projFn, config, t, coastData, ports, routes, renderer;

  if (typeof cmOrW === 'object' && cmOrW.w !== undefined) {
    // CanvasManager style: (ctx, cm, coastData, ports, routes, config, t, renderer?)
    w = cmOrW.w;
    h = cmOrW.h;
    projFn = cmOrW.proj.bind(cmOrW);
    coastData = coastDataOrH;
    ports = portsOrProjFn;
    routes = routesOrConfig;
    config = configOrT;
    t = tOrCoastData;
    renderer = arguments[7] || null;
  } else {
    // Explicit style: (ctx, w, h, projFn, config, t, coastData, ports, routes, renderer?)
    w = cmOrW;
    h = coastDataOrH;
    projFn = portsOrProjFn;
    config = routesOrConfig;
    t = configOrT;
    coastData = tOrCoastData;
    ports = arguments[7];
    routes = arguments[8];
    renderer = arguments[9] || null;
  }

  var colors = config.colors;
  var fonts  = config.fonts;

  // ------------------------------------------------------------------
  // 1. Land fill — coastline closed along right edge of canvas
  // ------------------------------------------------------------------
  var ends = traceCoast(ctx, coastData, projFn);

  // Close the path along the right/bottom edge (land is east)
  ctx.lineTo(w + 10, ends.last.y);
  ctx.lineTo(w + 10, ends.first.y);
  ctx.closePath();

  // Linear gradient across the land mass
  var landStops = colors.land;
  var landGrad  = ctx.createLinearGradient(w * 0.6, 0, w, 0);
  landGrad.addColorStop(0.0, landStops[0]);
  landGrad.addColorStop(0.5, landStops[1]);
  landGrad.addColorStop(1.0, landStops[2]);

  ctx.fillStyle = landGrad;
  ctx.fill();

  // ------------------------------------------------------------------
  // 2. Coast outline — double stroke (glow + crisp line)
  // ------------------------------------------------------------------
  // Outer glow
  traceCoast(ctx, coastData, projFn);
  ctx.strokeStyle = colors.coastGlow;
  ctx.lineWidth   = 10;
  ctx.stroke();

  // Crisp line
  traceCoast(ctx, coastData, projFn);
  ctx.strokeStyle = colors.coastLine;
  ctx.lineWidth   = 2;
  ctx.stroke();

  // ------------------------------------------------------------------
  // 3. Land labels
  // ------------------------------------------------------------------
  var labelSize = Math.max(14, Math.round(w * 0.022));

  // "B R A Z I L"
  ctx.save();
  var bz = projFn(-18, -42);
  ctx.translate(bz.x, bz.y);
  ctx.rotate(-0.35);
  ctx.font         = labelSize + 'px ' + fonts.display;
  ctx.fillStyle    = colors.coastLine;
  ctx.globalAlpha  = 0.35;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('B R A Z I L', 0, 0);
  ctx.restore();

  // "S O U T H   A T L A N T I C"
  ctx.save();
  var sa = projFn(-28, -38);
  ctx.translate(sa.x, sa.y);
  ctx.rotate(-0.18);
  ctx.font         = Math.round(labelSize * 0.75) + 'px ' + fonts.sans;
  ctx.fillStyle    = colors.blade;
  ctx.globalAlpha  = 0.08;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S O U T H   A T L A N T I C', 0, 0);
  ctx.restore();

  ctx.globalAlpha = 1;

  // ------------------------------------------------------------------
  // 4. Shipping routes — animated dashed lines
  // ------------------------------------------------------------------
  if (routes && routes.length) {
    ctx.save();
    ctx.setLineDash([6, 10]);
    ctx.lineWidth = 1;

    for (var r = 0; r < routes.length; r++) {
      var route = routes[r];
      var rPts  = route.points;
      if (!rPts || rPts.length < 2) continue;

      ctx.strokeStyle  = colors.blade;
      ctx.globalAlpha  = 0.35;
      ctx.lineDashOffset = -t * 30;

      ctx.beginPath();
      var rp0 = projFn(rPts[0][0], rPts[0][1]);
      ctx.moveTo(rp0.x, rp0.y);
      for (var ri = 1; ri < rPts.length; ri++) {
        var rp = projFn(rPts[ri][0], rPts[ri][1]);
        ctx.lineTo(rp.x, rp.y);
      }
      ctx.stroke();

      // Label at the 3rd point (or last if fewer)
      var labelIdx = Math.min(2, rPts.length - 1);
      var rlp      = projFn(rPts[labelIdx][0], rPts[labelIdx][1]);
      ctx.font      = Math.max(9, Math.round(w * 0.009)) + 'px ' + fonts.sans;
      ctx.fillStyle = colors.blade;
      ctx.globalAlpha = 0.45;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('\u2192 ' + route.name, rlp.x + 6, rlp.y);
    }

    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ------------------------------------------------------------------
  // 5. Ports
  // ------------------------------------------------------------------
  if (ports && ports.length) {
    var portFontSize = Math.max(10, Math.round(w * 0.012));
    var theme = (renderer && renderer.theme) || null;
    var pulseSpeed = (theme && theme.symbols && theme.symbols.port && theme.symbols.port.pulseSpeed !== undefined)
      ? theme.symbols.port.pulseSpeed : 2.5;

    for (var pi = 0; pi < ports.length; pi++) {
      var port   = ports[pi];
      var pp     = projFn(port.lat, port.lon);
      var major  = port.size === 'major';
      var radius = major ? 5 : 3;

      if (renderer) {
        // Use asset renderer for proper port symbols
        renderer.drawPort(ctx, port, pp, {
          t: t,
          colors: colors,
          fonts: fonts,
          w: w,
        });
      } else {
        // Fallback: simple dot rendering
        // Pulse ring for major ports
        if (major && pulseSpeed > 0) {
          var pulse = Math.sin(t * pulseSpeed) * 0.5 + 0.5;
          ctx.beginPath();
          ctx.arc(pp.x, pp.y, radius + 4 + pulse * 6, 0, Math.PI * 2);
          ctx.strokeStyle = colors.verde;
          ctx.globalAlpha = 0.15 * (1 - pulse);
          ctx.lineWidth   = 1;
          ctx.stroke();
        }

        // Port dot
        ctx.beginPath();
        ctx.arc(pp.x, pp.y, radius, 0, Math.PI * 2);
        ctx.fillStyle   = colors.verde;
        ctx.globalAlpha = 0.85;
        ctx.fill();
      }

      // Port label
      ctx.font         = portFontSize + 'px ' + fonts.sans;
      ctx.fillStyle    = colors.verde;
      ctx.globalAlpha  = 0.65;
      ctx.textAlign    = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(port.name.toUpperCase(), pp.x + radius + 5, pp.y);
    }

    ctx.globalAlpha = 1;
  }

  // ------------------------------------------------------------------
  // 6. Cartouche — decorative title frame (top-left)
  // ------------------------------------------------------------------
  if (config.title) {
    ctx.save();

    var cx  = 24;
    var cy  = 24;
    var cw  = Math.min(260, w * 0.28);
    var ch  = config.subtitle ? 68 : 48;
    var pad = 14;

    ctx.globalAlpha = 0.35;

    // Single clean border
    ctx.strokeStyle = colors.ouro;
    ctx.lineWidth   = 1;
    ctx.strokeRect(cx, cy, cw, ch);

    // Title text
    var titleSize = Math.max(13, Math.round(cw * 0.07));
    ctx.font         = titleSize + 'px ' + fonts.display;
    ctx.fillStyle    = colors.creme;
    ctx.globalAlpha  = 0.5;
    ctx.textAlign    = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(config.title, cx + pad, cy + pad);

    // Subtitle
    if (config.subtitle) {
      var subSize = Math.max(9, Math.round(titleSize * 0.65));
      ctx.font        = subSize + 'px ' + fonts.sans;
      ctx.globalAlpha = 0.4;
      ctx.fillText(config.subtitle, cx + pad, cy + pad + titleSize + 6);
    }

    ctx.restore();
  }
}
