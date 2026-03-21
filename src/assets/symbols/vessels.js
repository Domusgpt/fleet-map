/**
 * Fleet Map — Vessel Symbols
 * ============================
 * Ship silhouettes for each vessel type. Each symbol provides three
 * draw variants for theme-specific rendering:
 *
 *   drawTopDown(ctx, size, color, t)  — birds-eye hull outline (tactical, minimal)
 *   drawProfile(ctx, size, color, t)  — side-view silhouette (treasure map, classic)
 *   drawIcon(ctx, size, color, t)     — simplified geometric pictogram (tropical)
 *
 * All draw functions render centered at the origin (0,0). The caller is
 * responsible for ctx.translate() and ctx.rotate() to position and orient.
 * Size is the bounding dimension in pixels.
 */

var TAU = Math.PI * 2;
var HALF_PI = Math.PI / 2;

// =====================================================================
// TRAWLER / DRAGGER
// =====================================================================
var trawler = {
  id: 'trawler',
  name: 'Trawler',
  description: 'Side-profile trawler with outriggers',

  drawTopDown: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    // Hull — elongated oval with pointed bow
    ctx.moveTo(0, -s);                         // bow
    ctx.bezierCurveTo(s * 0.35, -s * 0.7, s * 0.4, -s * 0.2, s * 0.35, s * 0.4);
    ctx.lineTo(s * 0.3, s * 0.7);             // stern quarter
    ctx.quadraticCurveTo(0, s * 0.85, -s * 0.3, s * 0.7);
    ctx.lineTo(-s * 0.35, s * 0.4);
    ctx.bezierCurveTo(-s * 0.4, -s * 0.2, -s * 0.35, -s * 0.7, 0, -s);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Outrigger arms
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.1);
    ctx.lineTo(-s * 0.7, s * 0.3);
    ctx.moveTo(s * 0.1, -s * 0.1);
    ctx.lineTo(s * 0.7, s * 0.3);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.04;
    ctx.stroke();
  },

  drawProfile: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    // Hull
    ctx.moveTo(-s, s * 0.2);                   // stern waterline
    ctx.lineTo(-s * 0.8, s * 0.35);            // stern bottom
    ctx.quadraticCurveTo(0, s * 0.45, s * 0.7, s * 0.15);   // keel
    ctx.lineTo(s, -s * 0.05);                  // bow
    ctx.lineTo(s * 0.85, -s * 0.1);
    ctx.lineTo(s * 0.7, -s * 0.1);
    // Superstructure
    ctx.lineTo(s * 0.5, -s * 0.1);
    ctx.lineTo(s * 0.4, -s * 0.35);            // wheelhouse front
    ctx.lineTo(-s * 0.1, -s * 0.35);           // wheelhouse back
    ctx.lineTo(-s * 0.2, -s * 0.1);
    ctx.lineTo(-s * 0.8, -s * 0.1);
    ctx.lineTo(-s, s * 0.2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Outrigger mast
    ctx.beginPath();
    ctx.moveTo(s * 0.15, -s * 0.35);
    ctx.lineTo(s * 0.15, -s * 0.85);
    ctx.moveTo(s * 0.15, -s * 0.7);
    ctx.lineTo(-s * 0.5, -s * 0.15);
    ctx.moveTo(s * 0.15, -s * 0.7);
    ctx.lineTo(s * 0.65, -s * 0.15);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.035;
    ctx.stroke();
  },

  drawIcon: function (ctx, size, color) {
    var s = size * 0.5;
    // Simple boat shape with outrigger lines
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.8);
    ctx.lineTo(s * 0.35, s * 0.2);
    ctx.quadraticCurveTo(0, s * 0.5, -s * 0.35, s * 0.2);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Outrigger lines
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.3);
    ctx.lineTo(-s * 0.6, s * 0.15);
    ctx.moveTo(0, -s * 0.3);
    ctx.lineTo(s * 0.6, s * 0.15);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.05;
    ctx.stroke();
  },
};

