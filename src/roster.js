/**
 * Fleet Map — Vessel Roster
 * ==========================
 * Builds and manages the side panel vessel list.
 * Updates automatically when vessels change.
 *
 * The roster shows each vessel's name, status badge, type/speed,
 * and current catch. Clicking a vessel in the roster highlights
 * it on the map.
 *
 * DOM structure generated per vessel:
 *   <div class="roster-item" data-vessel-index="0">
 *     <div class="roster-item-name">São Jorge</div>
 *     <span class="roster-item-status status-fishing">Fishing</span>
 *     <div class="roster-item-detail">Longliner · 7.2 kts</div>
 *     <div class="roster-item-catch">Swordfish</div>
 *   </div>
 */

var STATUS_CLASS_MAP = {
  'Fishing':    'status-fishing',
  'Scalloping': 'status-scalloping',
  'In Transit': 'status-in-transit',
  'Returning':  'status-returning',
  'In Port':    'status-in-port',
};

/**
 * Build (or rebuild) the roster list inside the given container.
 *
 * @param {HTMLElement} container  - Parent element or the #rosterList element itself.
 * @param {Array}       vessels   - Array of vessel objects from config.
 * @param {Object}      config    - Merged fleet-map configuration.
 * @returns {HTMLElement|undefined} The rosterList element, or undefined if not found.
 */
export function buildRoster(container, vessels, config) {
  var rosterList = container.id === 'rosterList'
    ? container
    : container.querySelector('#rosterList');

  if (!rosterList) return;

  // Clear existing content
  rosterList.innerHTML = '';

  for (var i = 0; i < vessels.length; i++) {
    var v = vessels[i];

    // Root item
    var item = document.createElement('div');
    item.className = 'roster-item';
    item.setAttribute('data-vessel-index', String(i));

    // Name
    var nameEl = document.createElement('div');
    nameEl.className = 'roster-item-name';
    nameEl.textContent = v.name;
    item.appendChild(nameEl);

    // Status badge
    var statusEl = document.createElement('span');
    var statusClass = STATUS_CLASS_MAP[v.status] || 'status-in-port';
    statusEl.className = 'roster-item-status ' + statusClass;
    statusEl.textContent = v.status || 'In Port';
    item.appendChild(statusEl);

    // Detail line: type · speed kts
    var detailEl = document.createElement('div');
    detailEl.className = 'roster-item-detail';
    detailEl.textContent = v.type + ' \u00b7 ' + v.speed + ' kts';
    item.appendChild(detailEl);

    // Catch (only when meaningful)
    if (v.catch && v.catch !== '\u2014') {
      var catchEl = document.createElement('div');
      catchEl.className = 'roster-item-catch';
      catchEl.textContent = v.catch;
      item.appendChild(catchEl);
    }

    rosterList.appendChild(item);
  }

  return rosterList;
}

/**
 * Highlight a single roster item by vessel index and scroll it into view.
 *
 * @param {HTMLElement} container - Parent element containing roster items.
 * @param {number}      index    - The vessel array index to highlight.
 */
export function highlightRosterItem(container, index) {
  var items = container.querySelectorAll('.roster-item');
  for (var i = 0; i < items.length; i++) {
    items[i].classList.remove('active');
  }

  var target = container.querySelector('.roster-item[data-vessel-index="' + index + '"]');
  if (target) {
    target.classList.add('active');
    if (typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }
}

/**
 * Remove the active highlight from all roster items.
 *
 * @param {HTMLElement} container - Parent element containing roster items.
 */
export function clearRosterHighlight(container) {
  var items = container.querySelectorAll('.roster-item');
  for (var i = 0; i < items.length; i++) {
    items[i].classList.remove('active');
  }
}
