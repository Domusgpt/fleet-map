/**
 * Fleet Map — NOAA Weather Service
 * ===================================
 * Live integration with NOAA's weather.gov API for marine forecasts,
 * warnings, and conditions. Polling-based with configurable intervals.
 *
 * NOAA API docs: https://www.weather.gov/documentation/services-web-api
 * No API key required — free, public REST API.
 *
 * Usage:
 *   import { NOAAClient } from './services/noaa.js';
 *
 *   var noaa = new NOAAClient({
 *     refreshMs: 900000, // 15 minutes
 *   });
 *
 *   noaa.start(function(weatherData) {
 *     // weatherData: { stations: [{ lat, lon, wind, waves, temp, conditions, warnings }] }
 *     map.updateWeather(weatherData);
 *   });
 */

var POINTS_API   = 'https://api.weather.gov/points/';
var ALERTS_API   = 'https://api.weather.gov/alerts/active';
var STATIONS_API = 'https://api.weather.gov/stations/';

/**
 * Map NOAA short forecast strings to weather symbol IDs.
 */
var CONDITION_MAP = {
  'Sunny':           'clear',
  'Clear':           'clear',
  'Mostly Sunny':    'clear',
  'Mostly Clear':    'clear',
  'Partly Sunny':    'partly-cloudy',
  'Partly Cloudy':   'partly-cloudy',
  'Mostly Cloudy':   'cloudy',
  'Cloudy':          'cloudy',
  'Overcast':        'cloudy',
  'Fog':             'fog',
  'Haze':            'fog',
  'Rain':            'rain',
  'Light Rain':      'rain',
  'Heavy Rain':      'rain',
  'Showers':         'rain',
  'Drizzle':         'rain',
  'Thunderstorms':   'storm-warning',
  'Severe':          'storm-warning',
  'Snow':            'rain',       // closest available
  'Windy':           'wind-barb',
  'Breezy':          'wind-barb',
};

/**
 * Parse a NOAA wind string like "SW 15 to 25 mph" or "N 10 mph".
 * @param {string} windStr
 * @returns {{ speed: number, gust: number, direction: number }}
 */
function parseWind(windStr) {
  if (!windStr) return { speed: 0, gust: 0, direction: 0 };

  var dirMap = {
    N: 0, NNE: 22, NE: 45, ENE: 67,
    E: 90, ESE: 112, SE: 135, SSE: 157,
    S: 180, SSW: 202, SW: 225, WSW: 247,
    W: 270, WNW: 292, NW: 315, NNW: 337,
  };

  var parts = windStr.split(' ');
  var direction = dirMap[parts[0]] || 0;
  var speeds = windStr.match(/(\d+)/g);
  var speed = speeds ? parseInt(speeds[0], 10) : 0;
  var gust  = speeds && speeds.length > 1 ? parseInt(speeds[1], 10) : 0;

  // Convert mph to knots (1 mph ≈ 0.87 knots)
  return {
    speed: Math.round(speed * 0.87),
    gust: Math.round(gust * 0.87),
    direction: direction,
  };
}

/**
 * Parse NOAA wave height from detailed forecast text.
 * Looks for patterns like "seas 3 to 5 feet" or "waves around 2 feet".
 * @param {string} text
 * @returns {{ height: number, period: number }} in feet
 */
function parseWaves(text) {
  if (!text) return { height: 0, period: 0 };

  var match = text.match(/(?:seas?|waves?)\s+(?:around\s+)?(\d+)(?:\s+to\s+(\d+))?\s*(?:feet|ft)/i);
  if (match) {
    var low  = parseInt(match[1], 10);
    var high = match[2] ? parseInt(match[2], 10) : low;
    return { height: (low + high) / 2, period: 0 };
  }
  return { height: 0, period: 0 };
}

export class NOAAClient {
  /**
   * @param {object} config
   * @param {number} [config.refreshMs=900000] — poll interval (default 15 min)
   * @param {Array}  [config.stations]  — array of { id, lat, lon, name } station configs
   * @param {Array}  [config.points]    — array of { lat, lon } to fetch forecasts for
   * @param {string} [config.alertZone] — NOAA marine zone code (e.g. 'ANZ335')
   */
  constructor(config) {
    this.refreshMs  = (config && config.refreshMs) || 900000;
    this.stations   = (config && config.stations) || [];
    this.points     = (config && config.points) || [];
    this.alertZone  = (config && config.alertZone) || null;
    this._interval  = null;
    this._cache     = {};  // lat,lon → { gridpoint URL, zone }
  }

  /**
   * Start periodic weather fetching.
   * @param {function} callback — called with ({ stations: [...], warnings: [...] })
   */
  start(callback) {
    if (this._interval) return;

    var self = this;

    // Immediate first fetch
    this._fetchAll(callback);

    // Then poll
    this._interval = setInterval(function () {
      self._fetchAll(callback);
    }, this.refreshMs);
  }

