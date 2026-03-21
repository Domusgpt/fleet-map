/**
 * Fleet Map — Cartography Symbols
 * ==================================
 * Depth soundings, shipping lanes, boundaries, hazard areas,
 * fishing grounds, restricted zones, and anchorage areas.
 *
 * These are chart annotation symbols drawn on the depth or coast layers.
 * All draw functions render centered at origin.
 */

var TAU = Math.PI * 2;

// =====================================================================
// DEPTH SOUNDING
// =====================================================================

var depthSounding = {
  id: 'depth-sounding',
  name: 'Spot Depth Number',
  description: 'Individual depth value plotted on the chart',

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} size — font size equivalent
   * @param {string} color
   * @param {number} t — unused
   * @param {object} [data] — { depth: number, unit: 'fm'|'m'|'ft' }
   */
  draw: function (ctx, size, color, t, data) {
    var depth = (data && data.depth) || '';
    var c = color || 'rgba(27,58,92,0.4)';

    ctx.font = Math.max(6, size * 0.7) + 'px sans-serif';
    ctx.fillStyle = c;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(depth), 0, 0);
  },
};

// =====================================================================
// SHIPPING LANE
// =====================================================================

var shippingLane = {
  id: 'shipping-lane',
  name: 'Traffic Separation Line',
  description: 'Dashed magenta line for shipping lane boundaries',

  /**
   * Draws a short segment sample. In practice, the layer draws full
   * paths using this style configuration.
   */
  draw: function (ctx, size, color) {
    var s = size * 0.5;
    var c = color || 'rgba(180,50,180,0.4)';

    ctx.beginPath();
    ctx.setLineDash([s * 0.3, s * 0.15]);
    ctx.moveTo(-s, 0);
    ctx.lineTo(s, 0);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.06;
    ctx.stroke();
    ctx.setLineDash([]);

    // Arrow indicating traffic direction
    ctx.beginPath();
    ctx.moveTo(s * 0.4, 0);
    ctx.lineTo(s * 0.2, -s * 0.12);
    ctx.moveTo(s * 0.4, 0);
    ctx.lineTo(s * 0.2, s * 0.12);
    ctx.stroke();
  },

  /** Style config for layer rendering */
  lineStyle: {
    dash: [8, 6],
    color: 'rgba(180,50,180,0.4)',
    width: 1.5,
  },
};

// =====================================================================
// BOUNDARY
// =====================================================================

var boundary = {
  id: 'boundary',
  name: 'Jurisdictional Boundary',
  description: 'Alternating dot-dash line for territorial/EEZ boundaries',

  draw: function (ctx, size, color) {
    var s = size * 0.5;
    var c = color || 'rgba(139,175,196,0.3)';

    ctx.beginPath();
    ctx.setLineDash([s * 0.25, s * 0.1, s * 0.05, s * 0.1]);
    ctx.moveTo(-s, 0);
    ctx.lineTo(s, 0);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.04;
    ctx.stroke();
    ctx.setLineDash([]);
  },

  lineStyle: {
    dash: [10, 4, 2, 4],
    color: 'rgba(139,175,196,0.3)',
    width: 1,
  },
};

// =====================================================================
// HAZARD AREA
// =====================================================================

var hazardArea = {
  id: 'hazard-area',
  name: 'Hazard / Danger Zone',
  description: 'Hatched area indicating danger (rocks, shoals, wrecks)',

  draw: function (ctx, size, color) {
    var s = size * 0.5;
    var c = color || 'rgba(200,60,60,0.3)';

    // Circle outline
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.4, 0, TAU);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.03;
    ctx.stroke();

    // Hatch lines inside
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.38, 0, TAU);
    ctx.clip();

    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.02;
    for (var hx = -s * 0.5; hx < s * 0.5; hx += s * 0.12) {
      ctx.beginPath();
      ctx.moveTo(hx, -s * 0.5);
      ctx.lineTo(hx + s * 0.3, s * 0.5);
      ctx.stroke();
    }
    ctx.restore();

    // Danger cross
    ctx.beginPath();
    ctx.moveTo(-s * 0.12, -s * 0.12);
    ctx.lineTo(s * 0.12, s * 0.12);
    ctx.moveTo(s * 0.12, -s * 0.12);
    ctx.lineTo(-s * 0.12, s * 0.12);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.05;
    ctx.stroke();
  },
};

// =====================================================================
// FISHING GROUND
// =====================================================================

var fishingGround = {
  id: 'fishing-ground',
  name: 'Named Fishing Area',
  description: 'Dashed outline with fish icon marking a fishing ground',

  draw: function (ctx, size, color) {
    var s = size * 0.5;
    var c = color || 'rgba(201,168,76,0.25)';

    // Dashed circle boundary
    ctx.beginPath();
    ctx.setLineDash([s * 0.15, s * 0.1]);
    ctx.arc(0, 0, s * 0.5, 0, TAU);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.03;
    ctx.stroke();
    ctx.setLineDash([]);

    // Small fish icon in center
    ctx.beginPath();
    ctx.moveTo(s * 0.15, 0);
    ctx.quadraticCurveTo(s * 0.05, -s * 0.1, -s * 0.1, 0);
    ctx.quadraticCurveTo(s * 0.05, s * 0.1, s * 0.15, 0);
    ctx.fillStyle = c;
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(-s * 0.1, 0);
    ctx.lineTo(-s * 0.18, -s * 0.06);
    ctx.lineTo(-s * 0.18, s * 0.06);
    ctx.closePath();
    ctx.fill();
  },
};

// =====================================================================
// RESTRICTED AREA
// =====================================================================

var restrictedArea = {
  id: 'restricted-area',
  name: 'Restricted / Prohibited Zone',

  draw: function (ctx, size, color) {
    var s = size * 0.5;
    var c = color || 'rgba(200,60,60,0.4)';

    // Circle with diagonal line (prohibition symbol)
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.4, 0, TAU);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.05;
    ctx.stroke();

    // Diagonal slash
    ctx.beginPath();
    ctx.moveTo(-s * 0.28, -s * 0.28);
    ctx.lineTo(s * 0.28, s * 0.28);
    ctx.stroke();
  },
};

// =====================================================================
// ANCHORAGE AREA
// =====================================================================

var anchorageArea = {
  id: 'anchorage-area',
  name: 'Designated Anchorage',

  draw: function (ctx, size, color) {
    var s = size * 0.5;
    var c = color || 'rgba(0,104,71,0.3)';

    // Dashed circle
    ctx.beginPath();
    ctx.setLineDash([s * 0.2, s * 0.1]);
    ctx.arc(0, 0, s * 0.5, 0, TAU);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.03;
    ctx.stroke();
    ctx.setLineDash([]);

    // Anchor icon (small)
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.2);
    ctx.lineTo(0, s * 0.15);
    ctx.strokeStyle = c;
    ctx.lineWidth = size * 0.04;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-s * 0.15, s * 0.05);
    ctx.quadraticCurveTo(-s * 0.15, s * 0.2, 0, s * 0.15);
    ctx.quadraticCurveTo(s * 0.15, s * 0.2, s * 0.15, s * 0.05);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-s * 0.1, -s * 0.15);
    ctx.lineTo(s * 0.1, -s * 0.15);
    ctx.stroke();
  },
};

// =====================================================================
// Export
// =====================================================================
export var CARTO_SYMBOLS = {
  'depth-sounding':  depthSounding,
  'shipping-lane':   shippingLane,
  'boundary':        boundary,
  'hazard-area':     hazardArea,
  'fishing-ground':  fishingGround,
  'restricted-area': restrictedArea,
  'anchorage-area':  anchorageArea,
};
