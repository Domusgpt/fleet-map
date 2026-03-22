/**
 * Fleet Map — Interaction Handler
 * =================================
 * Manages mouse/touch interaction with the fleet map:
 *   - Hover detection over vessel triangles
 *   - Tooltip positioning and content
 *   - Roster item highlighting on hover
 *   - Double-tap / double-click for cinematic vessel zoom
 *   - Click callbacks
 *
 * Returns a cleanup function for proper teardown on destroy().
 */

import { highlightRosterItem, clearRosterHighlight } from './roster.js';

var HIT_RADIUS = 18;
var DOUBLE_TAP_DELAY = 350; // ms between taps to count as double-tap
var DOUBLE_TAP_RADIUS = 30; // px tolerance for second tap position

/**
 * Find the nearest vessel within HIT_RADIUS of (mx, my).
 *
 * @param {Array}  vessels - Vessel array (each must have _sx, _sy screen coords).
 * @param {number} mx      - Mouse X relative to the fleet-map element.
 * @param {number} my      - Mouse Y relative to the fleet-map element.
 * @returns {{ vessel: Object, index: number }|null}
 */
function hitTest(vessels, mx, my) {
  var best = null;
  var bestDist = HIT_RADIUS + 1;

  for (var i = 0; i < vessels.length; i++) {
    var v = vessels[i];
    if (v._sx == null || v._sy == null) continue;
    var dx = mx - v._sx;
    var dy = my - v._sy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < HIT_RADIUS && dist < bestDist) {
      best = { vessel: v, index: i };
      bestDist = dist;
    }
  }

  return best;
}

/**
 * Set up all mouse/touch interaction on the fleet map.
 *
 * @param {HTMLElement} container - Root container element.
 * @param {Array}       vessels   - Vessel array (mutated in-place with _sx/_sy).
 * @param {Object}      config    - Merged fleet-map configuration.
 * @returns {Function} Cleanup function that removes all event listeners.
 */
