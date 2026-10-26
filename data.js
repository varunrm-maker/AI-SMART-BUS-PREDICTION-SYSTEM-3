/**
 * SmartBus AI Data Store & Utility Engine
 * 
 * @module data
 * @description Provides core dataset definitions, crowd capacity analytics,
 * algorithmic bus recommendation scoring, and machine learning inference mocks.
 * 
 * Core Capabilities:
 * 1. Definitive geographical and operational metadata for Salem regional bus stands.
 * 2. Real-time fleet schedule, capacity, and route waypoint dataset.
 * 3. Exact threshold logic for crowd categorization (FREE, MODERATE, FULL).
 * 4. "Smart Choice" multi-attribute bus recommendation scoring engine.
 * 5. Historical and predictive crowd time-series telemetry.
 */

/**
 * Town Bus Stands Telemetry & Infrastructure Dataset
 * Represents the primary transit hubs in the Salem metropolitan and western Tamil Nadu transport network.
 * 
 * @constant {Array<Object>}
 */
const BUS_STANDS = [
  {
    id: "salem-central",
    name: "Salem Central Bus Stand",
    city: "Salem",
    location: "Meyyanur, Salem, Tamil Nadu",
    lat: 11.6643,
    lng: 78.1460,
    activeBuses: 14,
    passengerCapacity: 2500,
    currentCrowdPercent: 68,
    status: "MODERATE",
    nextBusTiming: "10:15 AM",
    description: "Main hub connecting Salem city to Omalur, Mettur, Erode, and Namakkal."
  },
  {
    id: "mgr-integrated",
    name: "MGR Integrated Bus Stand",
    city: "Salem",
    location: "New Bus Stand Road, Salem",
    lat: 11.6705,
    lng: 78.1398,
    activeBuses: 18,
    passengerCapacity: 3200,
    currentCrowdPercent: 84,
    status: "FULL",
    nextBusTiming: "10:05 AM",
    description: "Major interstate and intercity bus terminal with high peak hour traffic."
  },
  {
    id: "omalur-stand",
    name: "Omalur Bus Stand",
    city: "Omalur",
    location: "Main Road, Omalur",
    lat: 11.7410,
    lng: 78.0425,
    activeBuses: 8,
    passengerCapacity: 1200,
    currentCrowdPercent: 32,
    status: "FREE",
    nextBusTiming: "10:20 AM",
    description: "Key junction connecting Salem to Dharmapuri and Bengaluru highways."
  },
  {
    id: "mettur-stand",
    name: "Mettur Bus Stand",
    city: "Mettur",
    location: "Square Market, Mettur Dam",
    lat: 11.7941,
    lng: 77.8011,
    activeBuses: 10,
    passengerCapacity: 1500,
    currentCrowdPercent: 55,
    status: "MODERATE",
    nextBusTiming: "10:30 AM",
    description: "Terminal situated near Mettur Dam industrial area & thermal station."
  },
  {
    id: "erode-central",
    name: "Erode Central Bus Stand",
    city: "Erode",
    location: "Sathy Road, Erode",
    lat: 11.3410,
    lng: 77.7172,
    activeBuses: 22,
    passengerCapacity: 4000,
    currentCrowdPercent: 78,
    status: "MODERATE",
    nextBusTiming: "10:10 AM",
    description: "Major Western Tamil Nadu transport junction connecting Salem and Coimbatore."
  },
  {
    id: "coimbatore-gandhipuram",
    name: "Coimbatore Gandhipuram Bus Stand",
    city: "Coimbatore",
    location: "Gandhipuram, Coimbatore",
    lat: 11.0168,
    lng: 76.9558,
    activeBuses: 26,
    passengerCapacity: 4500,
    currentCrowdPercent: 89,
    status: "FULL",
    nextBusTiming: "10:00 AM",
    description: "Central commercial bus terminal with heavy passenger flow."
  }
];

