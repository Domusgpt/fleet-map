/**
 * Fleet Map — Weather Symbols
 * ==============================
 * Wind barbs, wave indicators, temperature badges, storm warnings,
 * small craft advisories, fog, rain, and current arrows.
 * Designed to display data from NOAA marine weather APIs.
 *
 * All draw functions render centered at origin.
 */

var TAU = Math.PI * 2;

// =====================================================================
// WIND BARB
// =====================================================================

var windBarb = {
  id: 'wind-barb',
  name: 'Wind Barb',
  description: 'Standard meteorological wind barb — shows direction and speed',

  /**
   * Draw a wind barb. Caller should rotate ctx to wind direction.
   * Speed encoded by barbs: short = 5kt, long = 10kt, pennant = 50kt.
   * Pass speed via color string hack or as separate data.
   *
   * @param {number} size — symbol size
   * @param {string} color — fill/stroke color
   * @param {number} t — animation time
   */
  draw: function (ctx, size, color, t) {
    var s = size * 0.5;

    // Staff (vertical line pointing into wind)
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(0, s * 0.5);
    ctx.strokeStyle = color || 'rgba(139,175,196,0.8)';
    ctx.lineWidth = size * 0.05;
    ctx.stroke();

    // Barbs at top (default: two long barbs = 20kt display)
    ctx.beginPath();
    // Long barb 1
    ctx.moveTo(0, -s * 0.85);
    ctx.lineTo(s * 0.4, -s);
    // Long barb 2
    ctx.moveTo(0, -s * 0.65);
    ctx.lineTo(s * 0.35, -s * 0.8);
    ctx.lineWidth = size * 0.04;
    ctx.stroke();

    // Circle at base (station)
    ctx.beginPath();
    ctx.arc(0, s * 0.5, s * 0.08, 0, TAU);
    ctx.fillStyle = color || 'rgba(139,175,196,0.8)';
    ctx.fill();
  },
};

// =====================================================================
// WAVE HEIGHT
// =====================================================================

var waveHeight = {
  id: 'wave-height',
  name: 'Wave Height Indicator',

  draw: function (ctx, size, color, t) {
    var s = size * 0.5;
    var animT = t || 0;

    // Animated wave shape
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, 0);
    var wx;
    for (wx = -s * 0.6; wx <= s * 0.6; wx += s * 0.05) {
      var wy = Math.sin((wx / s) * 3 + animT * 2) * s * 0.2;
      ctx.lineTo(wx, wy);
    }
    ctx.strokeStyle = color || 'rgba(139,175,196,0.7)';
    ctx.lineWidth = size * 0.05;
    ctx.stroke();

    // Up arrow indicating height
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.lineTo(0, -s * 0.35);
    ctx.lineTo(-s * 0.12, -s * 0.2);
    ctx.moveTo(0, -s * 0.35);
    ctx.lineTo(s * 0.12, -s * 0.2);
    ctx.strokeStyle = color || 'rgba(139,175,196,0.6)';
    ctx.lineWidth = size * 0.035;
    ctx.stroke();
  },
};

// =====================================================================
// TEMPERATURE
// =====================================================================

var temperature = {
  id: 'temperature',
  name: 'Temperature Badge',

  draw: function (ctx, size, color) {
    var s = size * 0.5;

    // Thermometer body
    ctx.beginPath();
    ctx.roundRect(-s * 0.1, -s * 0.6, s * 0.2, s * 0.8, s * 0.1);
    ctx.strokeStyle = color || 'rgba(139,175,196,0.8)';
    ctx.lineWidth = size * 0.04;
    ctx.stroke();

    // Bulb at bottom
    ctx.beginPath();
    ctx.arc(0, s * 0.3, s * 0.14, 0, TAU);
    ctx.fillStyle = 'rgba(200,80,60,0.7)';
    ctx.fill();

    // Mercury level
    ctx.beginPath();
    ctx.rect(-s * 0.04, -s * 0.2, s * 0.08, s * 0.45);
    ctx.fillStyle = 'rgba(200,80,60,0.6)';
    ctx.fill();
  },
};

// =====================================================================
// STORM WARNING
// =====================================================================

