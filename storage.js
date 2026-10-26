/**
 * SmartBus AI - LocalStorage & State Persistence Manager
 * 
 * @module storage
 * @description Provides a resilient, error-bounded abstraction layer over browser
 * Web Storage APIs (localStorage and sessionStorage). Includes defensive try/catch
 * guards to prevent application crashes caused by disabled storage, private browsing
 * quota limits, or corrupted JSON strings.
 */

/**
 * Storage namespace keys for isolation and state management
 * @constant {Object.<string, string>}
 */
const STORAGE_KEYS = {
  USER_SESSION: "smartbus_user_session",
  USER_PROFILE: "smartbus_user_profile",
  NOTIF_SETTINGS: "smartbus_notif_settings",
  ALERTS: "smartbus_alerts_data",
  SELECTED_STAND: "smartbus_selected_stand",
  SELECTED_BUS: "smartbus_selected_bus"
};

/**
 * Default fallback user profile when no custom profile is saved
 * @constant {Object}
 */
const DEFAULT_PROFILE = {
  fullName: "Alex Rivera",
  email: "demo@smartbus.ai",
  phone: "+91 98765 43210",
  role: "Daily Commuter",
  preferredStand: "salem-central",
  preferredLanguage: "English",
  notifyCrowd: true,
  notifyArrival: true,
  notifyAlerts: true
};

/**
 * Storage Manager Object
 * Encapsulates safe serialization, retrieval, and error handling for application state.
 */
