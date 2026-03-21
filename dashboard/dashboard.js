/**
 * Fleet Map — Customer Dashboard
 * =================================
 * Admin panel for fleet management. Handles auth, vessel CRUD,
 * theme selection, weather config, marker management, and settings.
 *
 * Currently uses localStorage for demo persistence. In production,
 * this connects to a Firestore backend via REST API.
 */

// =====================================================================
// State
// =====================================================================

var state = {
  user: null,
  config: null,
  vessels: [],
  markers: [],
  map: null,
  editingVesselIndex: -1,
};

// Default demo config
var DEMO_CONFIG = {
  title: 'Demo Fleet',
  subtitle: 'Fleet Map Dashboard',
  theme: 'classic-nautical',
  bounds: { latN: 41, latS: 38.5, lonW: -75, lonE: -72 },
  particleCount: 250,
  particleCountMobile: 100,
  aisEndpoint: null,
  aisRefreshMs: 60000,
  weather: {
    enabled: false,
    refreshMs: 900000,
    points: [],
    alertZone: '',
    showWind: true,
    showWaves: true,
    showTemp: false,
    showWarnings: true,
  },
  coastData: 'lbi',
  currentData: 'nj-atlantic',
};

var DEMO_VESSELS = [
  { name: 'F/V Relentless', mmsi: '338001001', lat: 39.85, lon: -73.65, heading: 135, speed: 7.2, type: 'Scalloper', status: 'Fishing', catch: 'Sea Scallops' },
  { name: 'F/V Karen L', mmsi: '338001002', lat: 39.72, lon: -73.80, heading: 45, speed: 0, type: 'Longliner', status: 'In Port', catch: '—' },
  { name: 'F/V Defiant', mmsi: '338001003', lat: 39.90, lon: -73.50, heading: 270, speed: 8.5, type: 'Trawler', status: 'In Transit', catch: 'Cod' },
  { name: 'F/V Sea Spirit', mmsi: '338001004', lat: 39.60, lon: -73.90, heading: 180, speed: 6.0, type: 'Gillnetter', status: 'Returning', catch: 'Spiny Dogfish' },
  { name: 'F/V Lucky Star', mmsi: '338001005', lat: 39.95, lon: -73.40, heading: 90, speed: 5.5, type: 'Scalloper', status: 'Fishing', catch: 'Sea Scallops' },
];

// =====================================================================
// Auth
// =====================================================================

function initAuth() {
  var loginForm = document.getElementById('loginForm');
  var registerForm = document.getElementById('registerForm');
  var showRegister = document.getElementById('showRegister');
  var showLogin = document.getElementById('showLogin');
  var demoLogin = document.getElementById('demoLogin');
  var logoutBtn = document.getElementById('logoutBtn');

  showRegister.addEventListener('click', function (e) {
    e.preventDefault();
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  });

  showLogin.addEventListener('click', function (e) {
    e.preventDefault();
    registerForm.style.display = 'none';
    loginForm.style.display = 'block';
  });

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var email = document.getElementById('loginEmail').value;
    // In production: Firebase Auth signInWithEmailAndPassword
    loginAs({ email: email, plan: 'fleet' });
  });

  registerForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = document.getElementById('regName').value;
    var email = document.getElementById('regEmail').value;
    // In production: Firebase Auth createUserWithEmailAndPassword + Firestore tenant
    DEMO_CONFIG.title = name;
    loginAs({ email: email, plan: 'dock' });
  });

  demoLogin.addEventListener('click', function () {
    loginAs({ email: 'demo@fleetmap.io', plan: 'demo' });
  });

  logoutBtn.addEventListener('click', function () {
    state.user = null;
    if (state.map) { state.map.stop(); state.map.destroy(); state.map = null; }
    localStorage.removeItem('fleet-map-user');
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
  });

  // Auto-login from localStorage
  var saved = localStorage.getItem('fleet-map-user');
  if (saved) {
    try { loginAs(JSON.parse(saved)); } catch (e) { /* ignore */ }
  }
}

