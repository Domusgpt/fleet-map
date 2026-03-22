/**
 * Fleet Map — Currents Layer
 * ===========================
 * Particle-based ocean current animation. Hundreds of small particles
 * drift along defined current paths, creating a subtle flowing effect.
 *
 * Canvas: fleetCanvasCurrents (z-index: 3)
 *
 * Two exports:
 *   initParticles(config, w, h, bounds) — creates particle array
 *   drawCurrents(ctx, w, h, projFn, config, t, particles, currentData, bounds)
 *     — updates + draws every frame at 60fps
 *
 * Customizable via config:
 *   .particleCount       — number of particles (desktop)
 *   .particleCountMobile — number of particles (mobile)
 *   .mobileBreakpoint    — width threshold for mobile
 *   .colors.blade        — particle color
 */

/**
 * Create the initial particle pool.
 *
 * @param {object} config — merged FleetMap config
 * @param {number} w      — canvas width
 * @param {number} h      — canvas height
 * @param {object} bounds — { latN, latS, lonW, lonE }
 * @returns {Array} particles
 */
export function initParticles(config, w, h, bounds) {
  var isMobile = (typeof window !== 'undefined') && window.innerWidth < config.mobileBreakpoint;
  var count    = isMobile ? config.particleCountMobile : config.particleCount;
  var particles = new Array(count);

  for (var i = 0; i < count; i++) {
    particles[i] = spawnParticle(w, h);
  }

  return particles;
}

/**
 * Create a single particle at a random canvas position.
 */
function spawnParticle(w, h) {
  var maxLife = 80 + Math.random() * 120;
  return {
    x:       Math.random() * w,
    y:       Math.random() * h,
    vx:      0,
    vy:      0,
    life:    Math.random() * maxLife,
    maxLife: maxLife,
    alpha:   0
  };
}

/**
 * Find the squared distance from point (px,py) to the nearest point
 * on segment (ax,ay)-(bx,by), and return the direction unit vector
 * along that segment.
 *
 * @returns {{ distSq: number, dx: number, dy: number }}
 */
function segmentInfo(px, py, ax, ay, bx, by) {
  var abx = bx - ax;
  var aby = by - ay;
  var len2 = abx * abx + aby * aby;
  if (len2 < 0.0001) {
    var ddx = px - ax;
    var ddy = py - ay;
    return { distSq: ddx * ddx + ddy * ddy, dx: 0, dy: 0 };
  }

  // Parametric projection of point onto segment
  var tt = ((px - ax) * abx + (py - ay) * aby) / len2;
  if (tt < 0) tt = 0;
  if (tt > 1) tt = 1;

  var nx = ax + tt * abx - px;
  var ny = ay + tt * aby - py;

  // Direction unit vector along segment
  var len = Math.sqrt(len2);

  return {
    distSq: nx * nx + ny * ny,
    dx: abx / len,
    dy: aby / len
  };
}

/**
 * Draw (and advance) the particle current layer.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number}   w           — canvas width
 * @param {number}   h           — canvas height
 * @param {function} projFn      — projFn(lat, lon) => {x,y}
 * @param {object}   config      — merged FleetMap config
 * @param {number}   t           — animation time counter
 * @param {Array}    particles   — particle pool (mutated in place)
 * @param {Array}    currentData — [{ points, strength, width }, ...]
 * @param {object}   bounds      — { latN, latS, lonW, lonE }
 */