// =====================================================================
// LONGLINER
// =====================================================================
var longliner = {
  id: 'longliner',
  name: 'Longliner',
  description: 'Sleek hull with longline gear',

  drawTopDown: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.25, -s * 0.8, s * 0.3, -s * 0.3, s * 0.25, s * 0.5);
    ctx.quadraticCurveTo(0, s * 0.7, -s * 0.25, s * 0.5);
    ctx.bezierCurveTo(-s * 0.3, -s * 0.3, -s * 0.25, -s * 0.8, 0, -s);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Longline trailing aft
    ctx.beginPath();
    ctx.moveTo(0, s * 0.5);
    ctx.setLineDash([2, 3]);
    ctx.lineTo(0, s * 1.2);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.03;
    ctx.stroke();
    ctx.setLineDash([]);
  },

  drawProfile: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(-s * 0.9, s * 0.15);
    ctx.lineTo(-s * 0.7, s * 0.3);
    ctx.quadraticCurveTo(0, s * 0.4, s * 0.8, s * 0.05);
    ctx.lineTo(s, -s * 0.1);
    ctx.lineTo(s * 0.75, -s * 0.1);
    ctx.lineTo(s * 0.5, -s * 0.3);
    ctx.lineTo(s * 0.15, -s * 0.3);
    ctx.lineTo(0, -s * 0.1);
    ctx.lineTo(-s * 0.7, -s * 0.1);
    ctx.lineTo(-s * 0.9, s * 0.15);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Mast with spreader
    ctx.beginPath();
    ctx.moveTo(s * 0.3, -s * 0.3);
    ctx.lineTo(s * 0.3, -s * 0.8);
    ctx.moveTo(s * 0.1, -s * 0.6);
    ctx.lineTo(s * 0.5, -s * 0.6);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.03;
    ctx.stroke();
  },

  drawIcon: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.85);
    ctx.lineTo(s * 0.25, s * 0.15);
    ctx.quadraticCurveTo(0, s * 0.4, -s * 0.25, s * 0.15);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Line trailing
    ctx.beginPath();
    ctx.setLineDash([1, 2]);
    ctx.moveTo(0, s * 0.3);
    ctx.lineTo(0, s * 0.9);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.04;
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

// =====================================================================
// SCALLOPER
// =====================================================================
var scalloper = {
  id: 'scalloper',
  name: 'Scalloper',
  description: 'Broad beam with dredge gear',

  drawTopDown: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    // Wide hull
    ctx.moveTo(0, -s * 0.8);
    ctx.bezierCurveTo(s * 0.45, -s * 0.5, s * 0.5, 0, s * 0.4, s * 0.5);
    ctx.quadraticCurveTo(0, s * 0.65, -s * 0.4, s * 0.5);
    ctx.bezierCurveTo(-s * 0.5, 0, -s * 0.45, -s * 0.5, 0, -s * 0.8);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Dredge booms
    ctx.beginPath();
    ctx.moveTo(-s * 0.15, s * 0.1);
    ctx.lineTo(-s * 0.7, s * 0.6);
    ctx.moveTo(s * 0.15, s * 0.1);
    ctx.lineTo(s * 0.7, s * 0.6);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.04;
    ctx.stroke();
  },

  drawProfile: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(-s * 0.85, s * 0.15);
    ctx.lineTo(-s * 0.7, s * 0.35);
    ctx.quadraticCurveTo(0, s * 0.45, s * 0.7, s * 0.1);
    ctx.lineTo(s * 0.85, -s * 0.05);
    ctx.lineTo(s * 0.6, -s * 0.05);
    ctx.lineTo(s * 0.35, -s * 0.4);
    ctx.lineTo(-s * 0.15, -s * 0.4);
    ctx.lineTo(-s * 0.35, -s * 0.05);
    ctx.lineTo(-s * 0.85, -s * 0.05);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // A-frame stern
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, -s * 0.4);
    ctx.lineTo(-s * 0.5, -s * 0.75);
    ctx.lineTo(-s * 0.85, -s * 0.05);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.035;
    ctx.stroke();
  },

  drawIcon: function (ctx, size, color) {
    var s = size * 0.5;
    // Wide boat shape
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7);
    ctx.lineTo(s * 0.45, s * 0.15);
    ctx.quadraticCurveTo(0, s * 0.45, -s * 0.45, s * 0.15);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Scallop shell indicator
    ctx.beginPath();
    ctx.arc(0, s * 0.55, s * 0.15, 0, Math.PI, true);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.04;
    ctx.stroke();
  },
};

