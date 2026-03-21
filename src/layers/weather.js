/**
 * Fleet Map — Weather Layer
 * ===========================
 * Renders weather data from NOAA onto the map: wind barbs, wave indicators,
 * temperature badges, condition icons, and warning flags.
 *
 * Canvas: fleetCanvasWeather (z-index: 4, between coast and vessels)
 * Semi-static layer — redraws on weather data update or resize.
 *
 * Customizable via config.weather:
 *   .enabled     — boolean, enable/disable weather overlay
 *   .refreshMs   — NOAA poll interval (default 15 min)
 *   .points      — array of { lat, lon } to fetch forecasts for
 *   .alertZone   — NOAA marine zone code for warnings
 *   .showWind    — show wind barbs (default true)
 *   .showWaves   — show wave indicators (default true)
 *   .showTemp    — show temperature badges (default false)
 *   .showWarnings — show warning flags (default true)
 */

import { scaleFor, emphasisFor } from '../assets/scale.js';

var TAU = Math.PI * 2;

/**
 * Draw the weather overlay layer.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number}   w            — logical canvas width
 * @param {number}   h            — logical canvas height
 * @param {function} projFn       — projFn(lat, lon) => { x, y }
 * @param {object}   config       — merged FleetMap config
 * @param {number}   t            — animation time
 * @param {object}   weatherData  — { stations: [...], warnings: [...] }
 * @param {object}   [renderer]   — AssetRenderer instance (optional)
 */
export function drawWeather(ctx, w, h, projFn, config, t, weatherData, renderer) {
  ctx.clearRect(0, 0, w, h);

  if (!weatherData || !config.weather || !config.weather.enabled) return;

  var stations = weatherData.stations || [];
  var warnings = weatherData.warnings || [];
  var colors   = config.colors;
  var fonts    = config.fonts;
  var wConf    = config.weather;
  var showWind    = wConf.showWind !== false;
  var showWaves   = wConf.showWaves !== false;
  var showTemp    = wConf.showTemp === true;
  var showWarnings = wConf.showWarnings !== false;

  var theme = (renderer && renderer.theme) || null;

  // ------------------------------------------------------------------
  // 1. Station weather data
  // ------------------------------------------------------------------
  for (var i = 0; i < stations.length; i++) {
    var station = stations[i];
    var sp = projFn(station.lat, station.lon);

    // Skip if off-screen
    if (sp.x < -20 || sp.x > w + 20 || sp.y < -20 || sp.y > h + 20) continue;

    var normalColor = colors.blade || 'rgba(139,175,196,1)';

    // Wind barb
    if (showWind && station.wind && station.wind.speed > 0) {
      if (renderer) {
        renderer.draw(ctx, 'weather', 'wind-barb', sp.x, sp.y, {
          size: 'md',
          rotation: (station.wind.direction || 0) * Math.PI / 180,
          color: normalColor,
          alpha: 0.6,
          t: t,
        });
      } else {
        _drawSimpleWindBarb(ctx, sp.x, sp.y, station.wind, normalColor);
      }

      // Wind speed label
      var windFontSize = scaleFor('text', 'xs', w, emphasisFor('text', theme));
      ctx.font = windFontSize + 'px ' + (fonts.sans || 'sans-serif');
      ctx.fillStyle = normalColor;
      ctx.globalAlpha = 0.4;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(station.wind.speed + 'kt', sp.x, sp.y + 14);
      ctx.globalAlpha = 1;
    }

    // Wave height
    if (showWaves && station.waves && station.waves.height > 0) {
      var waveY = sp.y + 28;
      if (renderer) {
        renderer.draw(ctx, 'weather', 'wave-height', sp.x, waveY, {
          size: 'sm',
          color: normalColor,
          alpha: 0.5,
          t: t,
        });
      }

      // Wave height label
      var waveFontSize = scaleFor('text', 'xs', w, emphasisFor('text', theme));
      ctx.font = waveFontSize + 'px ' + (fonts.sans || 'sans-serif');
      ctx.fillStyle = normalColor;
      ctx.globalAlpha = 0.35;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(station.waves.height + 'ft', sp.x, waveY + 10);
      ctx.globalAlpha = 1;
    }

    // Temperature
    if (showTemp && station.temperature && station.temperature.value != null) {
      var tempX = sp.x + 24;
      ctx.font = scaleFor('text', 'sm', w, emphasisFor('text', theme)) + 'px ' + (fonts.sans || 'sans-serif');
      ctx.fillStyle = normalColor;
      ctx.globalAlpha = 0.5;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(station.temperature.value + '°' + (station.temperature.unit || 'F'), tempX, sp.y);
      ctx.globalAlpha = 1;
    }

    // Conditions text
    if (station.conditions) {
      var condFontSize = scaleFor('text', 'xs', w, emphasisFor('text', theme));
      ctx.font = condFontSize + 'px ' + (fonts.sans || 'sans-serif');
      ctx.fillStyle = normalColor;
      ctx.globalAlpha = 0.25;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(station.conditions, sp.x, sp.y + 42);
      ctx.globalAlpha = 1;
    }
  }

  // ------------------------------------------------------------------
  // 2. Warning indicators
  // ------------------------------------------------------------------
  if (showWarnings && warnings.length > 0) {
    var warnColor = 'rgba(220,60,60,0.85)';
    var warnFontSize = scaleFor('text', 'sm', w, emphasisFor('text', theme));

    // Draw warning banner at top of map
    ctx.save();
    ctx.globalAlpha = 0.85;

    var bannerH = warnFontSize + 10;
    ctx.fillStyle = 'rgba(180,40,40,0.15)';
    ctx.fillRect(0, 0, w, bannerH);

    ctx.font = 'bold ' + warnFontSize + 'px ' + (fonts.sans || 'sans-serif');
    ctx.fillStyle = warnColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    var warningText = '\u26A0 ' + warnings[0].event;
    if (warnings.length > 1) {
      warningText += ' (+' + (warnings.length - 1) + ' more)';
    }
    ctx.fillText(warningText, w * 0.5, bannerH * 0.5);

    ctx.restore();
  }
}

/**
 * Fallback wind barb drawing when no AssetRenderer is available.
 * @private
 */
function _drawSimpleWindBarb(ctx, x, y, wind, color) {
  var dir = (wind.direction || 0) * Math.PI / 180;
  var len = 20;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(dir);

  ctx.beginPath();
  ctx.moveTo(0, -len);
  ctx.lineTo(0, len * 0.3);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Two barbs
  ctx.beginPath();
  ctx.moveTo(0, -len * 0.8);
  ctx.lineTo(8, -len);
  ctx.moveTo(0, -len * 0.55);
  ctx.lineTo(7, -len * 0.75);
  ctx.stroke();

  ctx.restore();
}