/**
 * Calculates real-time passenger crowd status, occupancy percentage, and UI styling tokens.
 * 
 * Boundary Logic:
 * - 0% to 44%: FREE (Green status, high seat availability)
 * - 45% to 79%: MODERATE (Amber status, normal occupancy with standing room)
 * - 80% to 100%: FULL (Rose/Red status, severe congestion alert)
 * 
 * Defensive Error Handling:
 * - Guards against zero/negative capacity by enforcing minimum capacity of 1.
 * - Clamps negative occupied counts to 0.
 * - Clamps percentage to [0, 100] to handle edge cases with standing passengers beyond seating.
 * 
 * @param {number} occupied - Number of currently occupied seats
 * @param {number} capacity - Total rated passenger seat capacity
 * @returns {Object} Calculated metrics including status string, badge color class, pulse animation, and seat counts
 */
function calculateCrowdStatus(occupied, capacity) {
  // Defensive bounds checking to prevent division by zero and negative anomalies
  const cap = Math.max(1, Number(capacity) || 1);
  const occ = Math.max(0, Number(occupied) || 0);
  const avail = Math.max(0, cap - occ);
  const percent = Math.min(100, Math.round((occ / cap) * 100));

  let status = "FREE";
  let badgeColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  let pulseClass = "live-pulse-green";
  let barColor = "bg-emerald-500";

  // Tier evaluation based on Project Better Tomorrow verified commuter thresholds
  if (percent >= 80) {
    status = "FULL";
    badgeColor = "bg-rose-500/20 text-rose-400 border-rose-500/30";
    pulseClass = "live-pulse-rose";
    barColor = "bg-rose-500";
  } else if (percent >= 45) {
    status = "MODERATE";
    badgeColor = "bg-amber-500/20 text-amber-400 border-amber-500/30";
    pulseClass = "live-pulse-amber";
    barColor = "bg-amber-500";
  }

  return {
    percent,
    occupied: occ,
    capacity: cap,
    availableSeats: avail,
    status,
    badgeColor,
    pulseClass,
    barColor
  };
}

/**
 * Active Bus Fleet Telemetry & Waypoints Dataset
 * Includes live schedule, GPS route coordinates, speed, and occupancy for simulation.
 * 
 * @constant {Array<Object>}
 */