// =====================================================================
// GILLNETTER
// =====================================================================
var gillnetter = {
  id: 'gillnetter',
  name: 'Gillnetter',
  description: 'Mid-size with net reel',

  drawTopDown: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.9);
    ctx.bezierCurveTo(s * 0.3, -s * 0.6, s * 0.35, 0, s * 0.3, s * 0.5);
    ctx.quadraticCurveTo(0, s * 0.65, -s * 0.3, s * 0.5);
    ctx.bezierCurveTo(-s * 0.35, 0, -s * 0.3, -s * 0.6, 0, -s * 0.9);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Net reel circle at stern
    ctx.beginPath();
    ctx.arc(0, s * 0.3, s * 0.12, 0, TAU);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.03;
    ctx.stroke();
  },

  drawProfile: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(-s * 0.8, s * 0.15);
    ctx.lineTo(-s * 0.65, s * 0.3);
    ctx.quadraticCurveTo(0, s * 0.38, s * 0.75, s * 0.08);
    ctx.lineTo(s * 0.9, -s * 0.05);
    ctx.lineTo(s * 0.6, -s * 0.05);
    ctx.lineTo(s * 0.4, -s * 0.25);
    ctx.lineTo(s * 0.05, -s * 0.25);
    ctx.lineTo(-s * 0.1, -s * 0.05);
    ctx.lineTo(-s * 0.7, -s * 0.05);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Net reel on stern
    ctx.beginPath();
    ctx.arc(-s * 0.55, -s * 0.2, s * 0.12, 0, TAU);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.03;
    ctx.stroke();
  },

  drawIcon: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.85);
    ctx.lineTo(s * 0.3, s * 0.15);
    ctx.quadraticCurveTo(0, s * 0.4, -s * 0.3, s * 0.15);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  },
};

// =====================================================================
// LOBSTER / POT BOAT
// =====================================================================
var lobster = {
  id: 'lobster',
  name: 'Lobster Boat',
  description: 'Small pot boat',

  drawTopDown: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.85);
    ctx.bezierCurveTo(s * 0.25, -s * 0.6, s * 0.28, 0, s * 0.22, s * 0.55);
    ctx.quadraticCurveTo(0, s * 0.7, -s * 0.22, s * 0.55);
    ctx.bezierCurveTo(-s * 0.28, 0, -s * 0.25, -s * 0.6, 0, -s * 0.85);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  },

  drawProfile: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, s * 0.1);
    ctx.lineTo(-s * 0.55, s * 0.25);
    ctx.quadraticCurveTo(0, s * 0.32, s * 0.6, s * 0.05);
    ctx.lineTo(s * 0.75, -s * 0.08);
    ctx.lineTo(s * 0.5, -s * 0.08);
    ctx.lineTo(s * 0.3, -s * 0.28);
    ctx.lineTo(s * 0.05, -s * 0.28);
    ctx.lineTo(-s * 0.1, -s * 0.08);
    ctx.lineTo(-s * 0.6, -s * 0.08);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  },

  drawIcon: function (ctx, size, color) {
    var s = size * 0.4;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.3, s * 0.3);
    ctx.quadraticCurveTo(0, s * 0.6, -s * 0.3, s * 0.3);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  },
};

