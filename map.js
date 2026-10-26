/**
 * SmartBus AI - Leaflet GIS Map & Real-time GPS Simulation Engine
 * 
 * @module map
 * @description Controls interactive cartographic visualizations, dark map styling,
 * marker cluster pins, and geodesic path interpolation for live bus tracking.
 * 
 * Technical Design & Error Boundaries:
 * - Employs CartoDB Dark Matter tiles for high visual contrast with minimal eye fatigue.
 * - Handles CDN failures gracefully: if window.L is missing, falls back to a clean semantic SVG map card.
 * - Manages memory by tearing down previous Leaflet map instances and clearing interval timers before re-initializing.
 * - Provides linear interpolation along multi-segment polylines with boundary checks.
 */

/** Active Leaflet map instance for the Location page */
let locationMap = null;

/** Active Leaflet map instance for the Real-time Bus Tracking page */
let trackMap = null;

/** Array of active bus stand marker references for lookup and popup triggers */
let locationMarkers = [];

/** Active moving bus marker instance on the tracking map */
let trackingBusMarker = null;

/** Active route polyline vector on the tracking map */
let trackingPolyline = null;

/** Animation interval timer reference for real-time motion ticks */
let trackingAnimTimer = null;

/**
 * Map Engine Namespace
 */
const MapEngine = {
  /**
   * Initializes the Town Bus Stands directory map.
   * 
   * @param {string} containerId - DOM ID of map canvas container
   * @param {Array<Object>} stands - Array of bus stand metadata objects
   * @param {string} selectedStandId - Identifier of stand to highlight and center
   * @param {Function} [onSelectStandCallback] - Callback invoked when a user clicks a pin
   */
  initLocationMap: function(containerId, stands, selectedStandId, onSelectStandCallback) {
    try {
      const container = document.getElementById(containerId);
      if (!container) {
        console.warn(`[Map Error Boundary] Container #${containerId} not found in DOM.`);
        return;
      }

      // Memory leak guard: Clean up existing instance before recreating
      if (locationMap) {
        try {
          locationMap.remove();
        } catch (e) { /* ignore cleanup error */ }
        locationMap = null;
      }

      const selectedStand = stands.find(s => s.id === selectedStandId) || stands[0];
      const initialLat = selectedStand ? selectedStand.lat : 11.6643;
      const initialLng = selectedStand ? selectedStand.lng : 78.1460;

      // Check if Leaflet CDN library is loaded
      if (typeof window.L !== 'undefined') {
        locationMap = L.map(containerId, {
          zoomControl: true,
          attributionControl: false
        }).setView([initialLat, initialLng], 11);

        // Dark Matter tiles for nighttime/dark dashboard aesthetics
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd'
        }).addTo(locationMap);

        locationMarkers = [];

        stands.forEach(stand => {
          const isSelected = stand.id === selectedStandId;
          const crowdInfo = calculateCrowdStatus(
            Math.round(stand.passengerCapacity * (stand.currentCrowdPercent / 100)),
            stand.passengerCapacity
          );
          
          // Custom SVG glowing map pin
          const customIcon = L.divIcon({
            className: 'custom-map-pin',
            html: `
              <div class="relative flex items-center justify-center cursor-pointer transform hover:scale-110 transition-transform">
                <div class="w-9 h-9 rounded-full ${isSelected ? 'bg-indigo-600 ring-4 ring-indigo-400/50' : 'bg-slate-800 border border-slate-600'} flex items-center justify-center text-white shadow-xl">
                  <i class="fas fa-bus text-xs ${isSelected ? 'text-white' : 'text-indigo-400'}"></i>
                </div>
                <div class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ${crowdInfo.status === 'FULL' ? 'bg-rose-500' : crowdInfo.status === 'MODERATE' ? 'bg-amber-500' : 'bg-emerald-500'} border-2 border-slate-900"></div>
              </div>
            `,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
          });

          const marker = L.marker([stand.lat, stand.lng], { icon: customIcon }).addTo(locationMap);

          const popupContent = `
            <div class="p-1 min-w-[200px]">
              <div class="text-xs font-semibold text-indigo-400 uppercase tracking-wider">${stand.city}</div>
              <div class="text-sm font-bold text-white mt-0.5">${stand.name}</div>
              <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-700/60">
                <span class="text-slate-400">Crowd Level:</span>
                <span class="font-bold px-2 py-0.5 rounded text-[10px] ${crowdInfo.badgeColor}">${stand.currentCrowdPercent}% (${stand.status})</span>
              </div>
              <div class="flex items-center justify-between text-xs mt-1">
                <span class="text-slate-400">Active Buses:</span>
                <span class="font-semibold text-slate-200">${stand.activeBuses} Buses</span>
              </div>
              <button onclick="window.selectBusStandFromMap('${stand.id}')" class="mt-3 w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors">
                Select This Stand
              </button>
            </div>
          `;

          marker.bindPopup(popupContent);

          if (isSelected) {
            marker.openPopup();
          }

          marker.on('click', () => {
            if (onSelectStandCallback) onSelectStandCallback(stand.id);
          });

          locationMarkers.push({ id: stand.id, marker });
        });
      } else {
        // Fallback UI if Leaflet CDN failed to load
        this.renderFallbackMap(container, stands);
      }
    } catch (error) {
      console.error("[Map Error Boundary] Error initializing Location map:", error);
      const container = document.getElementById(containerId);
      if (container) this.renderFallbackMap(container, stands);
    }
  },

  /**
   * Smoothly pans and zooms the location map to a targeted stand.
   * 
   * @param {Object} stand - Stand entity with lat and lng coordinates
   */
  focusLocationStand: function(stand) {
    try {
      if (locationMap && typeof window.L !== 'undefined') {
        locationMap.flyTo([stand.lat, stand.lng], 13, { duration: 1.2 });
        const target = locationMarkers.find(m => m.id === stand.id);
        if (target) target.marker.openPopup();
      }
    } catch (err) {
      console.warn("[Map Error Boundary] Could not pan map to stand:", err);
    }
  },

  /**
   * Initializes the animated real-time GPS tracking simulation map.
   * 
   * @param {string} containerId - DOM ID of tracking canvas
   * @param {Object} bus - Active bus entity with routeWaypoints and speedKm
   * @param {number} [speedMultiplier=1] - Simulation playback speed (1x, 2x, 5x)
   * @param {Function} [onProgressUpdateCallback] - Progress tick callback emitting ETA & distance
   */
  initTrackMap: function(containerId, bus, speedMultiplier = 1, onProgressUpdateCallback) {
    try {
      const container = document.getElementById(containerId);
      if (!container) return;

      // Stop any existing tracking timer loop
      this.stopTrackingTimer();

      if (trackMap) {
        try {
          trackMap.remove();
        } catch (e) { /* ignore */ }
        trackMap = null;
      }

      const waypoints = (bus && bus.routeWaypoints && bus.routeWaypoints.length > 0)
        ? bus.routeWaypoints
        : [[11.6643, 78.1460], [11.7410, 78.0425]];

      let currentProgress = (bus && typeof bus.currentProgress === 'number') ? bus.currentProgress : 0.3;

      if (typeof window.L !== 'undefined') {
        trackMap = L.map(containerId, {
          zoomControl: true,
          attributionControl: false
        }).setView(waypoints[0], 12);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd'
        }).addTo(trackMap);

        // Glowing indigo route corridor polyline
        trackingPolyline = L.polyline(waypoints, {
          color: '#6366f1',
          weight: 5,
          opacity: 0.8,
          dashArray: '8, 8'
        }).addTo(trackMap);

        trackMap.fitBounds(trackingPolyline.getBounds(), { padding: [40, 40] });

        // Origin and Destination endpoint pins
        const startPin = L.divIcon({
          className: 'start-pin',
          html: '<div class="w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-lg">A</div>',
          iconSize: [24, 24]
        });
        const endPin = L.divIcon({
          className: 'end-pin',
          html: '<div class="w-6 h-6 rounded-full bg-rose-500 border-2 border-white flex items-center justify-center text-white text-[10px] font-bold shadow-lg">B</div>',
          iconSize: [24, 24]
        });

        L.marker(waypoints[0], { icon: startPin }).addTo(trackMap).bindTooltip("Origin Stand");
        L.marker(waypoints[waypoints.length - 1], { icon: endPin }).addTo(trackMap).bindTooltip("Destination Stand");

        // Real-time animated bus marker with radar ping
        const busIcon = L.divIcon({
          className: 'animated-bus-icon',
          html: `
            <div class="relative flex items-center justify-center">
              <div class="absolute w-12 h-12 bg-indigo-500/30 rounded-full animate-ping"></div>
              <div class="w-10 h-10 bg-indigo-600 border-2 border-white rounded-full flex items-center justify-center text-white shadow-2xl z-10">
                <i class="fas fa-bus text-sm"></i>
              </div>
              <div class="absolute -bottom-6 bg-slate-900/90 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-700 shadow whitespace-nowrap">
                ${bus.busNumber || 'Bus'} (Live)
              </div>
            </div>
          `,
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const initialCoord = interpolatePolyline(waypoints, currentProgress);
        trackingBusMarker = L.marker(initialCoord, { icon: busIcon }).addTo(trackMap);

        // Simulation movement interval tick
        trackingAnimTimer = setInterval(() => {
          currentProgress += 0.003 * speedMultiplier;
          if (currentProgress > 0.98) currentProgress = 0.02; // Loop simulation continuously

          const newPos = interpolatePolyline(waypoints, currentProgress);
          if (trackingBusMarker) {
            trackingBusMarker.setLatLng(newPos);
          }

          const totalDistKm = 24.5;
          const distRemaining = (totalDistKm * (1 - currentProgress)).toFixed(1);
          const busSpeed = (bus && bus.speedKm) || 45;
          const etaMinutes = Math.max(1, Math.round((distRemaining / busSpeed) * 60));

          if (onProgressUpdateCallback) {
            onProgressUpdateCallback({
              progressPercent: Math.round(currentProgress * 100),
              distRemainingKm: distRemaining,
              etaMinutes
            });
          }
        }, 1000);
      } else {
        container.innerHTML = `
          <div class="w-full h-full flex flex-col items-center justify-center bg-slate-900/80 p-6 text-center rounded-xl border border-slate-800">
            <i class="fas fa-satellite-dish text-4xl text-indigo-400 mb-3 animate-pulse"></i>
            <h4 class="text-lg font-bold text-white">Live GPS Tracker: ${bus.busNumber || 'Fleet Bus'}</h4>
            <p class="text-xs text-slate-400 mt-1 max-w-md">Simulated live movement along route ${bus.routeName || ''}.</p>
          </div>
        `;
      }
    } catch (err) {
      console.error("[Map Error Boundary] Tracking map initialization failed:", err);
    }
  },

  /**
   * Stops the active GPS tracking animation timer.
   */
  stopTrackingTimer: function() {
    if (trackingAnimTimer) {
      clearInterval(trackingAnimTimer);
      trackingAnimTimer = null;
    }
  },

  /**
   * Renders fallback UI if map CDN or WebGL context fails.
   * 
   * @param {HTMLElement} container - DOM container element
   * @param {Array<Object>} stands - Stands dataset
   */
  renderFallbackMap: function(container, stands) {
    if (!container) return;
    container.innerHTML = `
      <div class="w-full h-full flex flex-col items-center justify-center bg-slate-900/80 p-6 text-center rounded-xl border border-slate-800">
        <i class="fas fa-map-marked-alt text-4xl text-indigo-400 mb-3"></i>
        <h4 class="text-lg font-bold text-white">Interactive Transport Map</h4>
        <p class="text-xs text-slate-400 mt-1 max-w-md">Showing simulated locations for ${stands.length} town bus stands in Salem and neighboring regions.</p>
        <div class="mt-4 flex flex-wrap gap-2 justify-center">
          ${stands.map(s => `
            <span class="px-3 py-1 bg-slate-800 rounded-lg text-xs border border-slate-700 text-indigo-300">${s.name} (${s.currentCrowdPercent}%)</span>
          `).join('')}
        </div>
      </div>
    `;
  }
};

