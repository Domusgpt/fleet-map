/**
 * Viking Village Fleet Map — Vessels Layer
 * ==========================================
 * Renders vessel triangles, wake trails, ping rings, fishing zone
 * halos, name labels, and a Barnegat Lighthouse compass rose.
 *
 * The compass rose is styled as a simplified lighthouse silhouette
 * with red and white bands, surrounded by compass points.
 *
 * Canvas: fleetCanvasVessels (z-index: 4)
 * Redraws every frame.
 */

var TAU = Math.PI * 2;

function statusColor(colors, status, alpha) {
  var base;
  switch (status) {
    case 'Fishing':    base = colors.ouro;  break;
    case 'Scalloping': base = colors.ouro;  break;
    case 'In Port':    base = colors.verde; break;
    case 'In Transit':
    case 'Returning':  base = colors.blade; break;
    default:           base = colors.blade; break;
  }
  return base.replace(/[\d.]+\)$/, alpha + ')');
}

/**
 * Draw the vessels layer.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {CanvasManager} cm — canvas manager
 * @param {Array}    vessels — array of vessel objects
 * @param {object}   config
 * @param {number}   t — animation time counter
 */
export function drawVessels(ctx, cm, vessels, config, t) {
  var w = cm.w;
  var h = cm.h;
  var projFn = cm.proj.bind(cm);
  var colors = config.colors;
  var fonts  = config.fonts;

  ctx.clearRect(0, 0, w, h);

  if (!vessels || !vessels.length) {
    drawLighthouseCompass(ctx, w, h, projFn, config, t);
    return;
  }

  var i, v, sp;

  // Fishing zone halos
  for (i = 0; i < vessels.length; i++) {
    v = vessels[i];
    if (v.status !== 'Fishing' && v.status !== 'Scalloping') continue;

    sp = projFn(v.lat, v.lon);
    var haloRadius = 32 + Math.sin(t * 1.5 + i) * 6;

    var haloGrad = ctx.createRadialGradient(sp.x, sp.y, 0, sp.x, sp.y, haloRadius);
    haloGrad.addColorStop(0, colors.ouro.replace(/[\d.]+\)$/, '0.08)'));
    haloGrad.addColorStop(1, colors.ouro.replace(/[\d.]+\)$/, '0)'));

    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, haloRadius, 0, TAU);
    ctx.fill();
  }

  // Wake trails
  for (i = 0; i < vessels.length; i++) {
    v = vessels[i];
    if (!v.trail || v.trail.length < 2) continue;

    ctx.beginPath();
    var tp0 = v.trail[0];
    ctx.moveTo(tp0.x, tp0.y);

    for (var ti = 1; ti < v.trail.length; ti++) {
      ctx.lineTo(v.trail[ti].x, v.trail[ti].y);
    }

    ctx.strokeStyle = colors.ouro.replace(/[\d.]+\)$/, '0.15)');
    ctx.lineWidth   = 1.5;
    ctx.globalAlpha = 1;
    ctx.stroke();
  }

  // Vessel triangles
  for (i = 0; i < vessels.length; i++) {
    v  = vessels[i];
    sp = projFn(v.lat, v.lon);

    v._sx = sp.x;
    v._sy = sp.y;

    var heading = v.heading || 0;
    var rad     = heading * Math.PI / 180;

    ctx.save();
    ctx.translate(sp.x, sp.y);
    ctx.rotate(rad);

    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(-3, 4);
    ctx.lineTo(3, 4);
    ctx.closePath();

    var fillAlpha;
    switch (v.status) {
      case 'Fishing':
      case 'Scalloping': fillAlpha = 0.9; break;
      case 'In Port':    fillAlpha = 0.7; break;
      default:           fillAlpha = 0.7; break;
    }
    ctx.fillStyle = statusColor(colors, v.status, fillAlpha);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth   = 0.5;
    ctx.stroke();

    ctx.restore();

    // Ping rings
    var phase = (t * 0.8 + i * 0.5) % 2;
    if (phase < 1) {
      var pingR     = 4 + phase * 12;
      var pingAlpha = (1 - phase) * 0.5;

      ctx.beginPath();
      ctx.arc(sp.x, sp.y, pingR, 0, TAU);
      ctx.strokeStyle = statusColor(colors, v.status, pingAlpha);
      ctx.lineWidth   = 1;
      ctx.stroke();
    }

    // Name labels
    var nameFontSize = Math.max(8, Math.round(w * 0.007));
    ctx.font         = nameFontSize + 'px ' + fonts.sans;
    ctx.fillStyle    = colors.creme.replace(/[\d.]+\)$/, '0.3)');
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(v.name, sp.x, sp.y + 8);
  }

  // Barnegat Lighthouse compass rose
  drawLighthouseCompass(ctx, w, h, projFn, config, t);
}

/**
 * Draw the Barnegat Lighthouse as a compass rose.
 * Renders a simplified lighthouse silhouette with red and white
 * horizontal bands, topped with a lantern and light beam.
 * Compass directions surround the base.
 */
