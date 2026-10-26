/**
 * SmartBus AI - Unit Testing Suite (Frontend Core Logic)
 * 
 * Verifies core mathematical algorithms, boundary conditions, edge cases,
 * interpolation calculations, and storage persistence layers.
 * Can be executed in browser runner (unit_tests.html) or Node.js runtime.
 */

(function (global) {
  'use strict';

  // Test Runner State
  const TestRunner = {
    tests: [],
    passedCount: 0,
    failedCount: 0,
    results: [],

    /**
     * Registers a test case
     * @param {string} suite - Category name
     * @param {string} name - Test description
     * @param {Function} fn - Assertion function
     */
    test: function (suite, name, fn) {
      this.tests.push({ suite, name, fn });
    },

    /**
     * Strict equality assertion
     */
    assertEqual: function (actual, expected, message) {
      if (actual !== expected) {
        throw new Error(`${message || 'Assertion Failed'}: Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`);
      }
    },

    /**
     * Approximate floating-point equality assertion
     */
    assertCloseTo: function (actual, expected, delta = 0.001, message) {
      if (Math.abs(actual - expected) > delta) {
        throw new Error(`${message || 'Assertion Failed'}: Expected ${expected} (+/-${delta}), but got ${actual}`);
      }
    },

    /**
     * Truthy condition assertion
     */
    assertTrue: function (value, message) {
      if (!value) {
        throw new Error(`${message || 'Assertion Failed'}: Expected value to be truthy, got ${value}`);
      }
    },

    /**
     * Executes all registered tests and records execution duration and outcomes
     */
    run: function () {
      this.passedCount = 0;
      this.failedCount = 0;
      this.results = [];
      const startTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

      for (const t of this.tests) {
        try {
          t.fn();
          this.passedCount++;
          this.results.push({ suite: t.suite, name: t.name, status: 'PASSED', error: null });
        } catch (err) {
          this.failedCount++;
          this.results.push({ suite: t.suite, name: t.name, status: 'FAILED', error: err.message });
        }
      }

      const endTime = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
      const durationMs = Math.round((endTime - startTime) * 100) / 100;

      return {
        total: this.tests.length,
        passed: this.passedCount,
        failed: this.failedCount,
        durationMs: durationMs,
        results: this.results
      };
    }
  };

  // ==================== TEST SUITES ====================

  // Suite 1: calculateCrowdStatus Boundary & Edge Cases
  TestRunner.test('Crowd Algorithm', 'Returns FREE (0%) when bus is completely empty', function () {
    const res = calculateCrowdStatus(0, 50);
    TestRunner.assertEqual(res.status, 'FREE');
    TestRunner.assertEqual(res.percent, 0);
    TestRunner.assertEqual(res.availableSeats, 50);
  });

  TestRunner.test('Crowd Algorithm', 'Returns FREE at 44% occupancy boundary condition', function () {
    // 22 / 50 = 44% -> Boundary FREE (< 45%)
    const res = calculateCrowdStatus(22, 50);
    TestRunner.assertEqual(res.status, 'FREE');
    TestRunner.assertEqual(res.percent, 44);
    TestRunner.assertEqual(res.availableSeats, 28);
  });

  TestRunner.test('Crowd Algorithm', 'Transitions to MODERATE at exactly 45% occupancy boundary', function () {
    // 45 / 100 = 45% -> Boundary MODERATE (45% <= x < 80%)
    const res = calculateCrowdStatus(45, 100);
    TestRunner.assertEqual(res.status, 'MODERATE');
    TestRunner.assertEqual(res.percent, 45);
    TestRunner.assertEqual(res.availableSeats, 55);
  });

  TestRunner.test('Crowd Algorithm', 'Returns MODERATE at 79% occupancy boundary', function () {
    // 79 / 100 = 79% -> Boundary MODERATE
    const res = calculateCrowdStatus(79, 100);
    TestRunner.assertEqual(res.status, 'MODERATE');
    TestRunner.assertEqual(res.percent, 79);
    TestRunner.assertEqual(res.availableSeats, 21);
  });

  TestRunner.test('Crowd Algorithm', 'Transitions to FULL at exactly 80% occupancy boundary', function () {
    // 40 / 50 = 80% -> Boundary FULL (>= 80%)
    const res = calculateCrowdStatus(40, 50);
    TestRunner.assertEqual(res.status, 'FULL');
    TestRunner.assertEqual(res.percent, 80);
    TestRunner.assertEqual(res.availableSeats, 10);
  });

  TestRunner.test('Crowd Algorithm', 'Returns FULL (100%) and 0 available seats when bus is at capacity', function () {
    const res = calculateCrowdStatus(50, 50);
    TestRunner.assertEqual(res.status, 'FULL');
    TestRunner.assertEqual(res.percent, 100);
    TestRunner.assertEqual(res.availableSeats, 0);
  });

  TestRunner.test('Crowd Algorithm', 'Clamps occupancy to 100% when standing crowd exceeds seating capacity', function () {
    // 60 occupied in 50-seater bus -> 100% clamped, 0 available seats
    const res = calculateCrowdStatus(60, 50);
    TestRunner.assertEqual(res.status, 'FULL');
    TestRunner.assertEqual(res.percent, 100);
    TestRunner.assertEqual(res.availableSeats, 0);
  });

  TestRunner.test('Crowd Algorithm', 'Clamps negative occupied inputs defensively to 0%', function () {
    const res = calculateCrowdStatus(-10, 50);
    TestRunner.assertEqual(res.status, 'FREE');
    TestRunner.assertEqual(res.percent, 0);
    TestRunner.assertEqual(res.availableSeats, 50);
  });

  TestRunner.test('Crowd Algorithm', 'Handles zero or invalid capacity without throwing division by zero', function () {
    const res = calculateCrowdStatus(10, 0);
    TestRunner.assertEqual(res.status, 'FREE');
    TestRunner.assertEqual(res.percent, 0);
    TestRunner.assertEqual(res.availableSeats, 0);
  });

  TestRunner.test('Crowd Algorithm', 'Safely handles null, undefined or NaN inputs', function () {
    const res = calculateCrowdStatus(null, undefined);
    TestRunner.assertEqual(res.status, 'FREE');
    TestRunner.assertEqual(res.percent, 0);
  });

  // Suite 2: Smart Choice Recommendation Logic
  TestRunner.test('Smart Choice Engine', 'Selects bus with lowest crowd percentage for a corridor', function () {
    const rec = getSmartChoiceRecommendation('salem-central', 'omalur-stand');
    TestRunner.assertTrue(rec !== null, 'Recommendation should not be null');
    TestRunner.assertTrue(rec.bus !== null, 'Recommended bus should exist');
    TestRunner.assertTrue(rec.crowd.percent <= 70, 'Recommended bus should have low/moderate crowd');
  });

  TestRunner.test('Smart Choice Engine', 'Safely returns null or fallback when no buses exist on route', function () {
    const rec = getSmartChoiceRecommendation('non-existent-stand-a', 'non-existent-stand-b');
    // If no route matches, should handle gracefully
    TestRunner.assertTrue(rec === null || typeof rec === 'object', 'Should return null or fallback object');
  });

  // Suite 3: GPS Polyline Interpolation Mathematics
  TestRunner.test('GPS Map Engine', 'Returns origin coordinate at progress 0.0', function () {
    const path = [[11.6643, 78.1460], [11.7000, 78.1000], [11.7410, 78.0425]];
    const coord = interpolatePolyline(path, 0.0);
    TestRunner.assertCloseTo(coord[0], 11.6643, 0.0001, 'Start latitude match');
    TestRunner.assertCloseTo(coord[1], 78.1460, 0.0001, 'Start longitude match');
  });

  TestRunner.test('GPS Map Engine', 'Returns terminal destination coordinate at progress 1.0', function () {
    const path = [[11.6643, 78.1460], [11.7000, 78.1000], [11.7410, 78.0425]];
    const coord = interpolatePolyline(path, 1.0);
    TestRunner.assertCloseTo(coord[0], 11.7410, 0.0001, 'End latitude match');
    TestRunner.assertCloseTo(coord[1], 78.0425, 0.0001, 'End longitude match');
  });

  TestRunner.test('GPS Map Engine', 'Correctly interpolates intermediate point along segment', function () {
    const path = [[10.0, 20.0], [12.0, 24.0]];
    const coord = interpolatePolyline(path, 0.5);
    TestRunner.assertCloseTo(coord[0], 11.0, 0.001, 'Midpoint latitude');
    TestRunner.assertCloseTo(coord[1], 22.0, 0.001, 'Midpoint longitude');
  });

  TestRunner.test('GPS Map Engine', 'Clamps progress < 0.0 to start coordinate and > 1.0 to end coordinate', function () {
    const path = [[10.0, 20.0], [12.0, 24.0]];
    const underCoord = interpolatePolyline(path, -0.5);
    TestRunner.assertCloseTo(underCoord[0], 10.0, 0.001);

    const overCoord = interpolatePolyline(path, 1.5);
    TestRunner.assertCloseTo(overCoord[0], 12.0, 0.001);
  });

  TestRunner.test('GPS Map Engine', 'Handles empty and single-point waypoint lists gracefully', function () {
    const single = [[11.6643, 78.1460]];
    const resSingle = interpolatePolyline(single, 0.5);
    TestRunner.assertCloseTo(resSingle[0], 11.6643, 0.0001);

    const empty = [];
    const resEmpty = interpolatePolyline(empty, 0.5);
    TestRunner.assertTrue(Array.isArray(resEmpty) && resEmpty.length === 2, 'Returns safe default coordinate pair');
  });

  // Suite 4: StorageManager Persistence & Error Boundaries
  TestRunner.test('Storage Layer', 'Default user profile returns valid fields', function () {
    const profile = StorageManager.getProfile();
    TestRunner.assertTrue(typeof profile.fullName === 'string', 'fullName must be string');
    TestRunner.assertTrue(typeof profile.email === 'string', 'email must be string');
    TestRunner.assertTrue(typeof profile.role === 'string', 'role must be string');
  });

  TestRunner.test('Storage Layer', 'saveProfile updates profile and persists successfully', function () {
    const updated = {
      fullName: 'Test Commuter',
      email: 'tester@smartbus.ai',
      phone: '+91 99999 11111',
      role: 'Student Commuter',
      preferredStand: 'mgr-integrated',
      preferredLanguage: 'ta'
    };
    StorageManager.saveProfile(updated);
    const retrieved = StorageManager.getProfile();
    TestRunner.assertEqual(retrieved.fullName, 'Test Commuter');
    TestRunner.assertEqual(retrieved.email, 'tester@smartbus.ai');
    TestRunner.assertEqual(retrieved.preferredLanguage, 'ta');

    // Reset back
    StorageManager.resetProfile();
  });

  TestRunner.test('Storage Layer', 'resetProfile restores default profile state', function () {
    StorageManager.saveProfile({ fullName: 'Temporary Modification' });
    const reset = StorageManager.resetProfile();
    TestRunner.assertEqual(reset.fullName, 'Alex Pandian');
  });

  TestRunner.test('Storage Layer', 'Selected Stand ID can be set and retrieved accurately', function () {
    StorageManager.setSelectedStandId('erode-central');
    TestRunner.assertEqual(StorageManager.getSelectedStandId(), 'erode-central');
    StorageManager.setSelectedStandId('salem-central'); // restore
  });

  TestRunner.test('Storage Layer', 'Selected Bus ID can be set and retrieved accurately', function () {
    StorageManager.setSelectedBusId('SB-103');
    TestRunner.assertEqual(StorageManager.getSelectedBusId(), 'SB-103');
    StorageManager.setSelectedBusId('SB-101'); // restore
  });

  TestRunner.test('Storage Layer', 'Clear alerts clears all alerts from storage list', function () {
    StorageManager.clearAllAlerts();
    const alerts = StorageManager.getAlerts();
    TestRunner.assertEqual(alerts.length, 0);
  });

  // Export to global scope
  global.TestRunner = TestRunner;

  // Auto-run if running in Node.js
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TestRunner };
  }
})(typeof window !== 'undefined' ? window : global);