export function drawCurrents(ctx, wOrCm, hOrParticles, projFnOrCurrentData, configOrCfg, tOrT, particlesArg, currentDataArg, boundsArg) {
  var w, h, projFn, config, t, particles, currentData, bounds;

  if (typeof wOrCm === 'object' && wOrCm.w !== undefined) {
    // CanvasManager style: (ctx, cm, particles, currentData, config, t)
    w = wOrCm.w;
    h = wOrCm.h;
    projFn = wOrCm.proj.bind(wOrCm);
    particles = hOrParticles;
    currentData = projFnOrCurrentData;
    config = configOrCfg;
    t = tOrT;
    bounds = config.bounds;
  } else {
    // Explicit style: (ctx, w, h, projFn, config, t, particles, currentData, bounds)
    w = wOrCm;
    h = hOrParticles;
    projFn = projFnOrCurrentData;
    config = configOrCfg;
    t = tOrT;
    particles = particlesArg;
    currentData = currentDataArg;
    bounds = boundsArg;
  }

  ctx.clearRect(0, 0, w, h);

  var color = config.colors.blade;

  // Pre-project all current segment endpoints once per frame
  var segs = [];  // [{ ax, ay, bx, by, dx, dy, strength, widthSq }]
  var ci, si, cp, segP1, segP2;
  for (ci = 0; ci < currentData.length; ci++) {
    var cur = currentData[ci];
    var cPts = cur.points;
    // Convert width from degrees to approximate pixels
    var refA = projFn(bounds.latN, bounds.lonW);
    var refB = projFn(bounds.latN, bounds.lonW + cur.width);
    var widthPx = Math.abs(refB.x - refA.x);
    var widthSq = widthPx * widthPx;

    for (si = 0; si < cPts.length - 1; si++) {
      segP1 = projFn(cPts[si][0], cPts[si][1]);
      segP2 = projFn(cPts[si + 1][0], cPts[si + 1][1]);
      var sdx = segP2.x - segP1.x;
      var sdy = segP2.y - segP1.y;
      var sLen = Math.sqrt(sdx * sdx + sdy * sdy);
      if (sLen < 0.01) continue;
      segs.push({
        ax: segP1.x, ay: segP1.y,
        bx: segP2.x, by: segP2.y,
        dx: sdx / sLen, dy: sdy / sLen,
        strength: cur.strength,
        widthSq: widthSq
      });
    }
  }

  // Update and draw each particle
  var p, info, bestDist, bestDx, bestDy, bestStr;
  var seg;
  var fadeIn, fadeOut, alpha;

  ctx.lineCap = 'round';

  for (var i = 0; i < particles.length; i++) {
    p = particles[i];

    // Find the nearest current segment influence
    bestDist = Infinity;
    bestDx   = 0;
    bestDy   = 0;
    bestStr  = 0;

    for (si = 0; si < segs.length; si++) {
      seg  = segs[si];
      info = segmentInfo(p.x, p.y, seg.ax, seg.ay, seg.bx, seg.by);

      if (info.distSq < seg.widthSq && info.distSq < bestDist) {
        bestDist = info.distSq;
        bestDx   = seg.dx;
        bestDy   = seg.dy;
        bestStr  = seg.strength;
      }
    }

    // Apply force
    if (bestDist < Infinity) {
      var influence = 1.0 - Math.sqrt(bestDist) / Math.sqrt(segs.length > 0 ? segs[0].widthSq : 1);
      if (influence < 0) influence = 0;
      p.vx = p.vx * 0.9 + bestDx * bestStr * influence * 0.6;
      p.vy = p.vy * 0.9 + bestDy * bestStr * influence * 0.6;
    } else {
      p.vx *= 0.95;
      p.vy *= 0.95;
    }

    // Random noise
    p.vx += (Math.random() - 0.5) * 0.2;
    p.vy += (Math.random() - 0.5) * 0.2;

    // Update position
    p.x += p.vx;
    p.y += p.vy;

    // Life cycle
    p.life -= 1;

    // Fade in during first 20 frames, fade out during last 20
    fadeIn  = p.life > p.maxLife - 20 ? (p.maxLife - p.life) / 20 : 1;
    fadeOut = p.life < 20 ? p.life / 20 : 1;
    alpha   = fadeIn * fadeOut;
    if (alpha < 0) alpha = 0;
    if (alpha > 1) alpha = 1;

    // Respawn if dead or off-screen
    if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
      var respawned = spawnParticle(w, h);
      p.x       = respawned.x;
      p.y       = respawned.y;
      p.vx      = 0;
      p.vy      = 0;
      p.life    = respawned.maxLife;
      p.maxLife = respawned.maxLife;
      continue;
    }

    // Draw particle as short trailing line with subtle glow
    if (alpha < 0.01) continue;

    var speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    var lw    = 0.5 + Math.min(speed * 0.4, 0.8);
    var tailX = p.x - p.vx * 3.5;
    var tailY = p.y - p.vy * 3.5;

    // Subtle glow for faster-moving particles
    if (speed > 0.8) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha * 0.12;
      ctx.lineWidth   = lw + 2;
      ctx.stroke();
    }

    // Main particle line
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(tailX, tailY);
    ctx.strokeStyle = color;
    ctx.globalAlpha = alpha * 0.5;
    ctx.lineWidth   = lw;
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
}