export function setupInteraction(container, vessels, config) {
  // Resolve DOM elements
  var canvas   = container.querySelector('#fleetCanvasVessels');
  var tooltip  = container.querySelector('#vesselInfo');
  var viName   = tooltip ? tooltip.querySelector('#viName')   : null;
  var viDetail = tooltip ? tooltip.querySelector('#viDetail') : null;
  var viStatus = tooltip ? tooltip.querySelector('#viStatus') : null;

  var mapEl = container.classList.contains('fleet-map')
    ? container
    : container.querySelector('.fleet-map') || container;

  // Double-tap state
  var lastTapTime = 0;
  var lastTapX = 0;
  var lastTapY = 0;

  // ---- Mousemove ----
  function onMousemove(e) {
    var rect = mapEl.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    var hit = hitTest(vessels, mx, my);

    if (hit) {
      // Update tooltip content
      if (viName)   viName.textContent   = hit.vessel.name;
      if (viDetail) {
        var parts = hit.vessel.type + ' \u00b7 ' + hit.vessel.speed + ' kts';
        if (hit.vessel.catch && hit.vessel.catch !== '\u2014') {
          parts += ' \u00b7 ' + hit.vessel.catch;
        }
        viDetail.textContent = parts;
      }
      if (viStatus) viStatus.textContent = hit.vessel.status || '';

      // Position tooltip near mouse, clamped within map bounds
      if (tooltip) {
        var tipW = tooltip.offsetWidth  || 180;
        var tipH = tooltip.offsetHeight || 80;
        var tx = mx + 16;
        var ty = my - tipH - 8;

        if (tx + tipW > rect.width)  tx = mx - tipW - 16;
        if (ty < 0)                  ty = my + 16;
        if (tx < 0)                  tx = 4;
        if (ty + tipH > rect.height) ty = rect.height - tipH - 4;

        tooltip.style.left = tx + 'px';
        tooltip.style.top  = ty + 'px';
        tooltip.classList.add('active');
      }

      highlightRosterItem(container, hit.index);
      mapEl.style.cursor = 'pointer';

      if (typeof config.onVesselHover === 'function') {
        config.onVesselHover(hit.vessel, { x: mx, y: my });
      }
    } else {
      // No hit — hide tooltip and clear roster highlight
      if (tooltip) tooltip.classList.remove('active');
      clearRosterHighlight(container);
      mapEl.style.cursor = '';
    }
  }

  // ---- Mouseleave ----
  function onMouseleave() {
    if (tooltip) tooltip.classList.remove('active');
    clearRosterHighlight(container);
    mapEl.style.cursor = '';
  }

  // ---- Double-tap / Double-click handler ----
  function handleDoubleTap(mx, my) {
    var hit = hitTest(vessels, mx, my);

    if (hit) {
      // Double-tapped a vessel — zoom in
      if (typeof config.onVesselZoom === 'function') {
        config.onVesselZoom(hit.vessel, hit.index);
      }
    } else {
      // Double-tapped empty space — zoom out
      if (typeof config.onMapZoomOut === 'function') {
        config.onMapZoomOut();
      }
    }
  }

  // ---- Click (with double-click detection) ----
  var clickTimer = null;

  function onClick(e) {
    var rect = mapEl.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    // Check for double-click
    var now = Date.now();
    var dx = mx - lastTapX;
    var dy = my - lastTapY;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (now - lastTapTime < DOUBLE_TAP_DELAY && dist < DOUBLE_TAP_RADIUS) {
      // Double-click detected
      lastTapTime = 0;
      if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
      handleDoubleTap(mx, my);
      return;
    }

    lastTapTime = now;
    lastTapX = mx;
    lastTapY = my;

    // Delay single-click to distinguish from double-click
    var savedMx = mx;
    var savedMy = my;
    clickTimer = setTimeout(function () {
      clickTimer = null;
      var hit = hitTest(vessels, savedMx, savedMy);
      if (hit && typeof config.onVesselClick === 'function') {
        config.onVesselClick(hit.vessel);
      }
    }, DOUBLE_TAP_DELAY);
  }

  // ---- Touch events (for mobile double-tap) ----
  function onTouchEnd(e) {
    if (e.changedTouches.length !== 1) return;

    var touch = e.changedTouches[0];
    var rect = mapEl.getBoundingClientRect();
    var mx = touch.clientX - rect.left;
    var my = touch.clientY - rect.top;

    var now = Date.now();
    var dx = mx - lastTapX;
    var dy = my - lastTapY;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (now - lastTapTime < DOUBLE_TAP_DELAY && dist < DOUBLE_TAP_RADIUS) {
      // Double-tap detected
      e.preventDefault();
      lastTapTime = 0;
      if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
      handleDoubleTap(mx, my);
      return;
    }

    lastTapTime = now;
    lastTapX = mx;
    lastTapY = my;

    // Single tap — trigger hover tooltip on mobile
    var savedMx = mx;
    var savedMy = my;
    clickTimer = setTimeout(function () {
      clickTimer = null;
      var hit = hitTest(vessels, savedMx, savedMy);
      if (hit) {
        // Show tooltip
        if (viName)   viName.textContent = hit.vessel.name;
        if (viDetail) {
          var parts = hit.vessel.type + ' \u00b7 ' + hit.vessel.speed + ' kts';
          if (hit.vessel.catch && hit.vessel.catch !== '\u2014') {
            parts += ' \u00b7 ' + hit.vessel.catch;
          }
          viDetail.textContent = parts;
        }
        if (viStatus) viStatus.textContent = hit.vessel.status || '';
        if (tooltip) {
          tooltip.style.left = savedMx + 'px';
          tooltip.style.top  = (savedMy - 80) + 'px';
          tooltip.classList.add('active');
        }

        if (typeof config.onVesselClick === 'function') {
          config.onVesselClick(hit.vessel);
        }
      } else {
        if (tooltip) tooltip.classList.remove('active');
      }
    }, DOUBLE_TAP_DELAY);
  }

  // Prevent default double-tap zoom on mobile
  function onTouchStart(e) {
    // Only prevent if touching near a vessel (don't block all scrolling)
    if (e.touches.length === 1) {
      var touch = e.touches[0];
      var rect = mapEl.getBoundingClientRect();
      var mx = touch.clientX - rect.left;
      var my = touch.clientY - rect.top;
      var hit = hitTest(vessels, mx, my);
      if (hit) {
        // Prevent browser double-tap zoom when tapping vessels
        // (but still allow the touchend to fire)
      }
    }
  }

  // Attach listeners
  mapEl.addEventListener('mousemove',  onMousemove);
  mapEl.addEventListener('mouseleave', onMouseleave);
  mapEl.addEventListener('click',      onClick);
  mapEl.addEventListener('touchend',   onTouchEnd, { passive: false });
  mapEl.addEventListener('touchstart', onTouchStart, { passive: true });

  // Return cleanup function
  return function cleanup() {
    mapEl.removeEventListener('mousemove',  onMousemove);
    mapEl.removeEventListener('mouseleave', onMouseleave);
    mapEl.removeEventListener('click',      onClick);
    mapEl.removeEventListener('touchend',   onTouchEnd);
    mapEl.removeEventListener('touchstart', onTouchStart);
    if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
  };
}