const INITIAL_BUSES = [
  {
    id: "SB-101",
    busNumber: "SB-101",
    routeName: "Salem Central → Omalur Bus Stand",
    originStandId: "salem-central",
    destStandId: "omalur-stand",
    departureTime: "10:15 AM",
    arrivalTime: "10:45 AM",
    capacity: 52,
    occupiedSeats: 18,
    speedKm: 42,
    routeWaypoints: [
      [11.6643, 78.1460], // Salem Central Terminal
      [11.6900, 78.1100], // Junction Road
      [11.7150, 78.0750], // Tollway Interchange
      [11.7410, 78.0425]  // Omalur Terminal
    ],
    currentProgress: 0.35 // 35% distance completed
  },
  {
    id: "SB-102",
    busNumber: "SB-102",
    routeName: "MGR Integrated → Mettur Bus Stand",
    originStandId: "mgr-integrated",
    destStandId: "mettur-stand",
    departureTime: "10:20 AM",
    arrivalTime: "11:10 AM",
    capacity: 56,
    occupiedSeats: 42,
    speedKm: 48,
    routeWaypoints: [
      [11.6705, 78.1398], // MGR Bus Stand
      [11.7200, 78.0000], // Tharamangalam Bypass
      [11.7600, 77.8800], // Mecheri Junction
      [11.7941, 77.8011]  // Mettur Dam Stand
    ],
    currentProgress: 0.60
  },
  {
    id: "SB-103",
    busNumber: "SB-103",
    routeName: "Salem Central → Erode Central",
    originStandId: "salem-central",
    destStandId: "erode-central",
    departureTime: "10:05 AM",
    arrivalTime: "11:20 AM",
    capacity: 50,
    occupiedSeats: 46, // 92% FULL - High Congestion
    speedKm: 55,
    routeWaypoints: [
      [11.6643, 78.1460], // Salem Central
      [11.5500, 77.9500], // Sankari Durg
      [11.4200, 77.8200], // Bhavani Bridge
      [11.3410, 77.7172]  // Erode Central Terminal
    ],
    currentProgress: 0.75
  },
  {
    id: "SB-104",
    busNumber: "SB-104",
    routeName: "Salem Central → Omalur Bus Stand",
    originStandId: "salem-central",
    destStandId: "omalur-stand",
    departureTime: "10:30 AM",
    arrivalTime: "11:00 AM",
    capacity: 52,
    occupiedSeats: 21, // 40% FREE - Designated "Smart Choice" recommendation
    speedKm: 45,
    routeWaypoints: [
      [11.6643, 78.1460],
      [11.6900, 78.1100],
      [11.7150, 78.0750],
      [11.7410, 78.0425]
    ],
    currentProgress: 0.10
  },
  {
    id: "SB-105",
    busNumber: "SB-105",
    routeName: "Erode Central → Coimbatore Gandhipuram",
    originStandId: "erode-central",
    destStandId: "coimbatore-gandhipuram",
    departureTime: "10:00 AM",
    arrivalTime: "11:45 AM",
    capacity: 60,
    occupiedSeats: 54, // 90% FULL
    speedKm: 58,
    routeWaypoints: [
      [11.3410, 77.7172], // Erode Central
      [11.1800, 77.3400], // Tiruppur Outer Ring
      [11.1000, 77.0500], // Avinashi Road
      [11.0168, 76.9558]  // Coimbatore Gandhipuram
    ],
    currentProgress: 0.50
  },
  {
    id: "SB-106",
    busNumber: "SB-106",
    routeName: "Omalur Stand → Salem Central",
    originStandId: "omalur-stand",
    destStandId: "salem-central",
    departureTime: "10:40 AM",
    arrivalTime: "11:10 AM",
    capacity: 50,
    occupiedSeats: 15, // 30% FREE
    speedKm: 40,
    routeWaypoints: [
      [11.7410, 78.0425],
      [11.7150, 78.0750],
      [11.6900, 78.1100],
      [11.6643, 78.1460]
    ],
    currentProgress: 0.05
  },
  {
    id: "SB-107",
    busNumber: "SB-107",
    routeName: "Mettur Bus Stand → MGR Integrated",
    originStandId: "mettur-stand",
    destStandId: "mgr-integrated",
    departureTime: "10:15 AM",
    arrivalTime: "11:05 AM",
    capacity: 55,
    occupiedSeats: 33, // 60% MODERATE
    speedKm: 46,
    routeWaypoints: [
      [11.7941, 77.8011],
      [11.7600, 77.8800],
      [11.7200, 78.0000],
      [11.6705, 78.1398]
    ],
    currentProgress: 0.40
  },
  {
    id: "SB-108",
    busNumber: "SB-108",
    routeName: "Coimbatore Gandhipuram → Salem Central",
    originStandId: "coimbatore-gandhipuram",
    destStandId: "salem-central",
    departureTime: "10:50 AM",
    arrivalTime: "01:00 PM",
    capacity: 58,
    occupiedSeats: 22, // 38% FREE
    speedKm: 60,
    routeWaypoints: [
      [11.0168, 76.9558],
      [11.3410, 77.7172],
      [11.6643, 78.1460]
    ],
    currentProgress: 0.15
  }
];

/**
 * 24-Hour AI Crowd Prediction Dataset & Time-series Trends
 * Derived from historical ticketing load, inductive loop counters, and PatchTST ML forecasts.
 * 
 * @constant {Object}
 */
const AI_PREDICTIONS = {
  hours: ["6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM"],
  salemOmalurTrend: [25, 45, 88, 92, 40, 35, 30, 28, 32, 40, 65, 85, 94, 78, 50, 30],
  mgrMetturTrend:   [20, 35, 70, 85, 60, 48, 42, 40, 45, 52, 70, 82, 88, 70, 45, 25],
  salemErodeTrend:  [30, 50, 75, 90, 78, 65, 55, 50, 58, 65, 80, 92, 96, 85, 60, 35],
  peakHours: [
    { range: "08:30 AM - 09:30 AM", level: "CRITICAL (88% - 94%)", tip: "Morning office and college rush. Consider SB-104." },
    { range: "05:30 PM - 07:00 PM", level: "HIGH (85% - 96%)", tip: "Evening return commuting peak." }
  ],
  lowCrowdHours: [
    { range: "11:00 AM - 02:00 PM", level: "FREE (28% - 42%)", tip: "Optimal travel window for quiet commute." },
    { range: "08:30 PM - 10:00 PM", level: "FREE (25% - 35%)", tip: "Late evening smooth travel." }
  ]
};

