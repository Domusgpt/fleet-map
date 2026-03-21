/**
 * Fleet Map — Channel Marker Symbols
 * =====================================
 * IALA Maritime Buoyage System lateral, safe water, isolated danger,
 * and special purpose marks. Region B (Americas) conventions.
 *
 * All draw functions render centered at origin.
 */

var TAU = Math.PI * 2;

// =====================================================================
// LATERAL MARKS
// =====================================================================

var lateralPort = {
  id: 'lateral-port',
  name: 'Port Side (Red)',
  description: 'Red triangular mark — keep to port when entering harbor',

  draw: function (ctx, size, color, t) {
    var s = size * 0.5;
    var bob = Math.sin((t || 0) * 1.6) * s * 0.025;

    ctx.save();
    ctx.translate(0, bob);

    // Conical / triangular shape
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.6);
    ctx.lineTo(s * 0.3, s * 0.3);
    ctx.lineTo(-s * 0.3, s * 0.3);
    ctx.closePath();
    ctx.fillStyle = 'rgba(200,50,50,0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = size * 0.025;
    ctx.stroke();

    // Number area
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = Math.max(6, size * 0.2) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('2', 0, s * 0.05);

    ctx.restore();
  },
};

var lateralStarboard = {
  id: 'lateral-starboard',
  name: 'Starboard Side (Green)',
  description: 'Green square mark — keep to starboard when entering harbor',

  draw: function (ctx, size, color, t) {
    var s = size * 0.5;
    var bob = Math.sin((t || 0) * 1.6 + 1) * s * 0.025;

    ctx.save();
    ctx.translate(0, bob);

    // Square / can shape
    ctx.beginPath();
    ctx.rect(-s * 0.25, -s * 0.4, s * 0.5, s * 0.65);
    ctx.fillStyle = 'rgba(50,160,60,0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = size * 0.025;
    ctx.stroke();

    // Number
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = Math.max(6, size * 0.2) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('1', 0, -s * 0.05);

    ctx.restore();
  },
};

// =====================================================================
// SAFE WATER MARK
// =====================================================================

var safeWater = {
  id: 'safe-water',
  name: 'Safe Water Mark',
  description: 'Red and white vertical stripes — safe water on all sides',

  draw: function (ctx, size, color, t) {
    var s = size * 0.5;
    var bob = Math.sin((t || 0) * 1.4 + 0.5) * s * 0.02;

    ctx.save();
    ctx.translate(0, bob);

    // Spherical shape
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.3, 0, TAU);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();

    // Red vertical stripes
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.3, 0, TAU);
    ctx.clip();

    ctx.fillStyle = 'rgba(200,50,50,0.8)';
    ctx.fillRect(-s * 0.3, -s * 0.35, s * 0.12, s * 0.7);
    ctx.fillRect(-s * 0.06, -s * 0.35, s * 0.12, s * 0.7);
    ctx.fillRect(s * 0.18, -s * 0.35, s * 0.12, s * 0.7);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(0, 0, s * 0.3, 0, TAU);
    ctx.strokeStyle = 'rgba(200,50,50,0.5)';
    ctx.lineWidth = size * 0.02;
    ctx.stroke();

    // Topmark — single red sphere
    ctx.beginPath();
    ctx.arc(0, -s * 0.45, s * 0.06, 0, TAU);
    ctx.fillStyle = 'rgba(200,50,50,0.9)';
    ctx.fill();

    // Staff
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.39);
    ctx.lineTo(0, -s * 0.3);
    ctx.strokeStyle = 'rgba(100,100,100,0.6)';
    ctx.lineWidth = size * 0.02;
    ctx.stroke();

    ctx.restore();
  },
};

// =====================================================================
// ISOLATED DANGER
// =====================================================================

var isolatedDanger = {
  id: 'isolated-danger',
  name: 'Isolated Danger Mark',
  description: 'Black with red horizontal band — danger with navigable water around',

  draw: function (ctx, size, color, t) {
    var s = size * 0.5;

    // Pillar body
    ctx.beginPath();
    ctx.rect(-s * 0.15, -s * 0.35, s * 0.3, s * 0.65);
    ctx.fillStyle = 'rgba(30,30,30,0.9)';
    ctx.fill();

    // Red band
    ctx.fillStyle = 'rgba(200,50,50,0.9)';
    ctx.fillRect(-s * 0.16, -s * 0.1, s * 0.32, s * 0.2);

    // Topmark — two black spheres
    ctx.beginPath();
    ctx.arc(0, -s * 0.55, s * 0.06, 0, TAU);
    ctx.fillStyle = 'rgba(30,30,30,0.9)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -s * 0.72, s * 0.06, 0, TAU);
    ctx.fill();

    // Staff
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.49);
    ctx.lineTo(0, -s * 0.35);
    ctx.strokeStyle = 'rgba(30,30,30,0.9)';
    ctx.lineWidth = size * 0.025;
    ctx.stroke();
  },
};

// =====================================================================
// SPECIAL PURPOSE MARK
// =====================================================================

var special = {
  id: 'special',
  name: 'Special Purpose Mark',
  description: 'Yellow — marks special areas (military, cable, pipeline)',

  draw: function (ctx, size, color, t) {
    var s = size * 0.5;
    var bob = Math.sin((t || 0) * 1.5 + 3) * s * 0.02;

    ctx.save();
    ctx.translate(0, bob);

    // Cylindrical body
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.25, 0, TAU);
    ctx.fillStyle = 'rgba(220,200,50,0.85)';
    ctx.fill();

    // X topmark
    ctx.beginPath();
    ctx.moveTo(-s * 0.12, -s * 0.55);
    ctx.lineTo(s * 0.12, -s * 0.4);
    ctx.moveTo(s * 0.12, -s * 0.55);
    ctx.lineTo(-s * 0.12, -s * 0.4);
    ctx.strokeStyle = 'rgba(220,200,50,0.9)';
    ctx.lineWidth = size * 0.035;
    ctx.stroke();

    ctx.restore();
  },
};

// =====================================================================
// Export
// =====================================================================
export var CHANNEL_SYMBOLS = {
  'lateral-port':      lateralPort,
  'lateral-starboard': lateralStarboard,
  'safe-water':        safeWater,
  'isolated-danger':   isolatedDanger,
  'special':           special,
};