function loginAs(user) {
  state.user = user;
  localStorage.setItem('fleet-map-user', JSON.stringify(user));

  document.getElementById('authScreen').style.display = 'none';
  document.getElementById('dashboard').style.display = 'flex';

  document.getElementById('userEmail').textContent = user.email;
  document.getElementById('planBadge').textContent = user.plan;
  document.getElementById('settingsPlan').textContent = user.plan;

  loadData();
  initDashboard();
}

// =====================================================================
// Data Persistence (localStorage for demo, Firestore in production)
// =====================================================================

function loadData() {
  var savedConfig = localStorage.getItem('fleet-map-config');
  var savedVessels = localStorage.getItem('fleet-map-vessels');
  var savedMarkers = localStorage.getItem('fleet-map-markers');

  state.config = savedConfig ? JSON.parse(savedConfig) : Object.assign({}, DEMO_CONFIG);
  state.vessels = savedVessels ? JSON.parse(savedVessels) : DEMO_VESSELS.slice();
  state.markers = savedMarkers ? JSON.parse(savedMarkers) : [];
}

function saveData() {
  localStorage.setItem('fleet-map-config', JSON.stringify(state.config));
  localStorage.setItem('fleet-map-vessels', JSON.stringify(state.vessels));
  localStorage.setItem('fleet-map-markers', JSON.stringify(state.markers));
}

// =====================================================================
// Dashboard Init
// =====================================================================

function initDashboard() {
  document.getElementById('fleetTitle').textContent = state.config.title || 'Fleet Dashboard';
  updateStats();
  renderVesselTable();
  renderMarkerTable();
  populateSettings();
  populateWeatherPanel();
  initNavigation();
  initThemePicker();
  initVesselModal();
  initWeatherPanel();
  initSettingsPanel();
  initMap();
}

function updateStats() {
  var counts = { total: 0, fishing: 0, transit: 0, port: 0 };
  for (var i = 0; i < state.vessels.length; i++) {
    counts.total++;
    var s = (state.vessels[i].status || '').toLowerCase();
    if (s === 'fishing' || s === 'scalloping') counts.fishing++;
    else if (s === 'in transit' || s === 'returning') counts.transit++;
    else if (s === 'in port') counts.port++;
  }
  document.getElementById('statTotal').textContent = counts.total;
  document.getElementById('statFishing').textContent = counts.fishing;
  document.getElementById('statTransit').textContent = counts.transit;
  document.getElementById('statPort').textContent = counts.port;
  document.getElementById('settingsVesselCount').textContent = counts.total;
}

// =====================================================================
// Navigation
// =====================================================================

function initNavigation() {
  var items = document.querySelectorAll('.nav-item');
  for (var i = 0; i < items.length; i++) {
    items[i].addEventListener('click', function () {
      // Deactivate all
      for (var j = 0; j < items.length; j++) items[j].classList.remove('active');
      // Hide all panels
      var panels = document.querySelectorAll('.panel');
      for (var k = 0; k < panels.length; k++) panels[k].style.display = 'none';
      // Activate clicked
      this.classList.add('active');
      var panelId = 'panel-' + this.getAttribute('data-panel');
      var panel = document.getElementById(panelId);
      if (panel) panel.style.display = 'block';
    });
  }
}

// =====================================================================
// Vessel Table
// =====================================================================

function renderVesselTable() {
  var tbody = document.getElementById('vesselTableBody');
  tbody.innerHTML = '';

  for (var i = 0; i < state.vessels.length; i++) {
    var v = state.vessels[i];
    var statusClass = (v.status || '').toLowerCase().replace(/\s+/g, '-');
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td><strong>' + esc(v.name) + '</strong></td>' +
      '<td>' + esc(v.type) + '</td>' +
      '<td><span class="status-pill ' + statusClass + '">' + esc(v.status) + '</span></td>' +
      '<td>' + (v.lat ? v.lat.toFixed(3) : '—') + ', ' + (v.lon ? v.lon.toFixed(3) : '—') + '</td>' +
      '<td>' + (v.speed || 0) + ' kt</td>' +
      '<td>' + esc(v.catch || '—') + '</td>' +
      '<td>' +
        '<button class="btn btn-ghost btn-sm edit-vessel" data-idx="' + i + '">Edit</button> ' +
        '<button class="btn btn-danger btn-sm delete-vessel" data-idx="' + i + '">Delete</button>' +
      '</td>';
    tbody.appendChild(tr);
  }

  // Attach event listeners
  var editBtns = tbody.querySelectorAll('.edit-vessel');
  for (var e = 0; e < editBtns.length; e++) {
    editBtns[e].addEventListener('click', function () {
      openVesselModal(parseInt(this.getAttribute('data-idx'), 10));
    });
  }

  var delBtns = tbody.querySelectorAll('.delete-vessel');
  for (var d = 0; d < delBtns.length; d++) {
    delBtns[d].addEventListener('click', function () {
      var idx = parseInt(this.getAttribute('data-idx'), 10);
      if (confirm('Delete vessel ' + state.vessels[idx].name + '?')) {
        state.vessels.splice(idx, 1);
        saveData();
        renderVesselTable();
        updateStats();
        syncMap();
      }
    });
  }
}

