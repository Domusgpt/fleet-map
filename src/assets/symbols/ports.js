/**
 * Fleet Map — Port & Harbor Facility Symbols
 * =============================================
 * Dock, mooring, fuel, ice house, fish market, boat ramp,
 * harbor master, and anchorage symbols.
 *
 * All draw functions render centered at origin.
 */

var TAU = Math.PI * 2;

var dock = {
  id: 'dock',
  name: 'Dock / Wharf',

  draw: function (ctx, size, color) {
    var s = size * 0.5;
    var c = color || 'rgba(0,104,71,0.85)';

    // T-shaped dock
    ctx.beginPath();
    // Vertical pier
    ctx.rect(-s * 0.08, -s * 0.15, s * 0.16, s * 0.55);
    ctx.fillStyle = c;
    ctx.fill();

    // Horizontal wharf
    ctx.beginPath();
    ctx.rect(-s * 0.4, -s * 0.15, s * 0.8, s * 0.12);
    ctx.fill();

    // Pilings (small circles)
    var pilings = [-s * 0.35, -s * 0.15, s * 0.15, s * 0.35];
    for (var i = 0; i < pilings.length; i++) {
      ctx.beginPath();
      ctx.arc(pilings[i], s * 0.4, s * 0.04, 0, TAU);
      ctx.fill();
    }
  },
};

var mooring = {
  id: 'mooring',
  name: 'Mooring Buoy',

  draw: function (ctx, size, color, t) {
    var s = size * 0.5;
    var c = color || 'rgba(0,104,71,0.85)';
    var bob = Math.sin((t || 0) * 1.5) * s * 0.03;

    ctx.save();
    ctx.translate(0, bob);

    // Circle with horizontal line
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.3, 0, TAU);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.06;
    ctx.stroke();

    // Mooring ring
    ctx.beginPath();
    ctx.arc(0, -s * 0.3, s * 0.08, 0, TAU);
    ctx.stroke();

    ctx.restore();
  },
};

var fuel = {
  id: 'fuel',
  name: 'Fuel Station',

  draw: function (ctx, size, color) {
    var s = size * 0.5;
    var c = color || 'rgba(0,104,71,0.85)';

    // Pump body
    ctx.beginPath();
    ctx.rect(-s * 0.25, -s * 0.3, s * 0.4, s * 0.55);
    ctx.fillStyle = c;
    ctx.fill();

    // Pump top
    ctx.beginPath();
    ctx.rect(-s * 0.15, -s * 0.5, s * 0.2, s * 0.2);
    ctx.fill();

    // Nozzle
    ctx.beginPath();
    ctx.moveTo(s * 0.15, -s * 0.35);
    ctx.lineTo(s * 0.35, -s * 0.35);
    ctx.lineTo(s * 0.35, -s * 0.1);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.04;
    ctx.stroke();

    // F label
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = Math.max(6, size * 0.22) + 'px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F', -s * 0.05, -s * 0.02);
  },
};

var iceHouse = {
  id: 'ice-house',
  name: 'Ice Supply',

  draw: function (ctx, size, color) {
    var s = size * 0.5;
    var c = color || 'rgba(0,104,71,0.85)';

    // Building shape
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, s * 0.3);
    ctx.lineTo(-s * 0.3, -s * 0.15);
    ctx.lineTo(0, -s * 0.4);
    ctx.lineTo(s * 0.3, -s * 0.15);
    ctx.lineTo(s * 0.3, s * 0.3);
    ctx.closePath();
    ctx.fillStyle = c;
    ctx.fill();

    // Snowflake / ice symbol (asterisk)
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = size * 0.03;
    for (var a = 0; a < 3; a++) {
      var angle = a * (Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * s * 0.1, Math.sin(angle) * s * 0.1 + s * 0.05);
      ctx.lineTo(Math.cos(angle + Math.PI) * s * 0.1, Math.sin(angle + Math.PI) * s * 0.1 + s * 0.05);
      ctx.stroke();
    }
  },
};

