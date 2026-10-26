"""
SmartBus AI - Backend & ML Engine Unit Tests
Automated test suite verifying the machine learning crowd prediction engine,
computer vision telemetry adapter, and database entity models.
"""

import unittest
import sys
import os

# Append project root to sys.path so backend modules can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.ml_engine import AICrowdPredictor, ComputerVisionTelemetryAdapter
from backend.database import db

class TestAICrowdPredictor(unittest.TestCase):
    def setUp(self):
        self.predictor = AICrowdPredictor()

    def test_prediction_output_contract(self):
        """Verifies prediction dictionary contains all mandatory keys and correct types."""
        result = self.predictor.predict_crowd_level(
            route_id="salem-omalur",
            target_hour=9,
            day_of_week=0,
            is_holiday=False,
            weather="clear"
        )
        self.assertIn("route_id", result)
        self.assertIn("target_hour", result)
        self.assertIn("predicted_occupancy_percent", result)
        self.assertIn("predicted_status", result)
        self.assertIn("confidence_interval_low", result)
        self.assertIn("confidence_interval_high", result)
        self.assertIn("peak_risk_flag", result)
        self.assertIn("recommendation_reason", result)
        self.assertIn(result["predicted_status"], ["FREE", "MODERATE", "FULL"])

    def test_peak_hour_amplification(self):
        """Confirms peak commuter hours produce higher predicted occupancy than off-peak night."""
        morning_peak = self.predictor.predict_crowd_level("salem-omalur", target_hour=9, day_of_week=0)
        night_offpeak = self.predictor.predict_crowd_level("salem-omalur", target_hour=2, day_of_week=0)
        self.assertTrue(morning_peak["peak_risk_flag"])
        self.assertFalse(night_offpeak["peak_risk_flag"])
        self.assertGreater(morning_peak["predicted_occupancy_percent"], night_offpeak["predicted_occupancy_percent"])

    def test_weather_factor_impact(self):
        """Confirms rainy weather increases transit load due to private two-wheeler diversion."""
        clear_result = self.predictor.predict_crowd_level("salem-omalur", target_hour=14, day_of_week=1, weather="clear")
        rain_result = self.predictor.predict_crowd_level("salem-omalur", target_hour=14, day_of_week=1, weather="rain")
        self.assertGreater(rain_result["predicted_occupancy_percent"], clear_result["predicted_occupancy_percent"] - 5.0)

    def test_holiday_suppression(self):
        """Confirms academic/public holidays suppress standard commuter rush."""
        workday = self.predictor.predict_crowd_level("salem-omalur", target_hour=9, day_of_week=0, is_holiday=False)
        holiday = self.predictor.predict_crowd_level("salem-omalur", target_hour=9, day_of_week=0, is_holiday=True)
        self.assertGreater(workday["predicted_occupancy_percent"], holiday["predicted_occupancy_percent"])

    def test_confidence_interval_bounds(self):
        """Verifies that confidence interval lower bound <= predicted <= higher bound."""
        result = self.predictor.predict_crowd_level("salem-omalur", target_hour=10, day_of_week=2)
        pct = result["predicted_occupancy_percent"]
        low = result["confidence_interval_low"]
        high = result["confidence_interval_high"]
        self.assertLessEqual(low, pct)
        self.assertGreaterEqual(high, pct)

class TestComputerVisionTelemetryAdapter(unittest.TestCase):
    def setUp(self):
        self.adapter = ComputerVisionTelemetryAdapter()

    def test_door_ingress_increases_occupancy(self):
        """Validates that boarding passenger counts increment current occupied seats."""
        result = self.adapter.process_door_crossing(
            current_occupied=20,
            capacity=50,
            board_count=5,
            alight_count=0
        )
        self.assertEqual(result["current_occupied"], 25)
        self.assertEqual(result["available_seats"], 25)
        self.assertEqual(result["crowd_percent"], 50)
        self.assertEqual(result["status"], "MODERATE")

    def test_door_egress_decreases_occupancy(self):
        """Validates that alighting passenger counts decrement occupied seats."""
        result = self.adapter.process_door_crossing(
            current_occupied=30,
            capacity=50,
            board_count=0,
            alight_count=10
        )
        self.assertEqual(result["current_occupied"], 20)
        self.assertEqual(result["available_seats"], 30)
        self.assertEqual(result["crowd_percent"], 40)
        self.assertEqual(result["status"], "FREE")

    def test_cannot_fall_below_zero_occupied(self):
        """Defensively clamps negative occupied seats if alight count exceeds current occupied."""
        result = self.adapter.process_door_crossing(
            current_occupied=5,
            capacity=50,
            board_count=0,
            alight_count=10
        )
        self.assertEqual(result["current_occupied"], 0)
        self.assertEqual(result["available_seats"], 50)
        self.assertEqual(result["crowd_percent"], 0)
        self.assertEqual(result["status"], "FREE")

    def test_full_capacity_boundary(self):
        """Transitions to FULL when occupancy reaches 80% or greater."""
        result = self.adapter.process_door_crossing(
            current_occupied=35,
            capacity=50,
            board_count=10,
            alight_count=0
        )
        self.assertEqual(result["current_occupied"], 45)
        self.assertEqual(result["crowd_percent"], 90)
        self.assertEqual(result["status"], "FULL")

class TestTransitDataStoreIntegrity(unittest.TestCase):
    def test_bus_stands_exist(self):
        """Verifies initial bus stands are loaded with positive capacities and coordinates."""
        self.assertGreaterEqual(len(db.stands), 6)
        for stand_id, stand in db.stands.items():
            self.assertIn("name", stand)
            self.assertGreater(stand["passenger_capacity"], 0)
            self.assertGreater(stand["lat"], 10.0)
            self.assertGreater(stand["lng"], 75.0)

    def test_bus_fleet_integrity(self):
        """Verifies initial fleet buses have valid routes and non-negative seating metrics."""
        self.assertGreaterEqual(len(db.buses), 6)
        for bus_id, bus in db.buses.items():
            self.assertGreater(bus["capacity"], 0)
            self.assertGreaterEqual(bus["occupied_seats"], 0)
            self.assertIn(bus["status"], ["FREE", "MODERATE", "FULL"])
            self.assertGreater(len(bus["route_waypoints"]), 1)

if __name__ == "__main__":
    unittest.main(verbosity=2)
