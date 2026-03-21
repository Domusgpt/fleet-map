/**
 * Fleet Map — Navigation Aid Symbols
 * =====================================
 * Buoys, beacons, lighthouses, and daymarks for nautical chart rendering.
 * Follows IALA Maritime Buoyage System Region B (Americas).
 *
 * All draw functions render centered at origin, sized by `size` parameter.
 */

var TAU = Math.PI * 2;

// =====================================================================
// BUOYS
// =====================================================================

var buoyRed = {
  id: 'buoy-red',
  name: 'Red Nun Buoy',
  description: 'IALA-B red nun (right returning, even numbers)',

  draw: function (ctx, size, color, t) {
    var s = size * 0.5;
    var bob = Math.sin((t || 0) * 2) * s * 0.03;

    ctx.save();
    ctx.translate(0, bob);

    // Nun (cone) shape
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7);
    ctx.lineTo(s * 0.3, s * 0.1);
    ctx.quadraticCurveTo(s * 0.3, s * 0.35, 0, s * 0.4);
    ctx.quadraticCurveTo(-s * 0.3, s * 0.35, -s * 0.3, s * 0.1);
    ctx.closePath();
    ctx.fillStyle = 'rgba(200,50,50,0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = size * 0.03;
    ctx.stroke();

    // Water line
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, s * 0.25);
    ctx.quadraticCurveTo(0, s * 0.35 + bob, s * 0.4, s * 0.25);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = size * 0.02;
    ctx.stroke();

    ctx.restore();
  },
};

var buoyGreen = {
  id: 'buoy-green',
  name: 'Green Can Buoy',
  description: 'IALA-B green can (left returning, odd numbers)',

  draw: function (ctx, size, color, t) {
    var s = size * 0.5;
    var bob = Math.sin((t || 0) * 2 + 1) * s * 0.03;

    ctx.save();
    ctx.translate(0, bob);

    // Can (flat-top) shape
    ctx.beginPath();
    ctx.moveTo(-s * 0.25, -s * 0.5);
    ctx.lineTo(s * 0.25, -s * 0.5);
    ctx.lineTo(s * 0.3, s * 0.15);
    ctx.quadraticCurveTo(s * 0.3, s * 0.35, 0, s * 0.4);
    ctx.quadraticCurveTo(-s * 0.3, s * 0.35, -s * 0.3, s * 0.15);
    ctx.closePath();
    ctx.fillStyle = 'rgba(50,160,60,0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = size * 0.03;
    ctx.stroke();

    ctx.restore();
  },
};

var buoyYellow = {
  id: 'buoy-yellow',
  name: 'Yellow Special Purpose Buoy',
  description: 'Special marks — research, anchorage, military',

  draw: function (ctx, size, color, t) {
    var s = size * 0.5;
    var bob = Math.sin((t || 0) * 1.8 + 2) * s * 0.03;

    ctx.save();
    ctx.translate(0, bob);

    // X-shaped topmark on cylinder
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.25, 0, TAU);
    ctx.fillStyle = 'rgba(220,200,50,0.9)';
    ctx.fill();

    // X topmark
    ctx.beginPath();
    ctx.moveTo(-s * 0.15, -s * 0.6);
    ctx.lineTo(s * 0.15, -s * 0.4);
    ctx.moveTo(s * 0.15, -s * 0.6);
    ctx.lineTo(-s * 0.15, -s * 0.4);
    ctx.strokeStyle = 'rgba(220,200,50,0.9)';
    ctx.lineWidth = size * 0.04;
    ctx.stroke();

    // Staff
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.65);
    ctx.lineTo(0, -s * 0.3);
    ctx.stroke();

    ctx.restore();
  },
};

// Cardinal buoys — indicate safe water direction
function drawCardinalBuoy(ctx, size, color, t, topmarkFn, bodyColors) {
  var s = size * 0.5;
  var bob = Math.sin((t || 0) * 2.2) * s * 0.02;

  ctx.save();
  ctx.translate(0, bob);

  // Pillar body
  ctx.beginPath();
  ctx.moveTo(-s * 0.15, -s * 0.3);
  ctx.lineTo(s * 0.15, -s * 0.3);
  ctx.lineTo(s * 0.2, s * 0.3);
  ctx.lineTo(-s * 0.2, s * 0.3);
  ctx.closePath();

  // Black/yellow banding
  ctx.fillStyle = bodyColors[0];
  ctx.fill();
  ctx.fillStyle = bodyColors[1];
  ctx.fillRect(-s * 0.15, -s * 0.1, s * 0.3, s * 0.2);

  // Staff + topmark
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.3);
  ctx.lineTo(0, -s * 0.65);
  ctx.strokeStyle = 'rgba(30,30,30,0.9)';
  ctx.lineWidth = size * 0.03;
  ctx.stroke();

  topmarkFn(ctx, s);

  ctx.restore();
}

