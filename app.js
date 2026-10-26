/**
 * SmartBus AI Main Application Router & Event Controller
 * 
 * Provides single-page application (SPA) hash routing, global authentication gating,
 * UI state management, real-time telemetry rendering, and robust error boundary
 * isolation preventing uncaught component failures from halting the application.
 * 
 * @module App
 * @author SmartBus AI Engineering Team
 * @version 2.0.0
 */

// Application Bootstrap
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});

// Global Uncaught Exception Boundary
window.addEventListener('error', (event) => {
  console.error('[Global Error Boundary] Uncaught Runtime Exception:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
});

// Global Unhandled Promise Rejection Boundary
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Global Error Boundary] Unhandled Promise Rejection:', {
    reason: event.reason
  });
});

/**
 * Main SmartBus Application Controller Object
 */
const App = {
  /**
   * Currently active SPA view identifier
   * @type {string}
   */
  activeView: "home",

  /**
   * Initializes application lifecycle, event listeners, session verification, and clock.
   * @returns {void}
   */
  init: function() {
    try {
      this.setupEventListeners();
      this.checkAuthSession();
      this.startLiveClock();
    } catch (err) {
      console.error('[App.init] Critical initialization error:', err);
      this.showToast('Application initialization encountered an issue. Running in recovery mode.', 'danger');
    }
  },

  /**
   * Starts live clock ticker in the header bar updating every 1000ms.
   * @returns {void}
   */
  startLiveClock: function() {
    const clockEl = document.getElementById('live-clock');
    const updateTime = () => {
      try {
        const now = new Date();
        if (clockEl) {
          clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        }
      } catch (e) {
        console.warn('[startLiveClock] Clock update tick error:', e);
      }
    };
    updateTime();
    setInterval(updateTime, 1000);
  },

  /**
   * Session Gatekeeper: Inspects persistent/session auth state and switches UI overlay.
   * @returns {void}
   */
  checkAuthSession: function() {
    const loginOverlay = document.getElementById('login-overlay');
    const appContainer = document.getElementById('app-container');

    if (StorageManager.isLoggedIn()) {
      if (loginOverlay) loginOverlay.classList.add('hidden');
      if (appContainer) appContainer.classList.remove('hidden');
      this.populateHeaderAndSidebarUser();
      this.setupGlobalSelectors();
      
      // Determine initial view from URL hash or default home
      const hash = window.location.hash.replace('#', '') || 'home';
      this.navigateToView(hash);
    } else {
      if (loginOverlay) loginOverlay.classList.remove('hidden');
      if (appContainer) appContainer.classList.add('hidden');
    }
  },

  /**
   * Populates user profile details and avatar initials across sidebar and header.
   * @returns {void}
   */
  populateHeaderAndSidebarUser: function() {
    try {
      const profile = StorageManager.getProfile();
      
      const sidebarName = document.getElementById('user-sidebar-name');
      const sidebarRole = document.getElementById('user-sidebar-role');
      const avatarInitials = document.getElementById('user-avatar-initials');
      const homeUserName = document.getElementById('home-user-name');

      if (sidebarName) sidebarName.textContent = profile.fullName;
      if (sidebarRole) sidebarRole.textContent = profile.role;
      if (homeUserName) homeUserName.textContent = profile.fullName.split(' ')[0] || "User";

      if (avatarInitials) {
        const parts = (profile.fullName || "User Demo").split(' ');
        const initials = parts.length > 1 ? (parts[0][0] + parts[1][0]) : parts[0].substring(0, 2);
        avatarInitials.textContent = initials.toUpperCase();
      }
    } catch (e) {
      console.warn('[populateHeaderAndSidebarUser] Error populating profile headers:', e);
    }
  },

  /**
   * Configures global header bus stand dropdown selector and synchronizes state.
   * @returns {void}
   */
  setupGlobalSelectors: function() {
    const headerStandSelector = document.getElementById('header-stand-selector');
    const currentStandId = StorageManager.getSelectedStandId();

    if (headerStandSelector && typeof BUS_STANDS !== 'undefined') {
      headerStandSelector.innerHTML = BUS_STANDS.map(stand => `
        <option value="${stand.id}" ${stand.id === currentStandId ? 'selected' : ''}>${stand.name}</option>
      `).join('');

      headerStandSelector.addEventListener('change', (e) => {
        StorageManager.setSelectedStandId(e.target.value);
        if (this.activeView === 'location') {
          this.renderLocationView();
        } else {
          const matchedStand = BUS_STANDS.find(s => s.id === e.target.value);
          this.showToast(`Selected Bus Stand changed to ${matchedStand ? matchedStand.name : e.target.value}`);
        }
      });
    }
  },

  /**
   * Sets up global event listeners for navigation, demo autofill, login/logout, and modals.
   * @returns {void}
   */
  setupEventListeners: function() {
    // Quick Demo Fill Button
    const btnDemo = document.getElementById('btn-quick-demo');
    if (btnDemo) {
      btnDemo.addEventListener('click', () => {
        const emailEl = document.getElementById('login-email');
        const passEl = document.getElementById('login-password');
        if (emailEl) emailEl.value = "demo@smartbus.ai";
        if (passEl) passEl.value = "password123";
        this.showToast("Demo credentials filled ✓", "info");
      });
    }

    // Login Form Submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email')?.value || '';
        const password = document.getElementById('login-password')?.value || '';
        const remember = document.getElementById('login-remember')?.checked || false;

        StorageManager.login(email, password, remember);
        this.checkAuthSession();
        this.showToast(`Welcome back, ${StorageManager.getProfile().fullName}! ✓`);
      });
    }

    // Logout Button
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        StorageManager.logout();
        this.checkAuthSession();
        this.showToast("Signed out successfully", "info");
      });
    }

    // Navigation Links Listener
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        const viewId = link.getAttribute('data-view') || (link.getAttribute('href') || '').replace('#', '');
        if (viewId) this.navigateToView(viewId);
      });
    });

    // Hash change handler for browser back/forward buttons
    window.addEventListener('hashchange', () => {
      const viewId = window.location.hash.replace('#', '');
      if (viewId && viewId !== this.activeView) this.navigateToView(viewId);
    });

    // Roadmap Modal Listeners
    const btnRoadmap = document.getElementById('btn-toggle-roadmap');
    const roadmapModal = document.getElementById('roadmap-modal');
    const btnCloseRoadmap = document.getElementById('btn-close-roadmap');

    if (btnRoadmap && roadmapModal) {
      btnRoadmap.addEventListener('click', () => roadmapModal.classList.remove('hidden'));
    }
    if (btnCloseRoadmap && roadmapModal) {
      btnCloseRoadmap.addEventListener('click', () => roadmapModal.classList.add('hidden'));
    }

    // Profile Form Listener
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const updated = {
          fullName: document.getElementById('prof-name')?.value || '',
          email: document.getElementById('prof-email')?.value || '',
          phone: document.getElementById('prof-phone')?.value || '',
          role: document.getElementById('prof-role')?.value || 'Commuter',
          preferredStand: document.getElementById('prof-stand')?.value || 'salem-central',
          preferredLanguage: document.getElementById('prof-lang')?.value || 'en'
        };

        StorageManager.saveProfile(updated);
        this.populateHeaderAndSidebarUser();
        this.showToast("Profile updated successfully ✓");
      });
    }

    // Reset Profile Listener
    const btnResetProfile = document.getElementById('btn-reset-profile');
    if (btnResetProfile) {
      btnResetProfile.addEventListener('click', () => {
        const resetData = StorageManager.resetProfile();
        this.loadProfileFormData(resetData);
        this.populateHeaderAndSidebarUser();
        this.showToast("Profile reset to defaults ✓", "info");
      });
    }
  },

  /**
   * Primary SPA View Navigation Router.
   * Changes view panel visibility, updates active state on sidebar links,
   * updates header title, and executes view renderer inside safeRenderView error boundary.
   * 
   * @param {string} viewId - View target name ('home', 'location', 'track', 'buses', 'insight', 'alert', 'profile')
   * @returns {void}
   */
  navigateToView: function(viewId) {
    const validViews = ['home', 'location', 'track', 'buses', 'insight', 'alert', 'profile'];
    if (!validViews.includes(viewId)) viewId = 'home';

    this.activeView = viewId;
    if (window.location.hash !== `#${viewId}`) {
      window.location.hash = viewId;
    }

    // Update Navigation UI
    document.querySelectorAll('.nav-link').forEach(link => {
      const navView = link.getAttribute('data-view') || (link.getAttribute('href') || '').replace('#', '');
      if (navView === viewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Update Panels Visibility
    document.querySelectorAll('.view-panel').forEach(panel => {
      panel.classList.add('hidden');
    });

    const targetPanel = document.getElementById(`view-${viewId}`);
    if (targetPanel) {
      targetPanel.classList.remove('hidden');
    }

    // Header Title Mapping
    const titles = {
      home: "Home Dashboard",
      location: "Town Bus Stands Map & Directory",
      track: "Real-Time Bus GPS Tracking",
      buses: "Bus Fleet Catalog & Schedules",
      insight: "AI Crowd Prediction Analytics",
      alert: "Notifications & Travel Alerts",
      profile: "User Profile & Settings"
    };

    const headerTitle = document.getElementById('header-page-title');
    if (headerTitle) headerTitle.textContent = titles[viewId] || "Dashboard";

    // Trigger View Renderers with Component Error Boundary
    switch (viewId) {
      case 'home':
        this.safeRenderView('home', () => this.renderHomeView());
        break;
      case 'location':
        this.safeRenderView('location', () => this.renderLocationView());
        break;
      case 'track':
        this.safeRenderView('track', () => this.renderTrackView());
        break;
      case 'buses':
        this.safeRenderView('buses', () => this.renderBusesView());
        break;
      case 'insight':
        this.safeRenderView('insight', () => this.renderInsightView());
        break;
      case 'alert':
        this.safeRenderView('alert', () => this.renderAlertView());
        break;
      case 'profile':
        this.safeRenderView('profile', () => this.renderProfileView());
        break;
    }
  },

  /**
   * Component-Level Error Boundary Wrapper.
   * Executes a render operation inside a defensive try/catch boundary.
   * If rendering fails, prevents whole SPA crash and presents a graceful recovery UI.
   * 
   * @param {string} viewId - Identifier of view being rendered
   * @param {Function} renderFn - Renderer function execution closure
   * @returns {void}
   */
  safeRenderView: function(viewId, renderFn) {
    try {
      // Remove any prior error boundary card before rendering
      const panel = document.getElementById(`view-${viewId}`);
      if (panel) {
        const existingBoundary = panel.querySelector('.view-error-boundary-card');
        if (existingBoundary) existingBoundary.remove();
      }

      renderFn();
    } catch (err) {
      console.error(`[App.safeRenderView] Error rendering view '${viewId}':`, err);
      this.renderErrorBoundaryFallback(viewId, err);
      this.showToast(`Error rendering ${viewId} view. Recovery mode active.`, 'danger');
    }
  },

  /**
   * Renders an interactive Error Boundary fallback card into the target view container.
   * Offers the commuter 'Retry' or 'Return to Home' action paths without losing application session.
   * 
   * @param {string} viewId - Identifier of the failing view component
   * @param {Error} error - Captured exception object
   * @returns {void}
   */
  renderErrorBoundaryFallback: function(viewId, error) {
    const panel = document.getElementById(`view-${viewId}`);
    if (!panel) return;

    // Create styled error boundary fallback card
    const fallback = document.createElement('div');
    fallback.className = 'view-error-boundary-card p-8 rounded-2xl glass-panel border border-rose-500/30 text-center my-6 space-y-4';
    fallback.innerHTML = `
      <div class="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 text-2xl mx-auto">
        <i class="fas fa-triangle-exclamation"></i>
      </div>
      <div>
        <h3 class="text-lg font-bold text-white">Component Error Encountered (${viewId})</h3>
        <p class="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          An isolated runtime error occurred while rendering this section. Your user session remains active.
        </p>
        <div class="p-3 bg-slate-900/90 rounded-xl border border-rose-500/20 text-[11px] text-rose-300 font-mono mt-3 max-w-lg mx-auto text-left overflow-x-auto">
          ${error && error.message ? error.message : "Unspecified runtime exception"}
        </div>
      </div>
      <div class="flex items-center justify-center gap-3 pt-2">
        <button onclick="App.navigateToView('${viewId}')" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2">
          <i class="fas fa-rotate-right text-xs"></i> Retry Component
        </button>
        <button onclick="App.navigateToView('home')" class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors">
          Return to Home Dashboard
        </button>
      </div>
    `;

    panel.prepend(fallback);
  },

  // ==================== VIEW RENDERERS ====================

  /**
   * Renders Home Dashboard: Live fleet crowd counters, Smart Choice recommendation banner,
   * bus stands preview cards, and upcoming transit departure cards.
   * @returns {void}
   */
  renderHomeView: function() {
    this.populateHeaderAndSidebarUser();

    // Calculate live status counters
    let freeCount = 0;
    let modCount = 0;
    let fullCount = 0;

    const fleet = (typeof INITIAL_BUSES !== 'undefined') ? INITIAL_BUSES : [];

    fleet.forEach(bus => {
      const status = calculateCrowdStatus(bus.occupiedSeats, bus.capacity).status;
      if (status === 'FREE') freeCount++;
      else if (status === 'MODERATE') modCount++;
      else if (status === 'FULL') fullCount++;
    });

    const totalEl = document.getElementById('stat-total-buses');
    const freeEl = document.getElementById('stat-free-buses');
    const modEl = document.getElementById('stat-mod-buses');
    const fullEl = document.getElementById('stat-full-buses');

    if (totalEl) totalEl.textContent = fleet.length;
    if (freeEl) freeEl.textContent = freeCount;
    if (modEl) modEl.textContent = modCount;
    if (fullEl) fullEl.textContent = fullCount;

    // Smart Choice Engine Banner
    const smartChoice = getSmartChoiceRecommendation("salem-central", "omalur-stand");
    const smartTitle = document.getElementById('smart-choice-title');
    const smartDesc = document.getElementById('smart-choice-desc');

    if (smartChoice && smartTitle && smartDesc) {
      smartTitle.textContent = `Recommended Bus: ${smartChoice.bus.busNumber} (${smartChoice.bus.routeName})`;
      smartDesc.innerHTML = `
        ${smartChoice.bus.busNumber} is recommended because it has <strong>${smartChoice.crowd.availableSeats} available seats</strong> and <strong>${smartChoice.crowd.status}</strong> crowd level (${smartChoice.crowd.percent}% occupied) departing at ${smartChoice.bus.departureTime}.
      `;
    }

    // Nearby Bus Stands List Preview (Top 4)
    const standsContainer = document.getElementById('home-stands-list');
    const stands = (typeof BUS_STANDS !== 'undefined') ? BUS_STANDS : [];

    if (standsContainer) {
      standsContainer.innerHTML = stands.slice(0, 4).map(stand => {
        const crowdInfo = calculateCrowdStatus(Math.round(stand.passengerCapacity * (stand.currentCrowdPercent / 100)), stand.passengerCapacity);
        return `
          <div onclick="window.selectBusStandFromMap('${stand.id}')" class="p-3.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center justify-between transition-all cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
                <i class="fas fa-location-dot text-sm"></i>
              </div>
              <div>
                <div class="text-xs font-bold text-white">${stand.name}</div>
                <div class="text-[11px] text-slate-400">${stand.activeBuses} Active Buses • Next: ${stand.nextBusTiming}</div>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold ${crowdInfo.badgeColor}">
              ${stand.currentCrowdPercent}% ${stand.status}
            </span>
          </div>
        `;
      }).join('');
    }

    // Upcoming Buses List Preview (Top 4)
    const busesContainer = document.getElementById('home-buses-list');
    if (busesContainer) {
      busesContainer.innerHTML = fleet.slice(0, 4).map(bus => {
        const crowdInfo = calculateCrowdStatus(bus.occupiedSeats, bus.capacity);
        return `
          <div onclick="window.trackBus('${bus.id}')" class="p-3.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl flex items-center justify-between transition-all cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300">
                ${bus.busNumber}
              </div>
              <div>
                <div class="text-xs font-bold text-white">${bus.routeName}</div>
                <div class="text-[11px] text-slate-400">Dep: ${bus.departureTime} • ${crowdInfo.availableSeats} Seats Available</div>
              </div>
            </div>
            <div class="text-right">
              <span class="px-2.5 py-1 rounded-lg text-[10px] font-bold ${crowdInfo.badgeColor}">
                ${crowdInfo.status} (${crowdInfo.percent}%)
              </span>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  /**
   * Renders Town Bus Stands View: Leaflet map view with pin clusters, stand capacity card,
   * and list of active departing buses.
   * @returns {void}
   */
  renderLocationView: function() {
    const selectedStandId = StorageManager.getSelectedStandId();
    const dropdown = document.getElementById('location-stand-dropdown');
    const stands = (typeof BUS_STANDS !== 'undefined') ? BUS_STANDS : [];

    if (dropdown) {
      dropdown.innerHTML = stands.map(s => `
        <option value="${s.id}" ${s.id === selectedStandId ? 'selected' : ''}>${s.name}</option>
      `).join('');

      dropdown.onchange = (e) => {
        StorageManager.setSelectedStandId(e.target.value);
        this.renderLocationView();
      };
    }

    const currentStand = stands.find(s => s.id === selectedStandId) || stands[0];
    if (!currentStand) return;

    // Initialize Map with error boundary
    if (typeof MapEngine !== 'undefined') {
      MapEngine.initLocationMap('location-map-container', stands, currentStand.id, (standId) => {
        StorageManager.setSelectedStandId(standId);
        this.renderLocationView();
      });
    }

    // Render Stand Card Details
    const standCard = document.getElementById('location-stand-card');
    if (standCard) {
      const crowdInfo = calculateCrowdStatus(Math.round(currentStand.passengerCapacity * (currentStand.currentCrowdPercent / 100)), currentStand.passengerCapacity);
      standCard.innerHTML = `
        <div class="flex items-start justify-between">
          <div>
            <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">${currentStand.city} Region</span>
            <h3 class="text-xl font-extrabold text-white mt-0.5">${currentStand.name}</h3>
            <p class="text-xs text-slate-400 mt-1">${currentStand.description}</p>
          </div>
          <span class="px-3 py-1 rounded-xl text-xs font-bold ${crowdInfo.badgeColor} border">
            ${currentStand.currentCrowdPercent}% ${currentStand.status}
          </span>
        </div>

        <div class="grid grid-cols-2 gap-3 pt-2">
          <div class="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Fleet</span>
            <div class="text-base font-bold text-white mt-0.5">${currentStand.activeBuses} Buses</div>
          </div>
          <div class="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Next Departure</span>
            <div class="text-base font-bold text-indigo-300 mt-0.5">${currentStand.nextBusTiming}</div>
          </div>
        </div>

        <div>
          <div class="flex justify-between text-xs mb-1.5">
            <span class="text-slate-400 font-semibold">Passenger Capacity Load:</span>
            <span class="text-slate-200 font-bold">${currentStand.currentCrowdPercent}% (${Math.round(currentStand.passengerCapacity * (currentStand.currentCrowdPercent/100))} / ${currentStand.passengerCapacity})</span>
          </div>
          <div class="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
            <div class="h-full ${crowdInfo.barColor} transition-all duration-500" style="width: ${currentStand.currentCrowdPercent}%"></div>
          </div>
        </div>
      `;
    }

    // Departing Buses List from selected stand
    const departingContainer = document.getElementById('location-departing-buses');
    const departingCount = document.getElementById('location-departing-count');
    const fleet = (typeof INITIAL_BUSES !== 'undefined') ? INITIAL_BUSES : [];
    
    const busesForStand = fleet.filter(b => b.originStandId === currentStand.id || b.destStandId === currentStand.id);
    
    if (departingCount) departingCount.textContent = `${busesForStand.length} Monitored`;

    if (departingContainer) {
      if (busesForStand.length === 0) {
        departingContainer.innerHTML = `<div class="p-4 text-center text-xs text-slate-500">No active buses scheduled for this stand right now.</div>`;
      } else {
        departingContainer.innerHTML = busesForStand.map(bus => {
          const crowdInfo = calculateCrowdStatus(bus.occupiedSeats, bus.capacity);
          return `
            <div onclick="window.trackBus('${bus.id}')" class="p-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-between transition-colors cursor-pointer">
              <div class="flex items-center gap-2.5">
                <span class="px-2 py-1 bg-indigo-600/30 text-indigo-300 text-xs font-bold rounded-lg">${bus.busNumber}</span>
                <span class="text-xs font-bold text-white">${bus.routeName}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[11px] text-slate-400">${crowdInfo.availableSeats} seats</span>
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${crowdInfo.badgeColor}">${crowdInfo.status}</span>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  },

  /**
   * Renders Real-Time GPS Tracking View: Continuous waypoint interpolation animation,
   * live ETA updates, dynamic distance remaining, and seating metrics.
   * @returns {void}
   */
  renderTrackView: function() {
    const selectedBusId = StorageManager.getSelectedBusId();
    const dropdown = document.getElementById('track-bus-selector');
    const fleet = (typeof INITIAL_BUSES !== 'undefined') ? INITIAL_BUSES : [];

    if (dropdown) {
      dropdown.innerHTML = fleet.map(b => `
        <option value="${b.id}" ${b.id === selectedBusId ? 'selected' : ''}>${b.busNumber} - ${b.routeName}</option>
      `).join('');

      dropdown.onchange = (e) => {
        StorageManager.setSelectedBusId(e.target.value);
        this.renderTrackView();
      };
    }

    const currentBus = fleet.find(b => b.id === selectedBusId) || fleet[0];
    if (!currentBus) return;

    const crowdInfo = calculateCrowdStatus(currentBus.occupiedSeats, currentBus.capacity);

    // Initialize Map Simulation
    if (typeof MapEngine !== 'undefined') {
      MapEngine.initTrackMap('track-map-container', currentBus, 1, (liveMetrics) => {
        const etaEl = document.getElementById('track-live-eta');
        const distEl = document.getElementById('track-live-dist');
        if (etaEl) etaEl.textContent = `${liveMetrics.etaMinutes} mins`;
        if (distEl) distEl.textContent = `${liveMetrics.distRemainingKm} km`;
      });
    }

    // Render Metrics Panel Card
    const infoCard = document.getElementById('track-bus-info-card');
    if (infoCard) {
      infoCard.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <span class="text-xs font-bold text-indigo-400 uppercase tracking-wider">Live Bus Tracker</span>
            <h3 class="text-2xl font-extrabold text-white mt-0.5">${currentBus.busNumber}</h3>
          </div>
          <span class="px-3 py-1.5 rounded-xl text-xs font-bold ${crowdInfo.badgeColor} border ${crowdInfo.pulseClass}">
            ${crowdInfo.status} (${crowdInfo.percent}%)
          </span>
        </div>

        <div class="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
          <div class="text-xs font-bold text-white">${currentBus.routeName}</div>
          <div class="flex items-center justify-between text-[11px] text-slate-400">
            <span>Dep: ${currentBus.departureTime}</span>
            <span>Arr: ${currentBus.arrivalTime}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">ETA Countdown</span>
            <div id="track-live-eta" class="text-lg font-extrabold text-indigo-300 mt-0.5">8 mins</div>
          </div>
          <div class="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
            <span class="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Remaining Dist</span>
            <div id="track-live-dist" class="text-lg font-extrabold text-white mt-0.5">14.2 km</div>
          </div>
        </div>

        <div class="space-y-2">
          <div class="flex justify-between text-xs">
            <span class="text-slate-400 font-semibold">Available Seats:</span>
            <span class="text-emerald-400 font-bold">${crowdInfo.availableSeats} / ${currentBus.capacity} Free</span>
          </div>
          <div class="flex justify-between text-xs">
            <span class="text-slate-400 font-semibold">Occupied Seats:</span>
            <span class="text-slate-200 font-bold">${currentBus.occupiedSeats} Seats</span>
          </div>
          <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden mt-1">
            <div class="h-full ${crowdInfo.barColor}" style="width: ${crowdInfo.percent}%"></div>
          </div>
        </div>
      `;
    }
  },

  /**
   * Renders Bus Fleet Catalog View: Search filtering by bus number/route,
   * crowd status filtering (ALL, FREE, MODERATE, FULL), and bus stand origin/destination filter.
   * @returns {void}
   */
  renderBusesView: function() {
    const standFilter = document.getElementById('bus-stand-filter');
    const stands = (typeof BUS_STANDS !== 'undefined') ? BUS_STANDS : [];
    const fleet = (typeof INITIAL_BUSES !== 'undefined') ? INITIAL_BUSES : [];

    if (standFilter && standFilter.options.length <= 1) {
      stands.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = s.name;
        standFilter.appendChild(opt);
      });
    }

    const searchInput = document.getElementById('bus-search-input');
    const crowdFilter = document.getElementById('bus-crowd-filter');

    const filterAndRender = () => {
      const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
      const selectedCrowd = crowdFilter ? crowdFilter.value : 'ALL';
      const selectedStand = standFilter ? standFilter.value : 'ALL';

      const filtered = fleet.filter(bus => {
        const crowdInfo = calculateCrowdStatus(bus.occupiedSeats, bus.capacity);
        const matchesSearch = (bus.busNumber || '').toLowerCase().includes(query) || (bus.routeName || '').toLowerCase().includes(query);
        const matchesCrowd = selectedCrowd === 'ALL' || crowdInfo.status === selectedCrowd;
        const matchesStand = selectedStand === 'ALL' || bus.originStandId === selectedStand || bus.destStandId === selectedStand;
        return matchesSearch && matchesCrowd && matchesStand;
      });

      const container = document.getElementById('buses-grid-container');
      if (!container) return;

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="col-span-full p-12 text-center glass-panel rounded-2xl">
            <i class="fas fa-bus-simple text-4xl text-slate-600 mb-3"></i>
            <h4 class="text-base font-bold text-white">No Matching Buses Found</h4>
            <p class="text-xs text-slate-400 mt-1">Try adjusting your search terms or filter selection.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = filtered.map(bus => {
        const crowd = calculateCrowdStatus(bus.occupiedSeats, bus.capacity);
        return `
          <div class="glass-card p-5 rounded-2xl flex flex-col justify-between border border-slate-800 space-y-4">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-extrabold text-sm text-indigo-300">
                  ${bus.busNumber}
                </div>
                <div>
                  <h4 class="text-sm font-bold text-white">${bus.routeName}</h4>
                  <div class="text-[11px] text-slate-400">Dep: ${bus.departureTime} • Arr: ${bus.arrivalTime}</div>
                </div>
              </div>
            </div>

            <div class="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-2 text-xs">
              <div class="flex items-center justify-between">
                <span class="text-slate-400 font-semibold">Total Capacity:</span>
                <span class="font-bold text-white">${bus.capacity} Seats</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400 font-semibold">Occupied Seats:</span>
                <span class="font-bold text-slate-200">${bus.occupiedSeats}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-400 font-semibold">Available Seats:</span>
                <span class="font-extrabold text-emerald-400">${crowd.availableSeats} Seats</span>
              </div>

              <div class="pt-2 border-t border-slate-800/60">
                <div class="flex justify-between items-center mb-1">
                  <span class="text-[11px] text-slate-400 font-semibold">Crowd Status:</span>
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold ${crowd.badgeColor}">
                    ${crowd.status} (${crowd.percent}%)
                  </span>
                </div>
                <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div class="h-full ${crowd.barColor}" style="width: ${crowd.percent}%"></div>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <button onclick="window.trackBus('${bus.id}')" class="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5">
                <i class="fas fa-crosshairs text-[10px]"></i> Track Bus
              </button>
              <button onclick="window.navigateToView('insight')" class="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs border border-slate-700 transition-colors">
                AI Prediction
              </button>
            </div>
          </div>
        `;
      }).join('');
    };

    if (searchInput) searchInput.oninput = filterAndRender;
    if (crowdFilter) crowdFilter.onchange = filterAndRender;
    if (standFilter) standFilter.onchange = filterAndRender;

    filterAndRender();
  },

  /**
   * Renders AI Crowd Insights View: Chart.js 24-hr hourly trend graph
   * and fleet route comparison bar chart.
   * @returns {void}
   */
  renderInsightView: function() {
    setTimeout(() => {
      if (typeof ChartEngine !== 'undefined') {
        ChartEngine.renderHourlyCrowdChart('chart-hourly-crowd', 'salemOmalurTrend');
        ChartEngine.renderRouteComparisonChart('chart-route-comparison', (typeof INITIAL_BUSES !== 'undefined' ? INITIAL_BUSES : []));
      }
    }, 100);
  },

  /**
   * Renders Travel Alerts Feed View: High crowd warnings, arrival updates, and system alerts.
   * @returns {void}
   */
  renderAlertView: function() {
    const container = document.getElementById('alert-stream-container');
    if (!container) return;

    const alerts = StorageManager.getAlerts();

    if (alerts.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center glass-panel rounded-2xl text-slate-400 text-xs">
          <i class="fas fa-bell-slash text-3xl mb-2 text-slate-600"></i>
          <p>No active alerts right now.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = alerts.map(alert => `
      <div class="glass-card p-4 rounded-2xl flex items-start gap-4 border ${alert.severity === 'danger' ? 'border-rose-500/30' : alert.severity === 'warning' ? 'border-amber-500/30' : alert.severity === 'success' ? 'border-emerald-500/30' : 'border-indigo-500/30'}">
        <div class="w-10 h-10 rounded-xl ${alert.severity === 'danger' ? 'bg-rose-500/20 text-rose-400' : alert.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' : alert.severity === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'} flex items-center justify-center text-base shrink-0 mt-0.5">
          <i class="fas ${alert.severity === 'danger' ? 'fa-triangle-exclamation' : alert.severity === 'warning' ? 'fa-clock' : alert.severity === 'success' ? 'fa-circle-check' : 'fa-info-circle'}"></i>
        </div>

        <div class="flex-1">
          <div class="flex items-center justify-between">
            <h4 class="text-sm font-bold text-white">${alert.title}</h4>
            <span class="text-[10px] text-slate-400">${alert.time}</span>
          </div>
          <p class="text-xs text-slate-300 mt-1">${alert.message}</p>
        </div>
      </div>
    `).join('');
  },

  /**
   * Renders User Profile & Commuter Settings View.
   * @returns {void}
   */
  renderProfileView: function() {
    const profile = StorageManager.getProfile();
    this.loadProfileFormData(profile);
  },

  /**
   * Populates HTML input fields in the user profile form.
   * @param {Object} profile - User profile data object
   * @returns {void}
   */
  loadProfileFormData: function(profile) {
    if (!profile) return;
    if (document.getElementById('prof-name')) document.getElementById('prof-name').value = profile.fullName || '';
    if (document.getElementById('prof-email')) document.getElementById('prof-email').value = profile.email || '';
    if (document.getElementById('prof-phone')) document.getElementById('prof-phone').value = profile.phone || '';
    if (document.getElementById('prof-role')) document.getElementById('prof-role').value = profile.role || 'Commuter';
    if (document.getElementById('prof-stand')) document.getElementById('prof-stand').value = profile.preferredStand || 'salem-central';
    if (document.getElementById('prof-lang')) document.getElementById('prof-lang').value = profile.preferredLanguage || 'en';
  },

  /**
   * Lightweight Non-Blocking Toast Notification System.
   * Completely avoids disruptive native browser alert() dialogs.
   * 
   * @param {string} message - Notification text string
   * @param {('success'|'danger'|'warning'|'info')} [type='success'] - Visual severity tier
   * @returns {void}
   */
  showToast: function(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type === 'danger' ? 'border-rose-500/40' : type === 'warning' ? 'border-amber-500/40' : 'border-indigo-500/40'}`;

    const icon = type === 'danger' ? 'fa-circle-xmark text-rose-400' : type === 'info' ? 'fa-circle-info text-indigo-400' : 'fa-circle-check text-emerald-400';

    toast.innerHTML = `
      <i class="fas ${icon} text-lg"></i>
      <span class="text-xs font-semibold text-slate-100 flex-1">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
};

// Global helper functions attached to window for HTML onclick attributes
window.navigateToView = (viewId) => App.navigateToView(viewId);

window.selectBusStandFromMap = (standId) => {
  StorageManager.setSelectedStandId(standId);
  App.navigateToView('location');
  const stand = (typeof BUS_STANDS !== 'undefined') ? BUS_STANDS.find(s => s.id === standId) : null;
  App.showToast(`Selected stand: ${stand ? stand.name : standId}`);
};

window.trackBus = (busId) => {
  StorageManager.setSelectedBusId(busId);
  App.navigateToView('track');
  App.showToast(`Tracking bus ${busId}...`);
};

window.setTrackSpeed = (multiplier) => {
  const fleet = (typeof INITIAL_BUSES !== 'undefined') ? INITIAL_BUSES : [];
  const currentBus = fleet.find(b => b.id === StorageManager.getSelectedBusId()) || fleet[0];
  if (typeof MapEngine !== 'undefined' && currentBus) {
    MapEngine.initTrackMap('track-map-container', currentBus, multiplier, (liveMetrics) => {
      const etaEl = document.getElementById('track-live-eta');
      const distEl = document.getElementById('track-live-dist');
      if (etaEl) etaEl.textContent = `${liveMetrics.etaMinutes} mins`;
      if (distEl) distEl.textContent = `${liveMetrics.distRemainingKm} km`;
    });
  }
  App.showToast(`GPS Simulation speed set to ${multiplier}x`);
};

window.runMockMLInference = async () => {
  App.showToast("Executing ML inference on model server...", "info");
  const msgEl = document.getElementById('ai-prediction-message');
  if (msgEl) msgEl.innerHTML = `<span class="animate-pulse">Computing real-time crowd predictions...</span>`;

  try {
    const result = await fetchAICrowdPrediction("salem-omalur");
    if (msgEl) {
      msgEl.textContent = `"AI Prediction: Salem → Omalur route expected crowd is ${result.predictedCrowdPercent}% with ${Math.round(result.confidenceScore * 100)}% model confidence. ${result.recommendation}"`;
    }
    App.showToast("AI Prediction updated ✓");
  } catch (err) {
    console.error("[runMockMLInference] Inference failure:", err);
    if (msgEl) {
      msgEl.textContent = `"AI Prediction fallback: High congestion likely during evening commute peak hours."`;
    }
    App.showToast("Inference completed via fallback engine", "warning");
  }
};

window.clearAlerts = () => {
  StorageManager.clearAllAlerts();
  App.renderAlertView();
  App.showToast("All notifications cleared ✓", "info");
};

window.saveNotifPreferences = () => {
  App.showToast("Notification preferences saved ✓");
};

// Export to module for automated unit testing environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { App };
}