const StorageManager = {
  /**
   * Checks whether an active authenticated user session exists.
   * Includes error boundary against corrupted storage strings.
   * 
   * @returns {boolean} True if authenticated, false otherwise
   */
  isLoggedIn: function() {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.USER_SESSION) || sessionStorage.getItem(STORAGE_KEYS.USER_SESSION);
      if (!session) return false;
      const parsed = JSON.parse(session);
      return parsed && parsed.loggedIn === true;
    } catch (err) {
      console.warn("[Storage Error Boundary] Corrupted session record detected in storage. Clearing session.", err);
      try {
        localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
        sessionStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      } catch (e) { /* ignore storage cleanup failures */ }
      return false;
    }
  },

  /**
   * Retrieves active authenticated session payload.
   * 
   * @returns {Object|null} Session data object or null if none exists
   */
  getSession: function() {
    try {
      const session = localStorage.getItem(STORAGE_KEYS.USER_SESSION) || sessionStorage.getItem(STORAGE_KEYS.USER_SESSION);
      return session ? JSON.parse(session) : null;
    } catch (err) {
      console.warn("[Storage Error Boundary] Failed parsing session data:", err);
      return null;
    }
  },

  /**
   * Persists an authenticated user session to browser storage.
   * 
   * @param {string} email - Commuter email address
   * @param {string} password - User password (demo credential)
   * @param {boolean} [remember=true] - Whether to use persistent localStorage vs ephemeral sessionStorage
   * @returns {Object} Stored session object
   */
  login: function(email, password, remember = true) {
    try {
      const profile = this.getProfile();
      const sessionData = {
        loggedIn: true,
        email: email || profile.email,
        name: profile.fullName,
        loginTime: new Date().toISOString()
      };
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(sessionData));
      }
      return sessionData;
    } catch (err) {
      console.error("[Storage Error Boundary] Unable to persist user session to storage:", err);
      // Return transient in-memory session if storage fails (e.g., Safari private mode)
      return { loggedIn: true, email: email, name: "User", loginTime: new Date().toISOString() };
    }
  },

  /**
   * Clears all session keys from both local and session storage.
   */
  logout: function() {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      sessionStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    } catch (err) {
      console.warn("[Storage Error Boundary] Error during session logout cleanup:", err);
    }
  },

  /**
   * Retrieves the current user profile, merging stored attributes with default fallbacks.
   * 
   * @returns {Object} Full commuter profile object
   */
  getProfile: function() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      return data ? { ...DEFAULT_PROFILE, ...JSON.parse(data) } : DEFAULT_PROFILE;
    } catch (err) {
      console.warn("[Storage Error Boundary] Profile parse failure. Falling back to DEFAULT_PROFILE:", err);
      return DEFAULT_PROFILE;
    }
  },

  /**
   * Updates and persists changes to the commuter profile.
   * 
   * @param {Object} profileData - Partial or full profile updates
   * @returns {Object} Updated profile object
   */
  saveProfile: function(profileData) {
    try {
      const current = this.getProfile();
      const updated = { ...current, ...profileData };
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.error("[Storage Error Boundary] Failed saving profile to storage:", err);
      return { ...DEFAULT_PROFILE, ...profileData };
    }
  },

  /**
   * Resets the commuter profile back to standard factory defaults.
   * 
   * @returns {Object} Restored default profile
   */
  resetProfile: function() {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(DEFAULT_PROFILE));
    } catch (err) {
      console.warn("[Storage Error Boundary] Could not persist profile reset:", err);
    }
    return DEFAULT_PROFILE;
  },

  /**
   * Retrieves notification alerts from storage or loads initial telemetry seed data.
   * 
   * @returns {Array<Object>} List of alerts
   */
  getAlerts: function() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALERTS);
      return data ? JSON.parse(data) : (typeof INITIAL_ALERTS !== 'undefined' ? INITIAL_ALERTS : []);
    } catch (err) {
      console.warn("[Storage Error Boundary] Failed to parse alerts. Returning seed alerts:", err);
      return typeof INITIAL_ALERTS !== 'undefined' ? INITIAL_ALERTS : [];
    }
  },

  /**
   * Persists an updated list of alerts to storage.
   * 
   * @param {Array<Object>} alertsList - Array of alert objects
   */
  saveAlerts: function(alertsList) {
    try {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alertsList));
    } catch (err) {
      console.error("[Storage Error Boundary] Failed saving alerts stream to storage:", err);
    }
  },

  /**
   * Marks a specific alert as read by ID.
   * 
   * @param {string} alertId - ID of alert to mark as read
   * @returns {Array<Object>} Updated alert list
   */
  markAlertRead: function(alertId) {
    const alerts = this.getAlerts();
    const updated = alerts.map(a => a.id === alertId ? { ...a, read: true } : a);
    this.saveAlerts(updated);
    return updated;
  },

  /**
   * Clears all notification alerts from storage.
   * 
   * @returns {Array} Empty array
   */
  clearAllAlerts: function() {
    try {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify([]));
    } catch (err) {
      console.warn("[Storage Error Boundary] Failed to clear alerts:", err);
    }
    return [];
  },

  /**
   * Retrieves the currently selected bus stand identifier.
   * 
   * @returns {string} Stand identifier (default: "salem-central")
   */
  getSelectedStandId: function() {
    try {
      return localStorage.getItem(STORAGE_KEYS.SELECTED_STAND) || "salem-central";
    } catch (err) {
      return "salem-central";
    }
  },

  /**
   * Persists the commuter's selected bus stand identifier.
   * 
   * @param {string} standId - Bus stand ID
   */
  setSelectedStandId: function(standId) {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_STAND, standId);
    } catch (err) {
      console.warn("[Storage Error Boundary] Failed to persist selected stand ID:", err);
    }
  },

  /**
   * Retrieves the currently selected bus identifier for GPS tracking.
   * 
   * @returns {string} Bus ID (default: "SB-101")
   */
  getSelectedBusId: function() {
    try {
      return localStorage.getItem(STORAGE_KEYS.SELECTED_BUS) || "SB-101";
    } catch (err) {
      return "SB-101";
    }
  },

  /**
   * Persists the active bus ID for real-time tracking.
   * 
   * @param {string} busId - Bus fleet ID
   */
  setSelectedBusId: function(busId) {
    try {
      localStorage.setItem(STORAGE_KEYS.SELECTED_BUS, busId);
    } catch (err) {
      console.warn("[Storage Error Boundary] Failed to persist selected bus ID:", err);
    }
  }
};