var fishMarket = {
  id: 'fish-market',
  name: 'Fish Market / Auction',

  draw: function (ctx, size, color) {
    var s = size * 0.5;
    var c = color || 'rgba(0,104,71,0.85)';

    // Building
    ctx.beginPath();
    ctx.rect(-s * 0.35, -s * 0.15, s * 0.7, s * 0.45);
    ctx.fillStyle = c;
    ctx.fill();

    // Roof
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, -s * 0.15);
    ctx.lineTo(0, -s * 0.45);
    ctx.lineTo(s * 0.4, -s * 0.15);
    ctx.closePath();
    ctx.fill();

    // Fish symbol (simple arc)
    ctx.beginPath();
    ctx.moveTo(s * 0.15, s * 0.08);
    ctx.quadraticCurveTo(0, -s * 0.05, -s * 0.12, s * 0.08);
    ctx.quadraticCurveTo(0, s * 0.2, s * 0.15, s * 0.08);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(-s * 0.12, s * 0.08);
    ctx.lineTo(-s * 0.2, 0);
    ctx.lineTo(-s * 0.2, s * 0.16);
    ctx.closePath();
    ctx.fill();
  },
};

var boatRamp = {
  id: 'boat-ramp',
  name: 'Launch Ramp',

  draw: function (ctx, size, color) {
    var s = size * 0.5;
    var c = color || 'rgba(0,104,71,0.85)';

    // Ramp shape (trapezoid going into water)
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.35);
    ctx.lineTo(s * 0.2, -s * 0.35);
    ctx.lineTo(s * 0.35, s * 0.35);
    ctx.lineTo(-s * 0.35, s * 0.35);
    ctx.closePath();
    ctx.fillStyle = c;
    ctx.fill();

    // Water line
    ctx.beginPath();
    ctx.moveTo(-s * 0.4, s * 0.15);
    ctx.quadraticCurveTo(-s * 0.2, s * 0.05, 0, s * 0.15);
    ctx.quadraticCurveTo(s * 0.2, s * 0.25, s * 0.4, s * 0.15);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = size * 0.03;
    ctx.stroke();
  },
};

var harborMaster = {
  id: 'harbor-master',
  name: 'Harbor Master Office',

  draw: function (ctx, size, color) {
    var s = size * 0.5;
    var c = color || 'rgba(0,104,71,0.85)';

    // Building
    ctx.beginPath();
    ctx.rect(-s * 0.3, -s * 0.1, s * 0.6, s * 0.4);
    ctx.fillStyle = c;
    ctx.fill();

    // Roof
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, -s * 0.1);
    ctx.lineTo(0, -s * 0.4);
    ctx.lineTo(s * 0.35, -s * 0.1);
    ctx.closePath();
    ctx.fill();

    // Flag on top
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.4);
    ctx.lineTo(0, -s * 0.7);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.025;
    ctx.stroke();

    // Flag pennant
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7);
    ctx.lineTo(s * 0.2, -s * 0.6);
    ctx.lineTo(0, -s * 0.5);
    ctx.fillStyle = c;
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.globalAlpha = 1;
  },
};

var anchorage = {
  id: 'anchorage',
  name: 'Anchorage Area',

  draw: function (ctx, size, color) {
    var s = size * 0.5;
    var c = color || 'rgba(0,104,71,0.85)';

    // Anchor symbol
    // Shank (vertical line)
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.6);
    ctx.lineTo(0, s * 0.25);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.05;
    ctx.stroke();

    // Crown (bottom arc + flukes)
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, s * 0.05);
    ctx.quadraticCurveTo(-s * 0.35, s * 0.4, 0, s * 0.25);
    ctx.quadraticCurveTo(s * 0.35, s * 0.4, s * 0.35, s * 0.05);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.04;
    ctx.stroke();

    // Stock (horizontal bar at top)
    ctx.beginPath();
    ctx.moveTo(-s * 0.2, -s * 0.5);
    ctx.lineTo(s * 0.2, -s * 0.5);
    ctx.lineWidth = size * 0.04;
    ctx.stroke();

    // Ring at top
    ctx.beginPath();
    ctx.arc(0, -s * 0.68, s * 0.08, 0, TAU);
    ctx.lineWidth = size * 0.03;
    ctx.stroke();
  },
};

// =====================================================================
// Export
// =====================================================================
export var PORT_SYMBOLS = {
  'dock':          dock,
  'mooring':       mooring,
  'fuel':          fuel,
  'ice-house':     iceHouse,
  'fish-market':   fishMarket,
  'boat-ramp':     boatRamp,
  'harbor-master': harborMaster,
  'anchorage':     anchorage,
};