// =====================================================================
// Vessel Modal
// =====================================================================

function initVesselModal() {
  document.getElementById('addVesselBtn').addEventListener('click', function () {
    openVesselModal(-1);
  });

  document.getElementById('vesselModalClose').addEventListener('click', closeVesselModal);
  document.getElementById('vesselFormCancel').addEventListener('click', closeVesselModal);

  document.getElementById('vesselForm').addEventListener('submit', function (e) {
    e.preventDefault();
    saveVessel();
  });
}

function openVesselModal(index) {
  state.editingVesselIndex = index;
  var modal = document.getElementById('vesselModal');
  var title = document.getElementById('vesselModalTitle');

  if (index >= 0) {
    title.textContent = 'Edit Vessel';
    var v = state.vessels[index];
    document.getElementById('vfName').value = v.name || '';
    document.getElementById('vfMmsi').value = v.mmsi || '';
    document.getElementById('vfType').value = v.type || 'Trawler';
    document.getElementById('vfStatus').value = v.status || 'In Port';
    document.getElementById('vfLat').value = v.lat || '';
    document.getElementById('vfLon').value = v.lon || '';
    document.getElementById('vfHeading').value = v.heading || 0;
    document.getElementById('vfSpeed').value = v.speed || 0;
    document.getElementById('vfCatch').value = v.catch || '';
  } else {
    title.textContent = 'Add Vessel';
    document.getElementById('vesselForm').reset();
  }

  modal.style.display = 'flex';
}

function closeVesselModal() {
  document.getElementById('vesselModal').style.display = 'none';
  state.editingVesselIndex = -1;
}

function saveVessel() {
  var vessel = {
    name: document.getElementById('vfName').value,
    mmsi: document.getElementById('vfMmsi').value || null,
    type: document.getElementById('vfType').value,
    status: document.getElementById('vfStatus').value,
    lat: parseFloat(document.getElementById('vfLat').value) || 0,
    lon: parseFloat(document.getElementById('vfLon').value) || 0,
    heading: parseInt(document.getElementById('vfHeading').value, 10) || 0,
    speed: parseFloat(document.getElementById('vfSpeed').value) || 0,
    catch: document.getElementById('vfCatch').value || '—',
  };

  if (state.editingVesselIndex >= 0) {
    state.vessels[state.editingVesselIndex] = vessel;
  } else {
    state.vessels.push(vessel);
  }

  saveData();
  renderVesselTable();
  updateStats();
  syncMap();
  closeVesselModal();
}

// =====================================================================
// Theme Picker
// =====================================================================

function initThemePicker() {
  var grid = document.getElementById('themeGrid');
  var cards = grid.querySelectorAll('.theme-card');

  // Set active from config
  for (var i = 0; i < cards.length; i++) {
    cards[i].classList.toggle('active', cards[i].getAttribute('data-theme') === state.config.theme);

    cards[i].addEventListener('click', function () {
      var themeId = this.getAttribute('data-theme');
      state.config.theme = themeId;

      for (var j = 0; j < cards.length; j++) cards[j].classList.remove('active');
      this.classList.add('active');

      saveData();
      if (state.map) state.map.setTheme(themeId);
    });
  }

  // Branding inputs
  var titleInput = document.getElementById('brandTitle');
  var subtitleInput = document.getElementById('brandSubtitle');
  titleInput.value = state.config.title || '';
  subtitleInput.value = state.config.subtitle || '';

  titleInput.addEventListener('change', function () {
    state.config.title = this.value;
    document.getElementById('fleetTitle').textContent = this.value;
    saveData();
  });

  subtitleInput.addEventListener('change', function () {
    state.config.subtitle = this.value;
    saveData();
  });
}