var buoyCardinalN = {
  id: 'buoy-cardinal-n',
  name: 'Cardinal North',
  draw: function (ctx, size, color, t) {
    drawCardinalBuoy(ctx, size, color, t, function (ctx2, s) {
      // Two upward triangles
      ctx2.beginPath();
      ctx2.moveTo(0, -s * 0.85);
      ctx2.lineTo(-s * 0.1, -s * 0.7);
      ctx2.lineTo(s * 0.1, -s * 0.7);
      ctx2.closePath();
      ctx2.moveTo(0, -s * 0.72);
      ctx2.lineTo(-s * 0.1, -s * 0.57);
      ctx2.lineTo(s * 0.1, -s * 0.57);
      ctx2.closePath();
      ctx2.fillStyle = 'rgba(30,30,30,0.9)';
      ctx2.fill();
    }, ['rgba(30,30,30,0.9)', 'rgba(220,200,50,0.9)']);
  },
};

var buoyCardinalS = {
  id: 'buoy-cardinal-s',
  name: 'Cardinal South',
  draw: function (ctx, size, color, t) {
    drawCardinalBuoy(ctx, size, color, t, function (ctx2, s) {
      // Two downward triangles
      ctx2.beginPath();
      ctx2.moveTo(-s * 0.1, -s * 0.85);
      ctx2.lineTo(s * 0.1, -s * 0.85);
      ctx2.lineTo(0, -s * 0.7);
      ctx2.closePath();
      ctx2.moveTo(-s * 0.1, -s * 0.72);
      ctx2.lineTo(s * 0.1, -s * 0.72);
      ctx2.lineTo(0, -s * 0.57);
      ctx2.closePath();
      ctx2.fillStyle = 'rgba(30,30,30,0.9)';
      ctx2.fill();
    }, ['rgba(220,200,50,0.9)', 'rgba(30,30,30,0.9)']);
  },
};

var buoyCardinalE = {
  id: 'buoy-cardinal-e',
  name: 'Cardinal East',
  draw: function (ctx, size, color, t) {
    drawCardinalBuoy(ctx, size, color, t, function (ctx2, s) {
      // Up triangle + down triangle (diamond)
      ctx2.beginPath();
      ctx2.moveTo(0, -s * 0.85);
      ctx2.lineTo(-s * 0.1, -s * 0.73);
      ctx2.lineTo(s * 0.1, -s * 0.73);
      ctx2.closePath();
      ctx2.fillStyle = 'rgba(30,30,30,0.9)';
      ctx2.fill();
      ctx2.beginPath();
      ctx2.moveTo(-s * 0.1, -s * 0.62);
      ctx2.lineTo(s * 0.1, -s * 0.62);
      ctx2.lineTo(0, -s * 0.5);
      ctx2.closePath();
      ctx2.fill();
    }, ['rgba(30,30,30,0.9)', 'rgba(220,200,50,0.8)']);
  },
};

var buoyCardinalW = {
  id: 'buoy-cardinal-w',
  name: 'Cardinal West',
  draw: function (ctx, size, color, t) {
    drawCardinalBuoy(ctx, size, color, t, function (ctx2, s) {
      // Down triangle + up triangle (hourglass)
      ctx2.beginPath();
      ctx2.moveTo(-s * 0.1, -s * 0.85);
      ctx2.lineTo(s * 0.1, -s * 0.85);
      ctx2.lineTo(0, -s * 0.73);
      ctx2.closePath();
      ctx2.fillStyle = 'rgba(30,30,30,0.9)';
      ctx2.fill();
      ctx2.beginPath();
      ctx2.moveTo(0, -s * 0.62);
      ctx2.lineTo(-s * 0.1, -s * 0.5);
      ctx2.lineTo(s * 0.1, -s * 0.5);
      ctx2.closePath();
      ctx2.fill();
    }, ['rgba(220,200,50,0.9)', 'rgba(30,30,30,0.8)']);
  },
};