var stormWarning = {
  id: 'storm-warning',
  name: 'Storm Warning Pennant',
  description: 'Red pennant with black square — gale/storm warning',

  draw: function (ctx, size, color, t) {
    var s = size * 0.5;
    var flutter = Math.sin((t || 0) * 4) * s * 0.03;

    // Flag pole
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, s * 0.5);
    ctx.lineTo(-s * 0.3, -s * 0.7);
    ctx.strokeStyle = color || 'rgba(220,60,60,0.9)';
    ctx.lineWidth = size * 0.04;
    ctx.stroke();

    // Red pennant (triangle)
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.65);
    ctx.lineTo(s * 0.35 + flutter, -s * 0.45);
    ctx.lineTo(-s * 0.3, -s * 0.25);
    ctx.closePath();
    ctx.fillStyle = 'rgba(220,60,60,0.85)';
    ctx.fill();

    // Black square center (storm signal)
    ctx.fillStyle = 'rgba(30,30,30,0.8)';
    ctx.fillRect(-s * 0.05, -s * 0.52, s * 0.18, s * 0.18);
  },
};

// =====================================================================
// SMALL CRAFT ADVISORY
// =====================================================================

var smallCraft = {
  id: 'small-craft',
  name: 'Small Craft Advisory',

  draw: function (ctx, size, color, t) {
    var s = size * 0.5;
    var flutter = Math.sin((t || 0) * 3) * s * 0.02;

    // Pole
    ctx.beginPath();
    ctx.moveTo(0, s * 0.4);
    ctx.lineTo(0, -s * 0.6);
    ctx.strokeStyle = color || 'rgba(220,160,50,0.9)';
    ctx.lineWidth = size * 0.04;
    ctx.stroke();

    // Triangular pennant (red)
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.55);
    ctx.lineTo(s * 0.35 + flutter, -s * 0.35);
    ctx.lineTo(0, -s * 0.15);
    ctx.closePath();
    ctx.fillStyle = 'rgba(220,60,60,0.8)';
    ctx.fill();
  },
};

// =====================================================================
// FOG
// =====================================================================

var fog = {
  id: 'fog',
  name: 'Fog Symbol',

  draw: function (ctx, size, color, t) {
    var s = size * 0.5;
    var c = color || 'rgba(180,180,180,0.6)';
    var animT = t || 0;
    var drift = Math.sin(animT * 0.8) * s * 0.05;

    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.04;

    // Three horizontal wavy lines
    for (var row = -1; row <= 1; row++) {
      var y = row * s * 0.25;
      ctx.beginPath();
      ctx.moveTo(-s * 0.5 + drift, y);
      ctx.quadraticCurveTo(-s * 0.15 + drift, y - s * 0.08, s * 0.1 + drift, y);
      ctx.quadraticCurveTo(s * 0.3 + drift, y + s * 0.08, s * 0.5 + drift, y);
      ctx.stroke();
    }
  },
};

// =====================================================================
// RAIN
// =====================================================================

var rain = {
  id: 'rain',
  name: 'Rain Indicator',

  draw: function (ctx, size, color, t) {
    var s = size * 0.5;
    var c = color || 'rgba(100,150,200,0.7)';
    var animT = t || 0;

    // Cloud
    ctx.beginPath();
    ctx.arc(-s * 0.1, -s * 0.25, s * 0.2, Math.PI, 0);
    ctx.arc(s * 0.15, -s * 0.2, s * 0.17, Math.PI * 1.3, Math.PI * 0.1);
    ctx.fillStyle = c;
    ctx.fill();

    // Rain drops (animated)
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.03;
    var drops = [[-s * 0.2, 0], [0, s * 0.05], [s * 0.15, -s * 0.02]];
    for (var d = 0; d < drops.length; d++) {
      var dy = ((animT * 30 + d * 10) % (s * 0.4));
      ctx.beginPath();
      ctx.moveTo(drops[d][0], drops[d][1] + dy);
      ctx.lineTo(drops[d][0] - s * 0.03, drops[d][1] + dy + s * 0.1);
      ctx.stroke();
    }
  },
};

// =====================================================================
// CURRENT ARROW
// =====================================================================

var currentArrow = {
  id: 'current-arrow',
  name: 'Current Direction Arrow',
  description: 'Arrow showing current direction and speed',

  draw: function (ctx, size, color) {
    var s = size * 0.5;
    var c = color || 'rgba(139,175,196,0.6)';

    // Arrow shaft
    ctx.beginPath();
    ctx.moveTo(0, s * 0.5);
    ctx.lineTo(0, -s * 0.3);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.06;
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.6);
    ctx.lineTo(-s * 0.15, -s * 0.25);
    ctx.lineTo(s * 0.15, -s * 0.25);
    ctx.closePath();
    ctx.fillStyle = c;
    ctx.fill();
  },
};

// =====================================================================
// Export
// =====================================================================
export var WEATHER_SYMBOLS = {
  'wind-barb':      windBarb,
  'wave-height':    waveHeight,
  'temperature':    temperature,
  'storm-warning':  stormWarning,
  'small-craft':    smallCraft,
  'fog':            fog,
  'rain':           rain,
  'current-arrow':  currentArrow,
};