// =====================================================================
// Weather Panel
// =====================================================================

function initWeatherPanel() {
  document.getElementById('addWeatherPoint').addEventListener('click', function () {
    state.config.weather.points.push({ lat: 0, lon: 0, name: '' });
    saveData();
    renderWeatherPoints();
  });
}

function populateWeatherPanel() {
  var w = state.config.weather || {};
  document.getElementById('weatherEnabled').checked = !!w.enabled;
  document.getElementById('alertZone').value = w.alertZone || '';
  document.getElementById('showWind').checked = w.showWind !== false;
  document.getElementById('showWaves').checked = w.showWaves !== false;
  document.getElementById('showTemp').checked = !!w.showTemp;
  document.getElementById('showWarnings').checked = w.showWarnings !== false;
  renderWeatherPoints();

  // Change handlers
  ['weatherEnabled', 'showWind', 'showWaves', 'showTemp', 'showWarnings'].forEach(function (id) {
    document.getElementById(id).addEventListener('change', function () {
      var key = id === 'weatherEnabled' ? 'enabled' : id;
      state.config.weather[key] = this.checked;
      saveData();
    });
  });

  document.getElementById('alertZone').addEventListener('change', function () {
    state.config.weather.alertZone = this.value;
    saveData();
  });
}

function renderWeatherPoints() {
  var list = document.getElementById('weatherPointsList');
  list.innerHTML = '';
  var points = (state.config.weather && state.config.weather.points) || [];

  for (var i = 0; i < points.length; i++) {
    var row = document.createElement('div');
    row.className = 'weather-point-row';
    row.innerHTML =
      '<input type="number" step="0.01" placeholder="Lat" value="' + (points[i].lat || '') + '" data-idx="' + i + '" data-field="lat">' +
      '<input type="number" step="0.01" placeholder="Lon" value="' + (points[i].lon || '') + '" data-idx="' + i + '" data-field="lon">' +
      '<input type="text" placeholder="Name" value="' + esc(points[i].name || '') + '" data-idx="' + i + '" data-field="name">' +
      '<button class="btn btn-danger btn-sm" data-idx="' + i + '">X</button>';
    list.appendChild(row);
  }

  // Change handlers
  var inputs = list.querySelectorAll('input');
  for (var j = 0; j < inputs.length; j++) {
    inputs[j].addEventListener('change', function () {
      var idx = parseInt(this.getAttribute('data-idx'), 10);
      var field = this.getAttribute('data-field');
      if (field === 'lat' || field === 'lon') {
        state.config.weather.points[idx][field] = parseFloat(this.value) || 0;
      } else {
        state.config.weather.points[idx][field] = this.value;
      }
      saveData();
    });
  }

  var delBtns = list.querySelectorAll('button');
  for (var k = 0; k < delBtns.length; k++) {
    delBtns[k].addEventListener('click', function () {
      var idx = parseInt(this.getAttribute('data-idx'), 10);
      state.config.weather.points.splice(idx, 1);
      saveData();
      renderWeatherPoints();
    });
  }
}

// =====================================================================
// Marker Table
// =====================================================================

function renderMarkerTable() {
  var tbody = document.getElementById('markerTableBody');
  tbody.innerHTML = '';

  if (!state.markers.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px">No markers added yet</td></tr>';
    return;
  }

  for (var i = 0; i < state.markers.length; i++) {
    var m = state.markers[i];
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + esc(m.type) + '</td>' +
      '<td>' + esc(m.name || '—') + '</td>' +
      '<td>' + (m.lat || 0).toFixed(3) + ', ' + (m.lon || 0).toFixed(3) + '</td>' +
      '<td>' + esc(m.light || '—') + '</td>' +
      '<td><button class="btn btn-danger btn-sm del-marker" data-idx="' + i + '">Delete</button></td>';
    tbody.appendChild(tr);
  }

  var delBtns = tbody.querySelectorAll('.del-marker');
  for (var d = 0; d < delBtns.length; d++) {
    delBtns[d].addEventListener('click', function () {
      state.markers.splice(parseInt(this.getAttribute('data-idx'), 10), 1);
      saveData();
      renderMarkerTable();
      syncMap();
    });
  }
}