function drawLighthouseCompass(ctx, w, h, projFn, config, t) {
  var colors = config.colors;
  var fonts  = config.fonts;

  // Position: bottom-right corner of the map
  var cx, cy;
  if (config.lighthouse && projFn) {
    // Try to use lighthouse position, but clamp to bottom-right area
    var lhPos = projFn(config.lighthouse.lat, config.lighthouse.lon);
    // If lighthouse is within map bounds, use its x but keep it in bottom area
    cx = Math.min(lhPos.x, w - 70);
    cy = h - 70;
  } else {
    cx = w - 70;
    cy = h - 70;
  }

  // Force to bottom-right for aesthetic
  cx = w - 65;
  cy = h - 75;

  var wobble = Math.sin(t * 0.3) * 0.02;
  var outerR = 42;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(wobble);
  ctx.globalAlpha = 0.25;

  // Outer compass circle
  ctx.beginPath();
  ctx.arc(0, 0, outerR, 0, TAU);
  ctx.strokeStyle = colors.creme;
  ctx.lineWidth   = 0.8;
  ctx.stroke();

  // Degree ticks
  for (var deg = 0; deg < 360; deg += 10) {
    var rad    = deg * Math.PI / 180;
    var isCard = (deg % 90 === 0);
    var tickLen = isCard ? 7 : 3;
    var r1 = outerR;
    var r2 = outerR + tickLen;

    ctx.beginPath();
    ctx.moveTo(Math.cos(rad) * r1, Math.sin(rad) * r1);
    ctx.lineTo(Math.cos(rad) * r2, Math.sin(rad) * r2);
    ctx.strokeStyle = colors.creme;
    ctx.lineWidth   = isCard ? 1.2 : 0.5;
    ctx.stroke();
  }

  // --- Lighthouse silhouette (center of compass) ---
  // Barnegat Lighthouse: RED upper half, WHITE lower half
  ctx.globalAlpha = 0.3;

  var lhW = 8;    // lighthouse width at base
  var lhH = 28;   // lighthouse height
  var topW = 6;    // width at top (tapers)
  var midY = -lhH / 2 + 4; // midpoint dividing red/white

  // Full tower outline — tapered trapezoid
  ctx.beginPath();
  ctx.moveTo(-lhW, 8);              // base left
  ctx.lineTo(-topW, -lhH + 4);     // top left
  ctx.lineTo(topW, -lhH + 4);      // top right
  ctx.lineTo(lhW, 8);              // base right
  ctx.closePath();

  // WHITE lower half
  ctx.save();
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(-lhW - 1, midY, (lhW + 1) * 2, lhH);
  // RED upper half
  ctx.fillStyle = colors.ouro.replace(/[\d.]+\)$/, '0.45)');
  ctx.fillRect(-topW - 1, -lhH, (topW + 1) * 2 + 4, midY + lhH);
  ctx.restore();

  // Tower outline stroke
  ctx.beginPath();
  ctx.moveTo(-lhW, 8);
  ctx.lineTo(-topW, -lhH + 4);
  ctx.lineTo(topW, -lhH + 4);
  ctx.lineTo(lhW, 8);
  ctx.closePath();
  ctx.strokeStyle = colors.creme;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.2;
  ctx.stroke();

  // Dividing line between red and white halves
  ctx.globalAlpha = 0.25;
  var divLeftW = topW + (lhW - topW) * 0.5;
  ctx.beginPath();
  ctx.moveTo(-divLeftW, midY);
  ctx.lineTo(divLeftW, midY);
  ctx.strokeStyle = colors.creme;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Lantern room (top)
  var lanternY = -lhH + 4;
  ctx.beginPath();
  ctx.rect(-topW - 1, lanternY - 6, (topW + 1) * 2, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fill();
  ctx.strokeStyle = colors.ouro;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Light beam — sweeping from the lantern
  var beamAngle = t * 0.8; // rotating beam
  var beamLen = outerR - 5;
  ctx.save();
  ctx.translate(0, lanternY - 3);

  // Beam sweep
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, beamLen, beamAngle - 0.15, beamAngle + 0.15);
  ctx.closePath();

  var beamGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, beamLen);
  beamGrad.addColorStop(0, 'rgba(255,255,200,0.3)');
  beamGrad.addColorStop(1, 'rgba(255,255,200,0)');
  ctx.fillStyle = beamGrad;
  ctx.globalAlpha = 0.15;
  ctx.fill();

  ctx.restore();

  // Cardinal letters N, S, E, W
  ctx.globalAlpha = 0.25;
  var letterR     = outerR + 12;
  var letterSize  = Math.max(8, Math.round(w * 0.008));
  ctx.font         = letterSize + 'px ' + fonts.sans;
  ctx.fillStyle    = colors.creme;
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillText('N', 0, -letterR);
  ctx.fillText('S', 0, letterR);
  ctx.fillText('E', letterR, 0);
  ctx.fillText('W', -letterR, 0);

  // "OLD BARNEY" label below
  ctx.globalAlpha = 0.12;
  ctx.font = Math.max(6, Math.round(w * 0.006)) + 'px ' + fonts.sans;
  ctx.fillStyle = colors.creme;
  ctx.fillText('OLD BARNEY', 0, outerR + 22);

  ctx.restore();
}
