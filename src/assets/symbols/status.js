/**
 * Fleet Map — Status & Info Overlay Symbols
 * ============================================
 * Vessel status badges, catch tags, ETA displays, speed indicators,
 * and future captain's log / permission markers.
 *
 * All draw functions render centered at origin.
 */

var TAU = Math.PI * 2;

// =====================================================================
// STATUS BADGE
// =====================================================================

var statusBadge = {
  id: 'status-badge',
  name: 'Status Pill Badge',
  description: 'Rounded pill showing vessel status text',

  /**
   * @param {object} [data] — { text: 'Fishing', color: 'rgba(...)' }
   */
  draw: function (ctx, size, color, t, data) {
    var s = size * 0.5;
    var text = (data && data.text) || '';
    var bgColor = (data && data.color) || color || 'rgba(201,168,76,0.7)';

    // Pill background
    var pillW = Math.max(s * 1.2, text.length * s * 0.22);
    var pillH = s * 0.45;
    var r = pillH * 0.5;

    ctx.beginPath();
    ctx.roundRect(-pillW * 0.5, -pillH * 0.5, pillW, pillH, r);
    ctx.fillStyle = bgColor;
    ctx.fill();

    // Text
    if (text) {
      ctx.font = Math.max(6, s * 0.3) + 'px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, 0);
    }
  },
};

// =====================================================================
// CATCH TAG
// =====================================================================

var catchTag = {
  id: 'catch-tag',
  name: 'Catch Species Tag',
  description: 'Small tag showing current catch species',

  draw: function (ctx, size, color, t, data) {
    var s = size * 0.5;
    var text = (data && data.text) || '';
    var c = color || 'rgba(201,168,76,0.6)';

    // Tag shape (rectangle with pointed left edge)
    var tagW = Math.max(s * 0.8, text.length * s * 0.18);
    ctx.beginPath();
    ctx.moveTo(-tagW * 0.5 - s * 0.1, 0);
    ctx.lineTo(-tagW * 0.5, -s * 0.2);
    ctx.lineTo(tagW * 0.5, -s * 0.2);
    ctx.lineTo(tagW * 0.5, s * 0.2);
    ctx.lineTo(-tagW * 0.5, s * 0.2);
    ctx.closePath();
    ctx.fillStyle = c;
    ctx.fill();

    // Hole
    ctx.beginPath();
    ctx.arc(-tagW * 0.5 + s * 0.08, 0, s * 0.03, 0, TAU);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();

    // Text
    if (text) {
      ctx.font = Math.max(5, s * 0.25) + 'px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, s * 0.05, 0);
    }
  },
};

// =====================================================================
// ETA DISPLAY
// =====================================================================

var etaDisplay = {
  id: 'eta-display',
  name: 'ETA to Port Readout',

  draw: function (ctx, size, color, t, data) {
    var s = size * 0.5;
    var eta = (data && data.eta) || '--:--';
    var port = (data && data.port) || '';
    var c = color || 'rgba(139,175,196,0.7)';

    // Background box
    var boxW = s * 1.6;
    var boxH = s * 0.7;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.roundRect(-boxW * 0.5, -boxH * 0.5, boxW, boxH, s * 0.06);
    ctx.fill();

    // Border
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.02;
    ctx.stroke();

    // Clock icon (small circle with hands)
    ctx.beginPath();
    ctx.arc(-boxW * 0.3, 0, s * 0.1, 0, TAU);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.02;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-boxW * 0.3, 0);
    ctx.lineTo(-boxW * 0.3, -s * 0.07);
    ctx.moveTo(-boxW * 0.3, 0);
    ctx.lineTo(-boxW * 0.3 + s * 0.05, s * 0.02);
    ctx.stroke();

    // ETA text
    ctx.font = 'bold ' + Math.max(6, s * 0.28) + 'px sans-serif';
    ctx.fillStyle = c;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(eta, boxW * 0.05, -s * 0.05);

    // Port name (smaller)
    if (port) {
      ctx.font = Math.max(5, s * 0.18) + 'px sans-serif';
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.6;
      ctx.fillText(port, boxW * 0.05, s * 0.15);
      ctx.globalAlpha = 1;
    }
  },
};

// =====================================================================
// SPEED INDICATOR
// =====================================================================