// =====================================================================
// Settings Panel
// =====================================================================

function initSettingsPanel() {
  document.getElementById('saveSettingsBtn').addEventListener('click', function () {
    state.config.bounds = {
      latN: parseFloat(document.getElementById('boundsN').value) || 41,
      latS: parseFloat(document.getElementById('boundsS').value) || 38.5,
      lonW: parseFloat(document.getElementById('boundsW').value) || -75,
      lonE: parseFloat(document.getElementById('boundsE').value) || -72,
    };
    state.config.aisEndpoint = document.getElementById('aisEndpoint').value || null;
    state.config.aisRefreshMs = (parseInt(document.getElementById('aisRefresh').value, 10) || 60) * 1000;
    state.config.particleCount = parseInt(document.getElementById('particleCount').value, 10) || 250;
    state.config.particleCountMobile = parseInt(document.getElementById('particleMobile').value, 10) || 100;
    saveData();
    alert('Settings saved. Reload the page to apply map region changes.');
  });
}

function populateSettings() {
  var c = state.config;
  document.getElementById('boundsN').value = c.bounds ? c.bounds.latN : '';
  document.getElementById('boundsS').value = c.bounds ? c.bounds.latS : '';
  document.getElementById('boundsW').value = c.bounds ? c.bounds.lonW : '';
  document.getElementById('boundsE').value = c.bounds ? c.bounds.lonE : '';
  document.getElementById('aisEndpoint').value = c.aisEndpoint || '';
  document.getElementById('aisRefresh').value = (c.aisRefreshMs || 60000) / 1000;
  document.getElementById('particleCount').value = c.particleCount || 250;
  document.getElementById('particleMobile').value = c.particleCountMobile || 100;
}

// =====================================================================
// Map Integration
// =====================================================================

async function initMap() {
  try {
    var module = await import('../src/index.js');
    var FleetMap = module.FleetMap;

    // Load coast and current data dynamically based on config
    var coastMod, currentMod;
    if (state.config.coastData === 'lbi') {
      coastMod = await import('../src/data/lbi-coast.js');
      currentMod = await import('../src/data/currents-nj.js');
    } else {
      coastMod = await import('../src/data/brazil-coast.js');
      currentMod = await import('../src/data/currents-sa.js');
    }

    var mapConfig = Object.assign({}, state.config, {
      vessels: state.vessels,
      markers: state.markers,
      coastData: coastMod.LBI_COAST || coastMod.BRAZIL_COAST,
      currentData: currentMod.NJ_CURRENTS || currentMod.SA_CURRENTS,
      ports: [
        { name: 'Barnegat Light', lat: 39.76, lon: -74.11, size: 'major' },
        { name: 'Point Pleasant', lat: 40.08, lon: -74.07, size: 'minor' },
        { name: 'Atlantic City', lat: 39.36, lon: -74.42, size: 'minor' },
      ],
    });

    state.map = new FleetMap('#fleetMap', mapConfig);
    state.map.start();
  } catch (err) {
    console.warn('Map init error:', err);
    // Map not available — dashboard still works for data management
    var preview = document.querySelector('.map-preview');
    if (preview) {
      preview.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:300px;color:var(--text-muted);font-size:14px">Map preview requires serving from HTTP (not file://)</div>';
    }
  }
}

function syncMap() {
  if (state.map) {
    state.map.updateVessels(state.vessels);
    state.map.updateMarkers(state.markers);
  }
}

// =====================================================================
// Utilities
// =====================================================================

function esc(str) {
  if (!str) return '';
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// =====================================================================
// Init
// =====================================================================

document.addEventListener('DOMContentLoaded', initAuth);