  /**
   * Stop polling.
   */
  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  /**
   * Fetch all configured data points and warnings.
   * @private
   */
  async _fetchAll(callback) {
    var results = {
      stations: [],
      warnings: [],
    };

    try {
      // Fetch forecasts for each configured point
      var forecastPromises = [];
      for (var i = 0; i < this.points.length; i++) {
        forecastPromises.push(this._fetchPoint(this.points[i]));
      }

      // Fetch warnings if zone configured
      var warningPromise = this.alertZone ? this._fetchWarnings(this.alertZone) : Promise.resolve([]);

      var forecasts = await Promise.all(forecastPromises);
      var warnings  = await warningPromise;

      for (var j = 0; j < forecasts.length; j++) {
        if (forecasts[j]) results.stations.push(forecasts[j]);
      }
      results.warnings = warnings;
    } catch (err) {
      // Silently fail — weather is non-critical
      if (typeof console !== 'undefined') {
        console.warn('NOAA fetch error:', err.message || err);
      }
    }

    if (callback) callback(results);
  }

  /**
   * Fetch marine forecast for a single geographic point.
   * Two-step: first resolve gridpoint URL via /points API,
   * then fetch the actual forecast.
   *
   * @param {{ lat: number, lon: number }} point
   * @returns {Promise<object|null>}
   */
  async _fetchPoint(point) {
    var key = point.lat.toFixed(4) + ',' + point.lon.toFixed(4);

    try {
      // Step 1: Resolve gridpoint (cached)
      var meta = this._cache[key];
      if (!meta) {
        var pointResp = await fetch(POINTS_API + point.lat + ',' + point.lon, {
          headers: { 'Accept': 'application/geo+json' },
          signal: AbortSignal.timeout(10000),
        });
        if (!pointResp.ok) return null;
        var pointData = await pointResp.json();
        var props = pointData.properties || {};
        meta = {
          forecastUrl: props.forecast || null,
          forecastHourlyUrl: props.forecastHourly || null,
          gridId: props.gridId || '',
          gridX: props.gridX || 0,
          gridY: props.gridY || 0,
          zone: props.forecastZone || '',
        };
        this._cache[key] = meta;
      }

      if (!meta.forecastUrl) return null;

      // Step 2: Fetch forecast
      var fcResp = await fetch(meta.forecastUrl, {
        headers: { 'Accept': 'application/geo+json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!fcResp.ok) return null;
      var fcData = await fcResp.json();

      var periods = (fcData.properties && fcData.properties.periods) || [];
      var current = periods[0] || {};

      var wind  = parseWind(current.windSpeed + ' ' + (current.windDirection || ''));
      var waves = parseWaves(current.detailedForecast || '');

      return {
        lat: point.lat,
        lon: point.lon,
        name: point.name || key,
        conditions: current.shortForecast || '',
        conditionSymbol: NOAAClient.conditionToSymbol(current.shortForecast || ''),
        temperature: {
          value: current.temperature || null,
          unit: current.temperatureUnit || 'F',
        },
        wind: {
          speed: wind.speed,
          gust: wind.gust,
          direction: wind.direction,
          raw: current.windSpeed || '',
        },
        waves: waves,
        humidity: current.relativeHumidity ? current.relativeHumidity.value : null,
        detailedForecast: current.detailedForecast || '',
        icon: current.icon || '',
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      return null;
    }
  }

  /**
   * Fetch active marine warnings for a zone.
   * @param {string} zone — e.g. 'ANZ335'
   * @returns {Promise<Array>}
   */
  async _fetchWarnings(zone) {
    try {
      var url = ALERTS_API + '?zone=' + zone + '&status=actual&message_type=alert';
      var resp = await fetch(url, {
        headers: { 'Accept': 'application/geo+json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!resp.ok) return [];
      var data = await resp.json();
      var features = data.features || [];

      return features.map(function (f) {
        var p = f.properties || {};
        return {
          event: p.event || '',
          severity: p.severity || '',
          headline: p.headline || '',
          description: p.description || '',
          instruction: p.instruction || '',
          onset: p.onset || '',
          expires: p.expires || '',
          senderName: p.senderName || '',
        };
      });
    } catch (err) {
      return [];
    }
  }

  /**
   * Map a NOAA short forecast condition string to a weather symbol ID.
   * @param {string} condition — e.g. "Partly Cloudy", "Rain"
   * @returns {string} symbol ID
   */
  static conditionToSymbol(condition) {
    if (!condition) return 'clear';
    var lower = condition.toLowerCase();

    for (var key in CONDITION_MAP) {
      if (CONDITION_MAP.hasOwnProperty(key) && lower.indexOf(key.toLowerCase()) !== -1) {
        return CONDITION_MAP[key];
      }
    }
    return 'clear';
  }
}
