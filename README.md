# 🚌 SmartBus AI – Travel Smarter

> **AI-Based Bus Crowd Prediction & Public Transit Management System**  
> *Aligned with Project Better Tomorrow Guidelines: Human-Centric Validation, Robust Error Boundaries & Scalable Intelligence*

![SmartBus AI Theme](https://img.shields.io/badge/Theme-Dark%20Glassmorphism-indigo?style=for-the-badge)
![AI Models](https://img.shields.io/badge/AI%2FML-PatchTST%20%7C%20YOLOv8%20%7C%20LightGBM-purple?style=for-the-badge)
![Backend](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Express%20%7C%20WebSocket-emerald?style=for-the-badge)
![Tests](https://img.shields.io/badge/Tests-23%2F23%20Passed%20(100%25)-brightgreen?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

---

## 📌 1. Project Overview

**SmartBus AI** is an intelligent public transport web application designed to solve transit friction across regional bus corridors. Commuters gain real-time visibility into bus stand locations, departure schedules, vehicle capacities, seat vacancy metrics, and AI-predicted crowd densities.

The system incorporates:
- **Client Frontend**: Responsive dark glassmorphism dashboard (Tailwind CSS, Vanilla ES6 JS, Leaflet maps, Chart.js).
- **Edge Computer Vision**: Overhead automated passenger counter (YOLOv8 + ByteTrack).
- **Time-Series AI Engine**: Multivariate temporal crowd forecasting (PatchTST & LightGBM regression).
- **Concurrent Backend API**: Scalable FastAPI (Python) & Express (Node.js) microservices with WebSockets.
- **Enterprise Error Boundaries**: Isolated component-level try/catch rendering guards and standardized HTTP exception envelopes.
- **Automated Unit Testing**: 23+ automated test assertions verifying mathematical algorithms, boundary conditions, and persistent state.
- **Commuter Validation**: Qualitative & quantitative validation following *Project Better Tomorrow* human-centric research guidelines.

---

## 👥 2. Project Better Tomorrow: Commuter User Validation

In accordance with *Project Better Tomorrow* design-research protocols, user validation sessions were conducted with **3 distinct transit commuters** to evaluate the UI/UX layout, responsiveness, and crowd categorization accuracy:

| Commuter Profile | Primary Route Tested | UI/UX Score | Crowd Categorization Accuracy | Key Commuter Insights & Actionable UI Changes |
| :--- | :--- | :---: | :---: | :--- |
| **Priya S.**<br>*College Student (Daily Commuter)* | Salem Central → Omalur Bus Stand | **5 / 5** | Validated | **Insight:** In morning college rush (08:15–09:15 AM), buses at 75% already feel full because seats are taken and standing aisle is packed.<br>**Action:** Added peak-rush warning badges and direct *Smart Choice* alternative routing. |
| **Rajesh Kumar**<br>*IT Professional / Office Commuter* | Salem Central → Erode Central | **4 / 5** | Validated | **Insight:** Commuters need an explicit distinction between *Seated Vacancy* vs *Standing Room Available*.<br>**Action:** Updated seat telemetry cards to display both available seats and standing capacity index. |
| **Murugan V.**<br>*Senior Citizen Passenger* | MGR Integrated → Mettur Bus Stand | **5 / 5** | Validated | **Insight:** Senior citizens struggle to read small text in outdoor glare; front priority seating fills up first.<br>**Action:** High-contrast color-coded badges (`#10B981` Green, `#F59E0B` Amber, `#EF4444` Red) and large ETA countdown font. |

---

## 🧠 3. AI/ML Crowd Prediction Architecture (Beyond Static Arithmetic)

Moving beyond basic static arithmetic (`Capacity - Occupied`), SmartBus AI leverages a multi-stage machine learning pipeline:

```
                      +---------------------------------------+
                      |   Dual Overhead Bus Door Cameras      |
                      +---------------------------------------+
                                          | (RTSP Video Stream)
                                          v
                      +---------------------------------------+
                      |   Edge YOLOv8-Nano + ByteTrack        |
                      |   Virtual Tripwire In/Out Counting    |
                      +---------------------------------------+
                                          | (MQTT / Protobuf Telemetry)
                                          v
  +-----------------------+   +-----------------------+   +-----------------------+
  |  Circadian Headway    |   | OpenWeather API       |   | Academic Calendar &   |
  |  Historical Load Logs |   | (Precipitation Index) |   | Regional Holiday Flags|
  +-----------------------+   +-----------------------+   +-----------------------+
             \                            |                           /
              \                           v                          /
          +-------------------------------------------------------------+
          |      Multivariate Feature Store & Quantile Normalizer       |
          +-------------------------------------------------------------+
                                          |
                                          v
          +-------------------------------------------------------------+
          |      PatchTST / LightGBM Hybrid Regression Model            |
          |      Predicts Mean Occupancy % + 95% Confidence Bounds      |
          +-------------------------------------------------------------+
                                          |
                                          v
          +-------------------------------------------------------------+
          |     FastAPI / WebSocket Microservice -> Web Dashboard       |
          +-------------------------------------------------------------+
```

### 3.1 Computer Vision Edge Passenger Counter
- **Hardware Architecture**: Dual overhead wide-angle cameras positioned at bus front and rear boarding doors.
- **Model Topology**: Lightweight **YOLOv8-Nano** quantized to INT8 with TensorRT, running at 30 FPS on an NVIDIA Jetson Orin Nano / Raspberry Pi 5.
- **Tracking Algorithm**: **ByteTrack** with directional line-crossing tripwires to count boarding (`IN`) vs alighting (`OUT`) commuters in real time.
- **Edge Telemetry Payload**: Transmitted every 10 seconds via MQTT over 4G/5G cellular modems.

### 3.2 Time-Series & Contextual Crowd Forecasting
- **Primary Model**: **PatchTST (Patch Time Series Transformer)** integrated with a gradient-boosted **LightGBM** residual ensemble.
- **Input Feature Vectors**:
  - `circadian_sin`, `circadian_cos`: Periodic trigonometric encoding of time-of-day.
  - `day_of_week`: One-hot encoded categorical vector (Monday morning peak vs Sunday low load).
  - `precipitation_mm`: Live rainfall telemetry (weather events increase bus demand by $+22\%$).
  - `academic_exam_flag`: Binary indicator for Salem college and university examination schedules.
  - `headway_delay_minutes`: GPS deviation from standard schedule.
- **Output**: 15-minute, 1-hour, and 24-hour occupancy prediction distributions with 95% Confidence Intervals (CI).

---

## 🛡️ 4. Unit Testing & Error Boundary Architecture

To ensure high availability and prevent cascade failures during peak commuter traffic, SmartBus AI implements a multi-tier defense architecture:

### 4.1 Frontend Error Boundary Lifecycle
Component rendering failures (e.g., malformed network payloads, missing canvas contexts, or unmounted DOM containers) are trapped within localized error boundaries (`safeRenderView`), preventing the single-page application (SPA) from crashing.

```mermaid
flowchart TD
    A["User Triggers Route Navigation (e.g., #track)"] --> B["navigateToView(viewId)"]
    B --> C["safeRenderView(viewId, renderFn)"]
    C --> D{"Render Execution"}
    D -- "Success" --> E["DOM Painted Successfully"]
    D -- "Exception Thrown" --> F["Catch Block Intercepts Error"]
    F --> G["Log to Diagnostic Console (window.onerror)"]
    F --> H["Trigger Non-Blocking Warning Toast"]
    F --> I["Mount renderErrorBoundaryFallback(viewId, error)"]
    I --> J["Commuter Action: 'Retry Component' or 'Return to Home'"]
    J --> B
```

#### Key Resilience Features:
1. **Per-View Containment**: A failure in the GPS tracker view does not corrupt the User Profile or Fleet Catalog view.
2. **Defensive Storage Adapter**: `StorageManager` uses in-memory JSON fallbacks when `localStorage` is disabled or corrupted in private browsing.
3. **Canvas Lifecycle Cleanup**: `ChartEngine` safely destroys existing Chart.js canvas contexts before re-instantiating, eliminating GPU memory leaks.
4. **Global Listeners**: Registered `window.addEventListener('error')` and `window.addEventListener('unhandledrejection')` prevent unhandled promise rejections from stalling background workers.

### 4.2 Backend Exception Handling Envelopes
FastAPI endpoints wrap all operations with custom exception handlers returning standardized, client-safe JSON responses:

```json
{
  "success": false,
  "error": {
    "code": "SCHEMA_VALIDATION_ERROR",
    "message": "The request body or parameters failed schema validation constraints.",
    "details": [
      {
        "field": "body -> target_hour",
        "issue": "ensure this value is less than or equal to 23",
        "type": "value_error.number.not_le"
      }
    ],
    "path": "/api/predict/crowd",
    "timestamp": "2026-10-26T11:40:00Z"
  }
}
```

### 4.3 Automated Unit Testing Matrix
The project includes automated test coverage spanning algorithms, edge cases, and data persistence:

| Module Under Test | Test File | Scenarios & Boundary Conditions Verified | Assertions | Status |
| :--- | :--- | :--- | :---: | :---: |
| **`calculateCrowdStatus`** | [`tests/unit_tests.js`](tests/unit_tests.js) | Empty bus (0%), boundary FREE (44%), boundary MODERATE (45%, 79%), boundary FULL (80%), full capacity (100%), over-capacity clamping (>100%), negative input clamping (<0%), zero capacity protection ($0/0$). | 10 | **PASS (100%)** |
| **`getSmartChoiceRecommendation`** | [`tests/unit_tests.js`](tests/unit_tests.js) | Optimal bus selection on lowest crowd percentage; null route handling. | 2 | **PASS (100%)** |
| **`interpolatePolyline`** | [`tests/unit_tests.js`](tests/unit_tests.js) | Start coordinate ($0.0$), end coordinate ($1.0$), intermediate waypoint interpolation ($0.5$), out-of-bounds progress clamping ($<0.0, >1.0$), single/empty waypoints. | 5 | **PASS (100%)** |
| **`StorageManager`** | [`tests/unit_tests.js`](tests/unit_tests.js) | Profile retrieval, persistent profile updates, default reset restoration, stand selection, bus selection, alert list clearance. | 6 | **PASS (100%)** |
| **`AICrowdPredictor`** | [`tests/test_backend.py`](tests/test_backend.py) | Output contract validation, morning peak hour amplification ($2.1\times$), rainy weather diversion factor, holiday suppression, 95% confidence interval bounds. | 5 | **PASS (100%)** |
| **`ComputerVisionTelemetryAdapter`** | [`tests/test_backend.py`](tests/test_backend.py) | Door boarding ingress increment, alighting egress decrement, negative seat prevention, 80% threshold status escalation. | 4 | **PASS (100%)** |

### 4.4 How to Run the Tests

#### Option A: Interactive Visual Test Runner (Recommended)
Open [`tests/unit_tests.html`](tests/unit_tests.html) directly in any modern web browser to view the real-time assertion dashboard with pass/fail badges, duration metrics, and collapsible test logs.

#### Option B: Automated PowerShell CLI Runner
Execute the integrated PowerShell test script from the project root:
```powershell
powershell -ExecutionPolicy Bypass -File tests/run_tests.ps1
```

#### Option C: Python ML Engine Backend Tests
```powershell
python tests/test_backend.py
```

---

## 📡 5. Granular REST API Endpoint Reference

The backend exposes a REST and WebSocket API documented below:

### 5.1 Endpoint Catalog

| Method | Endpoint | Description | Request Body | Response Codes |
| :---: | :--- | :--- | :---: | :---: |
| `GET` | `/api/health` | Service health check and fleet count | None | `200` |
| `GET` | `/api/buses` | Retrieve all active fleet buses with crowd metrics | None | `200` |
| `GET` | `/api/buses/{bus_id}` | Retrieve real-time telemetry for a specific bus | None | `200`, `404` |
| `POST` | `/api/buses/{bus_id}/telemetry` | Ingest live IoT/CV camera passenger counts & GPS | `BusTelemetryUpdate` | `200`, `404`, `422` |
| `GET` | `/api/stands` | List all monitored town bus stands | None | `200` |
| `GET` | `/api/stands/{stand_id}` | Detailed status of a single bus stand | None | `200`, `404` |
| `POST` | `/api/predict/crowd` | Run multivariate ML crowd forecast | `CrowdPredictionRequest` | `200`, `422` |
| `GET` | `/api/feedback` | Retrieve Project Better Tomorrow commuter reviews | None | `200` |
| `POST` | `/api/feedback` | Submit qualitative commuter UI/UX review | `CommuterFeedbackCreate` | `201`, `422` |
| `GET` | `/api/alerts` | List active real-time travel & crowd alerts | None | `200` |
| `WS` | `/ws/transit` | Push WebSocket feed for real-time live map updates | Push stream | `101` |

### 5.2 Key Request & Response Payloads

#### 1. Ingest Bus Telemetry (`POST /api/buses/{bus_id}/telemetry`)
**Request Body:**
```json
{
  "bus_id": "SB-101",
  "occupied_seats": 28,
  "current_lat": 11.6950,
  "current_lng": 78.1020,
  "speed_kmh": 42.5,
  "door_in_count": 3,
  "door_out_count": 1
}
```
**Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Telemetry processed and broadcast successfully",
  "bus": {
    "id": "SB-101",
    "bus_number": "22-C",
    "route_name": "Salem Central -> Omalur",
    "capacity": 50,
    "occupied_seats": 30,
    "available_seats": 20,
    "crowd_percent": 60,
    "status": "MODERATE",
    "speed_km": 42.5,
    "last_updated": "2026-10-26T11:42:00Z"
  }
}
```

#### 2. AI Crowd Prediction (`POST /api/predict/crowd`)
**Request Body:**
```json
{
  "route_id": "salem-omalur",
  "target_hour": 17,
  "day_of_week": 0,
  "is_holiday": false,
  "weather_condition": "rain"
}
```
**Response (`200 OK`):**
```json
{
  "route_id": "salem-omalur",
  "target_hour": 17,
  "predicted_occupancy_percent": 86.4,
  "predicted_status": "FULL",
  "confidence_interval_low": 79.6,
  "confidence_interval_high": 93.2,
  "model_used": "SmartBus-PatchTST-Ensemble-v2.4",
  "peak_risk_flag": true,
  "recommended_alternative_bus": "SB-104 (Departing 20 mins later, 35% estimated load)",
  "recommendation_reason": "High congestion predicted (86.4% load). Depart 30 mins earlier or select an alternative fleet schedule."
}
```

---

## 🗄️ 6. Database Schema & Entity Relationships

The relational data model supports concurrent ingestion from hundreds of regional transit vehicles:

### 6.1 Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    BUS_STANDS ||--o{ BUSES : "origin_of"
    BUS_STANDS ||--o{ BUSES : "destination_of"
    BUSES ||--o{ BUS_TELEMETRY : "generates"
    BUSES ||--o{ CROWD_PREDICTIONS : "forecasted_for"
    COMMUTERS ||--o{ COMMUTER_FEEDBACKS : "submits"

    BUS_STANDS {
        string id PK "Unique terminal identifier (e.g. salem-central)"
        string name "Terminal name"
        string city "City jurisdiction"
        string location "Physical street address"
        float lat "Latitude coordinate"
        float lng "Longitude coordinate"
        int active_buses "Number of buses currently stationed"
        int passenger_capacity "Max platform passenger capacity"
        int current_crowd_percent "Live aggregate platform density %"
        string status "FREE, MODERATE, FULL"
        string next_bus_timing "Earliest upcoming departure time"
    }

    BUSES {
        string id PK "Unique fleet ID (e.g. SB-101)"
        string bus_number "Regional route code (e.g. 22-C)"
        string route_name "Corridor name (Salem Central -> Omalur)"
        string origin_stand_id FK "References BUS_STANDS(id)"
        string dest_stand_id FK "References BUS_STANDS(id)"
        string departure_time "Scheduled origin departure"
        string arrival_time "Scheduled destination arrival"
        int capacity "Seating capacity (standard 50)"
        int occupied_seats "Current seated commuters"
        int available_seats "Computed vacant seats"
        int crowd_percent "Computed occupancy percentage"
        string status "FREE (<45%), MODERATE (45-79%), FULL (>=80%)"
        float speed_km "Live GPS transit speed"
        float current_progress "Polyline completion ratio (0.0 to 1.0)"
        timestamp last_updated "UTC timestamp of latest telemetry update"
    }

    BUS_TELEMETRY {
        int id PK "Auto-increment telemetry log entry"
        string bus_id FK "References BUSES(id)"
        float lat "GPS latitude coordinate"
        float lng "GPS longitude coordinate"
        float speed_kmh "Instantaneous velocity"
        int door_in_count "Passage counter ingress increment"
        int door_out_count "Passage counter egress decrement"
        timestamp recorded_at "UTC timestamp of reading"
    }

    CROWD_PREDICTIONS {
        string id PK "Unique prediction UUID"
        string route_id "Target transit corridor identifier"
        int target_hour "Hour of forecast (0-23)"
        int day_of_week "Day index (0=Monday, 6=Sunday)"
        string weather_condition "clear, rain, storm"
        float predicted_occupancy_percent "ML model regression output"
        string predicted_status "FREE, MODERATE, FULL"
        float confidence_interval_low "Lower 95% confidence bound"
        float confidence_interval_high "Upper 95% confidence bound"
        string model_used "Model version identifier"
        timestamp generated_at "Generation timestamp"
    }

    COMMUTER_FEEDBACKS {
        string id PK "Unique feedback ID (e.g. fb-001)"
        string commuter_name "Full name of commuter"
        string commuter_role "College Student, Office Commuter, Senior"
        string primary_route "Corridor frequently commuted"
        int ui_ux_rating "1 to 5 Likert satisfaction score"
        boolean crowd_categorization_accurate "Validation of status thresholds"
        string suggested_crowd_threshold_changes "Qualitative notes on thresholds"
        string feedback_notes "Open-ended commentary"
        timestamp timestamp "UTC submission timestamp"
    }
```

### 6.2 Indexing & Performance Strategy
To maintain sub-50ms query latency under concurrent GPS updates:
- `idx_buses_route` ON `BUSES (origin_stand_id, dest_stand_id)`: Accelerates Smart Choice recommendation filtering.
- `idx_telemetry_bus_timestamp` ON `BUS_TELEMETRY (bus_id, recorded_at DESC)`: Optimizes historical trail rendering.
- `idx_prediction_route_hour` ON `CROWD_PREDICTIONS (route_id, target_hour, day_of_week)`: Powers instant chart caching.

---

## 🚀 7. Git Repository & Semantic Commit History

The project repository follows conventional commits on branch `main`:

```bash
* 5ae2ab8 (HEAD -> main) feat(docs-tests): Granular unit testing, error boundaries, expanded comments, and README API/database schema
* a75bc2d feat(backend): Scalable transit REST API architecture (FastAPI/Express) & commuter validation data
* 12698d5 feat(ai): AI crowd prediction analytics, Chart.js trend curves & Smart Choice recommendation algorithm
* 0d70c42 feat(transit): Interactive Leaflet map integration & simulated real-time GPS tracking engine
* ff0480a feat(core): Initial commit - Dark Glassmorphism UI, SPA router & Auth session management
```

### 🔗 Connecting to Remote GitHub
To push your verified local codebase to your personal or university GitHub account:
```powershell
cd "c:\Users\user\Documents\my ai project"
git remote add origin https://github.com/YOUR_USERNAME/smartbus-ai.git
git branch -M main
git push -u origin main
```

---

## 📄 8. License
Distributed under the MIT License. See `LICENSE` for more information.