/**
 * Geodesic Linear Polyline Interpolator
 * Computes exact coordinate [lat, lng] along an arbitrary multi-segment polyline path.
 * 
 * Boundary handling:
 * - Empty array returns default Salem coordinates.
 * - Single point returns the point itself.
 * - Progress values are strictly clamped between 0.0 and 1.0.
 * 
 * @param {Array<Array<number>>} waypoints - Array of [lat, lng] coordinate pairs
 * @param {number} progress - Float progress value between 0.0 and 1.0
 * @returns {Array<number>} Interpolated [lat, lng] position
 */
function interpolatePolyline(waypoints, progress) {
  if (!waypoints || !Array.isArray(waypoints) || waypoints.length === 0) {
    return [11.6643, 78.1460];
  }
  if (waypoints.length === 1) {
    return waypoints[0];
  }

  const totalSegments = waypoints.length - 1;
  const clampedProgress = Math.max(0, Math.min(1, Number(progress) || 0));
  const scaledProgress = clampedProgress * totalSegments;
  const segmentIndex = Math.min(Math.floor(scaledProgress), totalSegments - 1);
  const segmentFactor = scaledProgress - segmentIndex;

  const p1 = waypoints[segmentIndex];
  const p2 = waypoints[segmentIndex + 1];

  const lat = p1[0] + (p2[0] - p1[0]) * segmentFactor;
  const lng = p1[1] + (p2[1] - p1[1]) * segmentFactor;

  return [lat, lng];
}
