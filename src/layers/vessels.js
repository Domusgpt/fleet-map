/**
 * Fleet Map — Vessels Layer
 * ==========================
 * Renders vessel triangles, wake trails, ping rings, fishing zone
 * halos, name labels, and a decorative compass rose.
 *
 * Canvas: fleetCanvasVessels (z-index: 4, top layer)
 * Redraws every frame.
 *
 * Customizable via config.colors:
 *   .ouro   — Fishing vessel / compass accent (gold)
 *   .verde  — In-port vessel (green)
 *   .blade  — Transit/returning vessel (steel blue)
 *   .creme  — Label text color
 *
 * Customizable via config.fonts:
 *   .sans — Label font
 */

var TAU = Math.PI * 2;

/**
 * Return a fill color string for a vessel based on its status.
 */
function statusColor(colors, status, alpha) {
  var base;
  switch (status) {
    case 'Fishing':   base = colors.ouro;  break;
    case 'In Port':   base = colors.verde; break;
    case 'In Transit':
    case 'Returning': base = colors.blade; break;
    default:          base = colors.blade; break;
  }
  return base.replace(/[\d.]+\)$/, alpha + ')');
}

/**
 * Draw the vessels layer.
 *
 * @param {CanvasRenderingContext2D} ctx     — canvas context
 * @param {CanvasManager|number} cmOrW      — canvas manager or width
 * @param {Array|number}  vesselsOrH        — vessels array or height
 * @param {object}   config  — merged FleetMap config
 * @param {number}   t       — animation time counter
 * @param {object}   [renderer] — AssetRenderer instance (optional)
 *
 * Supports two call signatures:
 *   drawVessels(ctx, cm, vessels, config, t, renderer)      — CanvasManager style
 *   drawVessels(ctx, w, h, projFn, config, t, vessels, renderer) — explicit style
 */
export function drawVessels(ctx, cmOrW, vesselsOrH, config, t, renderer) {
  var w, h, projFn, vessels;

  // Detect call signature
  if (typeof cmOrW === 'object' && cmOrW.w !== undefined) {
    // CanvasManager style: (ctx, cm, vessels, config, t, renderer)
    w = cmOrW.w;
    h = cmOrW.h;
    projFn = cmOrW.proj.bind(cmOrW);
    vessels = vesselsOrH;
  } else {
    // Explicit style: (ctx, w, h, projFn, config, t, vessels, renderer)
    w = cmOrW;
    h = vesselsOrH;
    projFn = config;
    config = t;
    t = renderer;
    vessels = arguments[6];
    renderer = arguments[7];
  }

  var colors = config.colors;
  var fonts  = config.fonts;

  // Theme-aware properties
  var theme = (renderer && renderer.theme) || null;
  var vesselSymbols = (theme && theme.symbols && theme.symbols.vessel) || {};
  var glowRadius = vesselSymbols.glowRadius !== undefined ? vesselSymbols.glowRadius : 32;
  var trailStyle = vesselSymbols.trailStyle || 'line';

  // ------------------------------------------------------------------
  // 1. Clear canvas (transparent)
  // ------------------------------------------------------------------
  ctx.clearRect(0, 0, w, h);

  if (!vessels || !vessels.length) {
    drawCompassRose(ctx, w, h, config, t);
    return;
  }

  var i, v, sp;

  // ------------------------------------------------------------------
  // 2. Fishing zone halos
  // ------------------------------------------------------------------
  if (glowRadius > 0) {
  for (i = 0; i < vessels.length; i++) {
    v = vessels[i];
    if (v.status !== 'Fishing') continue;

    sp = projFn(v.lat, v.lon);
    var haloRadius = glowRadius + Math.sin(t * 1.5 + i) * 6;

    var haloGrad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, haloRadius);
    haloGrad.addColorStop(0, colors.ouro.replace(/[\d.]+\)$/, '0.18)'));
    haloGrad.addColorStop(0.5, colors.ouro.replace(/[\d.]+\)$/, '0.06)'));
    haloGrad.addColorStop(1, colors.ouro.replace(/[\d.]+\)$/, '0)'));

    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, haloRadius, 0, TAU);
    ctx.fill();
  }
  } // end glowRadius > 0

  // ------------------------------------------------------------------
  // 3. Wake trails
  // ------------------------------------------------------------------
  if (trailStyle !== 'none') {
  for (i = 0; i < vessels.length; i++) {
    v = vessels[i];
    if (!v.trail || v.trail.length < 2) continue;

    if (trailStyle === 'dotted') {
      ctx.setLineDash([2, 4]);
    }

    // Draw trail segments with fading opacity (newest = bright, oldest = dim)
    var trailLen = v.trail.length;
    for (var ti = 1; ti < trailLen; ti++) {
      var segAlpha = 0.35 * (ti / trailLen);
      var segWidth = 0.5 + 1.5 * (ti / trailLen);

      ctx.beginPath();
      ctx.moveTo(v.trail[ti - 1].x, v.trail[ti - 1].y);
      ctx.lineTo(v.trail[ti].x, v.trail[ti].y);
      ctx.strokeStyle = statusColor(colors, v.status, segAlpha);
      ctx.lineWidth   = segWidth;
      ctx.stroke();
    }

    if (trailStyle === 'dotted') {
      ctx.setLineDash([]);
    }
  }
  } // end trailStyle !== 'none'

  // ------------------------------------------------------------------
  // 4. Vessel triangles
  // ------------------------------------------------------------------
  for (i = 0; i < vessels.length; i++) {
    v  = vessels[i];
    sp = projFn(v.lat, v.lon);

    // Store screen position for hover detection
    v._sx = sp.x;
    v._sy = sp.y;

    var heading = v.heading || 0;
    var rad     = heading * Math.PI / 180;

    // Fill based on status
    var fillAlpha;
    switch (v.status) {
      case 'Fishing':   fillAlpha = 0.9; break;
      case 'In Port':   fillAlpha = 0.7; break;
      default:          fillAlpha = 0.7; break;
    }
    var vesselColor = statusColor(colors, v.status, fillAlpha);

    // Use asset renderer if available, otherwise fall back to triangle
    if (renderer) {
      renderer.drawVessel(ctx, v, sp, {
        t: t,
        colors: colors,
        fonts: fonts,
        w: w,
        index: i,
      });
    } else {
      ctx.save();
      ctx.translate(sp.x, sp.y);
      ctx.rotate(rad);

      // Triangle: tip at top, base at bottom
      ctx.beginPath();
      ctx.moveTo(0, -8);
      ctx.lineTo(-5, 6);
      ctx.lineTo(5, 6);
      ctx.closePath();

      ctx.fillStyle = vesselColor;
      ctx.fill();

      // Thin white stroke
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth   = 0.5;
      ctx.stroke();

      ctx.restore();
    }

    // ------------------------------------------------------------------
    // 5. Ping rings
    // ------------------------------------------------------------------
    var phase = (t * 0.8 + i * 0.5) % 2;
    if (phase < 1) {
      var pingR     = 6 + phase * 16;
      var pingAlpha = (1 - phase) * 0.7;

      ctx.beginPath();
      ctx.arc(sp.x, sp.y, pingR, 0, TAU);
      ctx.strokeStyle = statusColor(colors, v.status, pingAlpha);
      ctx.lineWidth   = 1;
      ctx.stroke();
    }

    // ------------------------------------------------------------------
    // 6. Name labels
    // ------------------------------------------------------------------
    var nameFontSize = Math.max(9, Math.round(w * 0.009));
    ctx.font         = nameFontSize + 'px ' + fonts.sans;
    ctx.fillStyle    = colors.creme.replace(/[\d.]+\)$/, '0.55)');
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(v.name, sp.x, sp.y + 11);
  }

  // ------------------------------------------------------------------
  // 7. Compass rose (bottom-right)
  // ------------------------------------------------------------------
  drawCompassRose(ctx, w, h, config, t);
}