// =====================================================================
// LIGHTHOUSE
// =====================================================================
var lighthouse = {
  id: 'lighthouse',
  name: 'Lighthouse',
  description: 'Lighthouse with animated light sweep',

  draw: function (ctx, size, color, t) {
    var s = size * 0.5;
    var phase = ((t || 0) * 3) % TAU;

    // Light beam
    ctx.save();
    ctx.globalAlpha = 0.08 + Math.abs(Math.sin(phase)) * 0.12;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.6);
    var beamAngle = phase * 0.5;
    ctx.lineTo(Math.cos(beamAngle - 0.3) * s * 2, Math.sin(beamAngle - 0.3) * s * 2 - s * 0.6);
    ctx.lineTo(Math.cos(beamAngle + 0.3) * s * 2, Math.sin(beamAngle + 0.3) * s * 2 - s * 0.6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,245,200,1)';
    ctx.fill();
    ctx.restore();

    // Tower body (tapered)
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, s * 0.5);
    ctx.lineTo(-s * 0.12, -s * 0.5);
    ctx.lineTo(s * 0.12, -s * 0.5);
    ctx.lineTo(s * 0.2, s * 0.5);
    ctx.closePath();
    ctx.fillStyle = color || 'rgba(240,235,224,0.9)';
    ctx.fill();

    // Lantern room
    ctx.beginPath();
    ctx.arc(0, -s * 0.55, s * 0.1, 0, TAU);
    ctx.fillStyle = 'rgba(255,245,200,0.9)';
    ctx.fill();

    // Stripes
    ctx.strokeStyle = 'rgba(200,50,50,0.5)';
    ctx.lineWidth = s * 0.15;
    ctx.beginPath();
    ctx.moveTo(-s * 0.16, -s * 0.15);
    ctx.lineTo(s * 0.16, -s * 0.15);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-s * 0.19, s * 0.2);
    ctx.lineTo(s * 0.19, s * 0.2);
    ctx.stroke();
  },
};

// =====================================================================
// BEACON
// =====================================================================
var beacon = {
  id: 'beacon',
  name: 'Fixed Beacon',
  description: 'Fixed navigation structure',

  draw: function (ctx, size, color) {
    var s = size * 0.5;

    // Triangular lattice structure
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7);
    ctx.lineTo(-s * 0.3, s * 0.5);
    ctx.lineTo(s * 0.3, s * 0.5);
    ctx.closePath();
    ctx.strokeStyle = color || 'rgba(240,235,224,0.7)';
    ctx.lineWidth = size * 0.04;
    ctx.stroke();

    // Light at top
    ctx.beginPath();
    ctx.arc(0, -s * 0.7, s * 0.08, 0, TAU);
    ctx.fillStyle = 'rgba(255,245,200,0.8)';
    ctx.fill();
  },
};

// =====================================================================
// DAYMARKS
// =====================================================================
var daymarkTriangle = {
  id: 'daymark-triangle',
  name: 'Triangular Daymark',
  draw: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.6);
    ctx.lineTo(-s * 0.4, s * 0.3);
    ctx.lineTo(s * 0.4, s * 0.3);
    ctx.closePath();
    ctx.fillStyle = color || 'rgba(50,160,60,0.9)';
    ctx.fill();
  },
};

var daymarkSquare = {
  id: 'daymark-square',
  name: 'Square Daymark',
  draw: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.fillStyle = color || 'rgba(200,50,50,0.9)';
    ctx.fillRect(-s * 0.35, -s * 0.35, s * 0.7, s * 0.7);
  },
};

// =====================================================================
// Export
// =====================================================================
export var NAV_AID_SYMBOLS = {
  'buoy-red':       buoyRed,
  'buoy-green':     buoyGreen,
  'buoy-yellow':    buoyYellow,
  'buoy-cardinal-n': buoyCardinalN,
  'buoy-cardinal-s': buoyCardinalS,
  'buoy-cardinal-e': buoyCardinalE,
  'buoy-cardinal-w': buoyCardinalW,
  'lighthouse':     lighthouse,
  'beacon':         beacon,
  'daymark-triangle': daymarkTriangle,
  'daymark-square': daymarkSquare,
};
