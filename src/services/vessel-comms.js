/**
 * Fleet Map — Vessel Communications Service (Stub)
 * ====================================================
 * Future service for captain's log, at-sea messaging, catch reporting,
 * and fleet coordination. This stub defines the interface and data
 * structures for when the feature is implemented.
 *
 * Planned features:
 *   - Captain's log entries (text messages from vessels)
 *   - Catch reports (species, weight, location)
 *   - Vessel status updates
 *   - Permission-based visibility (public, fleet-only, owner-only)
 *   - Email list notifications
 *   - ETA estimates based on speed/distance to home port
 *
 * Usage (future):
 *   import { VesselCommsService } from './services/vessel-comms.js';
 *
 *   var comms = new VesselCommsService({
 *     endpoint: '/api/vessel-comms',
 *     refreshMs: 30000,
 *   });
 *
 *   comms.start(function(messages) {
 *     messages.forEach(function(msg) {
 *       map.updateVesselMessage(msg.mmsi, msg);
 *     });
 *   });
 */

// =====================================================================
// Data structures (for documentation and future use)
// =====================================================================

/**
 * @typedef {object} CaptainsLogEntry
 * @property {string}  mmsi       — vessel MMSI identifier
 * @property {string}  vesselName — display name
 * @property {string}  message    — log message text
 * @property {string}  timestamp  — ISO 8601 timestamp
 * @property {string}  type       — 'log' | 'catch-report' | 'status' | 'alert'
 * @property {boolean} isPublic   — visible to all or restricted
 * @property {string[]} permissions — ['fleet', 'owner', 'email-list-id']
 */

/**
 * @typedef {object} CatchReport
 * @property {string}  mmsi      — vessel MMSI
 * @property {string}  species   — catch species
 * @property {number}  weight    — weight in lbs
 * @property {number}  lat       — catch location
 * @property {number}  lon       — catch location
 * @property {string}  timestamp — when caught
 * @property {string}  notes     — additional notes
 */

/**
 * @typedef {object} ETAEstimate
 * @property {string}  mmsi          — vessel MMSI
 * @property {string}  destinationPort — target port name
 * @property {number}  distanceNm    — distance in nautical miles
 * @property {number}  speedKnots    — current speed
 * @property {string}  eta           — estimated arrival time (ISO 8601)
 * @property {string}  etaDisplay    — formatted display string (e.g. "14:30")
 */

// =====================================================================
// Service class
// =====================================================================

export class VesselCommsService {
  /**
   * @param {object} config
   * @param {string} [config.endpoint]   — REST API endpoint URL
   * @param {number} [config.refreshMs]  — poll interval (default 30s)
   * @param {string} [config.wsEndpoint] — WebSocket URL (future)
   */
  constructor(config) {
    this.endpoint  = (config && config.endpoint) || null;
    this.refreshMs = (config && config.refreshMs) || 30000;
    this._interval = null;
  }

  /**
   * Start polling for vessel messages.
   * @param {function} callback — receives array of messages
   */
  start(callback) {
    if (!this.endpoint) {
      // No endpoint configured — service is dormant
      return;
    }

    var self = this;
    this._fetchMessages(callback);
    this._interval = setInterval(function () {
      self._fetchMessages(callback);
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
   * Fetch messages from the API.
   * @private
   */
  async _fetchMessages(callback) {
    if (!this.endpoint) return;

    try {
      var resp = await fetch(this.endpoint, {
        signal: AbortSignal.timeout(10000),
      });
      if (!resp.ok) return;
      var data = await resp.json();
      if (callback) callback(data.messages || data || []);
    } catch (err) {
      // Silent fail — comms are best-effort
    }
  }

  /**
   * Calculate ETA from current position/speed to a destination port.
   *
   * @param {object} vessel — { lat, lon, speed, heading }
   * @param {object} port   — { lat, lon, name }
   * @returns {ETAEstimate}
   */
  static calculateETA(vessel, port) {
    // Haversine distance
    var R = 3440.065; // Earth radius in nautical miles
    var dLat = (port.lat - vessel.lat) * Math.PI / 180;
    var dLon = (port.lon - vessel.lon) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(vessel.lat * Math.PI / 180) * Math.cos(port.lat * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var distNm = R * c;

    var speed = vessel.speed || 1;
    var hoursToArrival = distNm / speed;
    var etaDate = new Date(Date.now() + hoursToArrival * 3600000);

    var etaHours = etaDate.getHours();
    var etaMin   = etaDate.getMinutes();
    var etaDisplay = (etaHours < 10 ? '0' : '') + etaHours + ':' +
                     (etaMin < 10 ? '0' : '') + etaMin;

    return {
      mmsi: vessel.mmsi || '',
      destinationPort: port.name || '',
      distanceNm: Math.round(distNm * 10) / 10,
      speedKnots: speed,
      eta: etaDate.toISOString(),
      etaDisplay: etaDisplay,
    };
  }
}