/**
 * Draw a decorative compass rose in the bottom-right corner.
 */
function drawCompassRose(ctx, w, h, config, t) {
  var colors = config.colors;
  var fonts  = config.fonts;

  var cx     = w - 60;
  var cy     = h - 60;
  var outerR = 42;
  var innerR = 16;
  var tickR  = outerR + 6;

  var wobble = Math.sin(t * 0.3) * 0.05;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(wobble);
  ctx.globalAlpha = 0.5;

  // Outer circle
  ctx.beginPath();
  ctx.arc(0, 0, outerR, 0, TAU);
  ctx.strokeStyle = colors.ouro;
  ctx.lineWidth   = 0.8;
  ctx.stroke();

  // Degree tick marks
  for (var deg = 0; deg < 360; deg += 10) {
    var rad    = deg * Math.PI / 180;
    var isCard = (deg % 90 === 0);
    var tickLen = isCard ? 6 : 3;
    var r1 = outerR;
    var r2 = outerR + tickLen;

    ctx.beginPath();
    ctx.moveTo(Math.cos(rad) * r1, Math.sin(rad) * r1);
    ctx.lineTo(Math.cos(rad) * r2, Math.sin(rad) * r2);
    ctx.strokeStyle = colors.ouro;
    ctx.lineWidth   = isCard ? 1 : 0.5;
    ctx.stroke();
  }

  // 8-point star
  ctx.globalAlpha = 0.4;
  for (var pt = 0; pt < 8; pt++) {
    var angle   = pt * (TAU / 8) - Math.PI / 2; // start from north
    var isMain  = (pt % 2 === 0);
    var starLen = isMain ? outerR - 2 : innerR + 4;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * starLen, Math.sin(angle) * starLen);

    // Side points of the star diamond
    var halfAngle = TAU / 16;
    var sideR     = isMain ? 6 : 4;
    ctx.lineTo(
      Math.cos(angle - halfAngle) * sideR,
      Math.sin(angle - halfAngle) * sideR
    );
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * starLen, Math.sin(angle) * starLen);
    ctx.lineTo(
      Math.cos(angle + halfAngle) * sideR,
      Math.sin(angle + halfAngle) * sideR
    );
    ctx.closePath();

    ctx.fillStyle = isMain ? colors.ouro : colors.creme;
    ctx.globalAlpha = isMain ? 0.45 : 0.25;
    ctx.fill();
  }

  // Cardinal letters N, S, E, W
  ctx.globalAlpha = 0.6;
  var letterR     = tickR + 8;
  var letterSize  = Math.max(8, Math.round(w * 0.008));
  ctx.font         = letterSize + 'px ' + fonts.sans;
  ctx.fillStyle    = colors.creme;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText('N', 0, -letterR);
  ctx.fillText('S', 0, letterR);
  ctx.fillText('E', letterR, 0);
  ctx.fillText('W', -letterR, 0);

  // Inner ring
  ctx.beginPath();
  ctx.arc(0, 0, innerR, 0, TAU);
  ctx.strokeStyle = colors.ouro;
  ctx.lineWidth   = 0.5;
  ctx.globalAlpha = 0.15;
  ctx.stroke();

  ctx.restore();
}