var speedIndicator = {
  id: 'speed-indicator',
  name: 'Speed Arc Gauge',

  draw: function (ctx, size, color, t, data) {
    var s = size * 0.5;
    var speed = (data && data.speed) || 0;
    var maxSpeed = (data && data.maxSpeed) || 15;
    var c = color || 'rgba(139,175,196,0.6)';

    // Background arc
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.35, Math.PI * 0.8, Math.PI * 2.2);
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = size * 0.06;
    ctx.stroke();

    // Speed arc (filled portion)
    var fraction = Math.min(speed / maxSpeed, 1);
    var arcEnd = Math.PI * 0.8 + fraction * Math.PI * 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.35, Math.PI * 0.8, arcEnd);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.06;
    ctx.stroke();

    // Speed text
    ctx.font = 'bold ' + Math.max(6, s * 0.3) + 'px sans-serif';
    ctx.fillStyle = c;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(Math.round(speed) + 'kt', 0, s * 0.05);
  },
};

// =====================================================================
// CAPTAIN'S LOG (future)
// =====================================================================

var captainsLog = {
  id: 'captains-log',
  name: "Captain's Log Icon",
  description: 'Message/log indicator for vessel communications',

  draw: function (ctx, size, color, t) {
    var s = size * 0.5;
    var c = color || 'rgba(201,168,76,0.7)';
    var pulse = Math.sin((t || 0) * 3) * 0.15 + 0.85;

    // Speech bubble
    ctx.beginPath();
    ctx.moveTo(-s * 0.3, -s * 0.35);
    ctx.lineTo(s * 0.3, -s * 0.35);
    ctx.quadraticCurveTo(s * 0.4, -s * 0.35, s * 0.4, -s * 0.2);
    ctx.lineTo(s * 0.4, s * 0.05);
    ctx.quadraticCurveTo(s * 0.4, s * 0.15, s * 0.3, s * 0.15);
    ctx.lineTo(-s * 0.05, s * 0.15);
    ctx.lineTo(-s * 0.15, s * 0.35);
    ctx.lineTo(-s * 0.1, s * 0.15);
    ctx.lineTo(-s * 0.3, s * 0.15);
    ctx.quadraticCurveTo(-s * 0.4, s * 0.15, -s * 0.4, s * 0.05);
    ctx.lineTo(-s * 0.4, -s * 0.2);
    ctx.quadraticCurveTo(-s * 0.4, -s * 0.35, -s * 0.3, -s * 0.35);
    ctx.closePath();
    ctx.fillStyle = c;
    ctx.globalAlpha = pulse;
    ctx.fill();
    ctx.globalAlpha = 1;

    // Text lines inside
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = size * 0.025;
    ctx.beginPath();
    ctx.moveTo(-s * 0.22, -s * 0.18);
    ctx.lineTo(s * 0.22, -s * 0.18);
    ctx.moveTo(-s * 0.22, -s * 0.04);
    ctx.lineTo(s * 0.12, -s * 0.04);
    ctx.stroke();
  },
};

// =====================================================================
// PERMISSION LOCK (future)
// =====================================================================

var permissionLock = {
  id: 'permission-lock',
  name: 'Permission / Private Lock',
  description: 'Lock icon indicating restricted access info',

  draw: function (ctx, size, color) {
    var s = size * 0.5;
    var c = color || 'rgba(139,175,196,0.5)';

    // Lock body
    ctx.beginPath();
    ctx.roundRect(-s * 0.2, -s * 0.05, s * 0.4, s * 0.35, s * 0.04);
    ctx.fillStyle = c;
    ctx.fill();

    // Shackle (arc)
    ctx.beginPath();
    ctx.arc(0, -s * 0.05, s * 0.15, Math.PI, 0);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.06;
    ctx.stroke();

    // Keyhole
    ctx.beginPath();
    ctx.arc(0, s * 0.1, s * 0.05, 0, TAU);
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fill();
    ctx.beginPath();
    ctx.rect(-s * 0.02, s * 0.12, s * 0.04, s * 0.1);
    ctx.fill();
  },
};

// =====================================================================
// Export
// =====================================================================
export var STATUS_SYMBOLS = {
  'status-badge':     statusBadge,
  'catch-tag':        catchTag,
  'eta-display':      etaDisplay,
  'speed-indicator':  speedIndicator,
  'captains-log':     captainsLog,
  'permission-lock':  permissionLock,
};