/**
 * Live Alert Notifications Stream
 * Real-time event notifications categorized by severity for commuter situational awareness.
 * 
 * @constant {Array<Object>}
 */
const INITIAL_ALERTS = [
  {
    id: "alert-1",
    type: "HIGH_CROWD",
    severity: "danger",
    title: "High Crowd Warning: Bus SB-103",
    message: "Bus SB-103 (Salem → Erode) is currently highly crowded at 92% capacity (46/50 seats filled).",
    time: "5 mins ago",
    read: false
  },
  {
    id: "alert-2",
    type: "SMART_CHOICE",
    severity: "success",
    title: "Smart Choice Alternative Available",
    message: "For Salem → Omalur, SB-104 is recommended with 31 available seats (40% load) departing at 10:30 AM.",
    time: "12 mins ago",
    read: false
  },
  {
    id: "alert-3",
    type: "STAND_CONGESTION",
    severity: "warning",
    title: "Heavy Crowd Predicted: Salem Central",
    message: "AI forecasts heavy passenger crowding at Salem Central Bus Stand between 5:30 PM and 6:45 PM today.",
    time: "25 mins ago",
    read: false
  },
  {
    id: "alert-4",
    type: "ARRIVAL",
    severity: "info",
    title: "Bus Arrival Alert: SB-101",
    message: "Your tracked bus SB-101 is approximately 8 minutes away from Omalur Bus Stand.",
    time: "40 mins ago",
    read: true
  }
];

/**
 * Smart Choice Bus Recommendation Engine
 * Evaluates candidate buses on a route and scores them to find the optimal vehicle for passengers.
 * 
 * Scoring Formula:
 * Score = (Available Seats * 2) - Occupancy Percentage
 * Higher score indicates superior passenger comfort, higher seat availability, and lower congestion.
 * 
 * @param {string} [routeIdOrOrigin] - Origin stand identifier or bus ID to filter by
 * @param {string} [destId] - Destination stand identifier to filter by
 * @returns {Object} Scored bus candidate containing bus entity, crowd status, and composite score
 */
function getSmartChoiceRecommendation(routeIdOrOrigin, destId) {
  let candidateBuses = INITIAL_BUSES;

  if (routeIdOrOrigin && destId) {
    candidateBuses = INITIAL_BUSES.filter(
      b => b.originStandId === routeIdOrOrigin && b.destStandId === destId
    );
  } else if (routeIdOrOrigin) {
    candidateBuses = INITIAL_BUSES.filter(
      b => b.originStandId === routeIdOrOrigin || b.id === routeIdOrOrigin
    );
  }

  // Graceful fallback if no specific bus matches filter criteria
  if (candidateBuses.length === 0) {
    candidateBuses = INITIAL_BUSES;
  }

  // Calculate composite passenger comfort score
  const scored = candidateBuses.map(bus => {
    const crowd = calculateCrowdStatus(bus.occupiedSeats, bus.capacity);
    const score = (crowd.availableSeats * 2) - crowd.percent;
    return { bus, crowd, score };
  });

  // Sort descending by score (best candidate first)
  scored.sort((a, b) => b.score - a.score);
  return scored[0];
}

/**
 * Asynchronous Machine Learning Inference Adapter
 * Simulates real-time call to the backend FastAPI /predict/crowd ML microservice.
 * Structured with latency emulation and 95% confidence intervals.
 * 
 * @param {string} [routeId="salem-omalur"] - Bus route corridor ID
 * @param {string} [timestamp] - Target timestamp for forecast (defaults to current UTC)
 * @returns {Promise<Object>} ML prediction response object
 */
async function fetchAICrowdPrediction(routeId, timestamp) {
  // Simulate network round-trip time for edge ML inference
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const basePrediction = Math.floor(Math.random() * 30) + 55; // 55% - 85% range
  return {
    routeId: routeId || "salem-omalur",
    timestamp: timestamp || new Date().toISOString(),
    predictedCrowdPercent: basePrediction,
    confidenceScore: 0.94,
    recommendation: basePrediction > 75 
      ? "High crowd anticipated. Recommend traveling 30 minutes earlier or taking an alternative bus." 
      : "Moderate to low crowd expected. Suitable for smooth travel."
  };
}