// =====================================================================
// CARGO
// =====================================================================
var cargo = {
  id: 'cargo',
  name: 'Cargo Vessel',
  description: 'Large freighter silhouette',

  drawTopDown: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.3, -s * 0.8, s * 0.35, -s * 0.3, s * 0.35, s * 0.4);
    ctx.lineTo(s * 0.3, s * 0.7);
    ctx.lineTo(-s * 0.3, s * 0.7);
    ctx.lineTo(-s * 0.35, s * 0.4);
    ctx.bezierCurveTo(-s * 0.35, -s * 0.3, -s * 0.3, -s * 0.8, 0, -s);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Cargo holds (rectangles)
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(-s * 0.18, -s * 0.3, s * 0.36, s * 0.2);
    ctx.fillRect(-s * 0.18, s * 0.05, s * 0.36, s * 0.2);
    ctx.globalAlpha = 1;
  },

  drawProfile: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(-s, s * 0.1);
    ctx.lineTo(-s * 0.85, s * 0.3);
    ctx.lineTo(s * 0.8, s * 0.3);
    ctx.lineTo(s, 0);
    ctx.lineTo(s * 0.85, -s * 0.05);
    // Superstructure (tall block at stern)
    ctx.lineTo(s * 0.6, -s * 0.05);
    ctx.lineTo(s * 0.55, -s * 0.5);
    ctx.lineTo(s * 0.3, -s * 0.5);
    ctx.lineTo(s * 0.25, -s * 0.05);
    // Holds / deck line
    ctx.lineTo(-s * 0.75, -s * 0.05);
    ctx.lineTo(-s, s * 0.1);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Funnel
    ctx.fillRect(s * 0.35, -s * 0.65, s * 0.12, s * 0.15);
  },

  drawIcon: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7);
    ctx.lineTo(s * 0.4, s * 0.1);
    ctx.lineTo(s * 0.35, s * 0.4);
    ctx.lineTo(-s * 0.35, s * 0.4);
    ctx.lineTo(-s * 0.4, s * 0.1);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  },
};

// =====================================================================
// SAILBOAT
// =====================================================================
var sailboat = {
  id: 'sailboat',
  name: 'Sailboat',
  description: 'Sailing vessel',

  drawTopDown: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.bezierCurveTo(s * 0.2, -s * 0.7, s * 0.22, 0, s * 0.18, s * 0.6);
    ctx.quadraticCurveTo(0, s * 0.75, -s * 0.18, s * 0.6);
    ctx.bezierCurveTo(-s * 0.22, 0, -s * 0.2, -s * 0.7, 0, -s);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  },

  drawProfile: function (ctx, size, color) {
    var s = size * 0.5;
    // Hull
    ctx.beginPath();
    ctx.moveTo(-s * 0.6, s * 0.15);
    ctx.lineTo(-s * 0.4, s * 0.3);
    ctx.quadraticCurveTo(0, s * 0.35, s * 0.55, s * 0.08);
    ctx.lineTo(s * 0.7, -s * 0.05);
    ctx.lineTo(-s * 0.5, -s * 0.05);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Mast
    ctx.beginPath();
    ctx.moveTo(s * 0.1, -s * 0.05);
    ctx.lineTo(s * 0.1, -s * 0.95);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.025;
    ctx.stroke();

    // Sail
    ctx.beginPath();
    ctx.moveTo(s * 0.1, -s * 0.9);
    ctx.quadraticCurveTo(s * 0.55, -s * 0.45, s * 0.1, -s * 0.05);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.fill();
    ctx.globalAlpha = 1;
  },

  drawIcon: function (ctx, size, color) {
    var s = size * 0.5;
    // Sail triangle
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.9);
    ctx.lineTo(s * 0.4, s * 0.1);
    ctx.lineTo(-s * 0.05, s * 0.1);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Hull arc
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, s * 0.2);
    ctx.quadraticCurveTo(0, s * 0.5, s * 0.5, s * 0.2);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.06;
    ctx.stroke();
  },
};

// =====================================================================
// GENERIC (current triangle fallback)
// =====================================================================
var generic = {
  id: 'generic',
  name: 'Generic',
  description: 'Simple triangle (default fallback)',

  drawTopDown: function (ctx, size, color) {
    var s = size * 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(-s * 0.5, s * 0.6);
    ctx.lineTo(s * 0.5, s * 0.6);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  },

  drawProfile: function (ctx, size, color) {
    // Same as topDown for generic
    generic.drawTopDown(ctx, size, color);
  },

  drawIcon: function (ctx, size, color) {
    generic.drawTopDown(ctx, size, color);
  },

  // Legacy draw function for backward compatibility
  draw: function (ctx, size, color) {
    generic.drawTopDown(ctx, size, color);
  },
};

// =====================================================================
// Export all vessel symbols
// =====================================================================
export var VESSEL_SYMBOLS = {
  trawler:    trawler,
  longliner:  longliner,
  scalloper:  scalloper,
  gillnetter: gillnetter,
  lobster:    lobster,
  cargo:      cargo,
  sailboat:   sailboat,
  generic:    generic,
};
