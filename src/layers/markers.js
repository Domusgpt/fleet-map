/**
 * Fleet Map — Markers Layer
 * ===========================
 * Renders channel markers, navigation aids, buoys, beacons, and
 * lighthouses on the map.
 *
 * Canvas: fleetCanvasMarkers (z-index: 3, between coast and weather)
 * Semi-static — redraws on data update, resize, and for animated elements.
 *
 * Config data format:
 *   markers: [
 *     { type: 'buoy-red',    lat: 39.76, lon: -74.10, name: 'R2',  light: 'Fl R 4s' },
 *     { type: 'buoy-green',  lat: 39.76, lon: -74.11, name: 'G1' },
 *     { type: 'lighthouse',  lat: 39.76, lon: -74.07, name: 'Barnegat Light' },
 *     { type: 'safe-water',  lat: 39.80, lon: -74.05, name: 'BL' },
 *   ]
 *
 * Supported marker types:
 *   nav-aids:        buoy-red, buoy-green, buoy-yellow, buoy-cardinal-n/s/e/w,
 *                    lighthouse, beacon, daymark-triangle, daymark-square
 *   channel-markers: lateral-port, lateral-starboard, safe-water,
 *                    isolated-danger, special
 *   cartography:     hazard-area, fishing-ground, restricted-area, anchorage-area
 */

import { scaleFor, emphasisFor } from '../assets/scale.js';

/**
 * Determine which registry category a marker type belongs to.
 */
function resolveCategory(type) {
  var navAids = [
    'buoy-red', 'buoy-green', 'buoy-yellow',
    'buoy-cardinal-n', 'buoy-cardinal-s', 'buoy-cardinal-e', 'buoy-cardinal-w',
    'lighthouse', 'beacon', 'daymark-triangle', 'daymark-square',
  ];
  var channelMarkers = [
    'lateral-port', 'lateral-starboard', 'safe-water',
    'isolated-danger', 'special',
  ];
  var cartography = [
    'hazard-area', 'fishing-ground', 'restricted-area', 'anchorage-area',
  ];

  if (navAids.indexOf(type) !== -1) return 'nav-aids';
  if (channelMarkers.indexOf(type) !== -1) return 'channel-markers';
  if (cartography.indexOf(type) !== -1) return 'cartography';
  return 'nav-aids'; // default
}

/**
 * Draw the markers layer.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number}   w          — logical canvas width
 * @param {number}   h          — logical canvas height
 * @param {function} projFn     — projFn(lat, lon) => { x, y }
 * @param {object}   config     — merged FleetMap config
 * @param {number}   t          — animation time
 * @param {Array}    markers    — array of marker objects
 * @param {object}   [renderer] — AssetRenderer instance (optional)
 */
export function drawMarkers(ctx, w, h, projFn, config, t, markers, renderer) {
  ctx.clearRect(0, 0, w, h);

  if (!markers || !markers.length) return;

  var colors = config.colors;
  var fonts  = config.fonts;
  var theme  = (renderer && renderer.theme) || null;

  for (var i = 0; i < markers.length; i++) {
    var marker = markers[i];
    var sp = projFn(marker.lat, marker.lon);

    // Skip off-screen markers
    if (sp.x < -30 || sp.x > w + 30 || sp.y < -30 || sp.y > h + 30) continue;

    var category = resolveCategory(marker.type);

    if (renderer) {
      // Use asset renderer for proper themed symbols
      renderer.draw(ctx, category, marker.type, sp.x, sp.y, {
        size: marker.type === 'lighthouse' ? 'lg' : 'md',
        color: colors.creme,
        alpha: 0.85,
        t: t,
      });
    } else {
      // Fallback: simple circle marker
      _drawFallbackMarker(ctx, sp.x, sp.y, marker, colors);
    }

    // Marker label
    if (marker.name) {
      var labelSize = scaleFor('text', 'xs', w, emphasisFor('text', theme));
      var labelOffsetY = marker.type === 'lighthouse' ?
        scaleFor('marker', 'lg', w, emphasisFor('marker', theme)) * 0.6 + 4 :
        scaleFor('marker', 'md', w, emphasisFor('marker', theme)) * 0.5 + 4;

      ctx.font = labelSize + 'px ' + (fonts.sans || 'sans-serif');
      ctx.fillStyle = colors.creme || 'rgba(240,235,224,1)';
      ctx.globalAlpha = 0.4;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(marker.name, sp.x, sp.y + labelOffsetY);
      ctx.globalAlpha = 1;
    }

    // Light characteristic label (e.g. "Fl R 4s")
    if (marker.light) {
      var lightSize = scaleFor('text', 'xs', w, emphasisFor('text', theme));
      ctx.font = lightSize + 'px ' + (fonts.sans || 'sans-serif');
      ctx.fillStyle = colors.blade || 'rgba(139,175,196,1)';
      ctx.globalAlpha = 0.25;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      var lightY = sp.y +
        (scaleFor('marker', 'md', w, emphasisFor('marker', theme)) * 0.5) + 4 +
        labelSize + 2;
      ctx.fillText(marker.light, sp.x, lightY);
      ctx.globalAlpha = 1;
    }
  }
}

/**
 * Fallback marker rendering when no AssetRenderer is available.
 * @private
 */
function _drawFallbackMarker(ctx, x, y, marker, colors) {
  var type = marker.type || '';
  var radius = 4;
  var fillColor;

  if (type.indexOf('red') !== -1 || type === 'lateral-port') {
    fillColor = 'rgba(200,50,50,0.8)';
  } else if (type.indexOf('green') !== -1 || type === 'lateral-starboard') {
    fillColor = 'rgba(50,160,60,0.8)';
  } else if (type.indexOf('yellow') !== -1 || type === 'special') {
    fillColor = 'rgba(220,200,50,0.8)';
  } else if (type === 'lighthouse') {
    fillColor = 'rgba(255,245,200,0.9)';
    radius = 6;
  } else {
    fillColor = colors.blade || 'rgba(139,175,196,0.7)';
  }

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();
}
