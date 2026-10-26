# SmartBus AI - Advanced Full-Stack HTTP & REST API Server
$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "SmartBus AI Full-Stack Server & REST API running at http://localhost:$port/"
$root = $PSScriptRoot

# Load initial data
$busesJson = @'
[
  {
    "id": "SB-101",
    "bus_number": "SB-101",
    "route_name": "Salem Central → Omalur Bus Stand",
    "origin_stand_id": "salem-central",
    "dest_stand_id": "omalur-stand",
    "departure_time": "10:15 AM",
    "arrival_time": "10:45 AM",
    "capacity": 52,
    "occupied_seats": 18,
    "available_seats": 34,
    "crowd_percent": 35,
    "status": "FREE",
    "speed_km": 42
  },
  {
    "id": "SB-102",
    "bus_number": "SB-102",
    "route_name": "MGR Integrated → Mettur Bus Stand",
    "origin_stand_id": "mgr-integrated",
    "dest_stand_id": "mettur-stand",
    "departure_time": "10:20 AM",
    "arrival_time": "11:10 AM",
    "capacity": 56,
    "occupied_seats": 42,
    "available_seats": 14,
    "crowd_percent": 75,
    "status": "MODERATE",
    "speed_km": 48
  },
  {
    "id": "SB-103",
    "bus_number": "SB-103",
    "route_name": "Salem Central → Erode Central",
    "origin_stand_id": "salem-central",
    "dest_stand_id": "erode-central",
    "departure_time": "10:05 AM",
    "arrival_time": "11:20 AM",
    "capacity": 50,
    "occupied_seats": 46,
    "available_seats": 4,
    "crowd_percent": 92,
    "status": "FULL",
    "speed_km": 55
  },
  {
    "id": "SB-104",
    "bus_number": "SB-104",
    "route_name": "Salem Central → Omalur Bus Stand",
    "origin_stand_id": "salem-central",
    "dest_stand_id": "omalur-stand",
    "departure_time": "10:30 AM",
    "arrival_time": "11:00 AM",
    "capacity": 52,
    "occupied_seats": 21,
    "available_seats": 31,
    "crowd_percent": 40,
    "status": "FREE",
    "speed_km": 45
  }
]
'@

$feedbackJson = @'
[
  {
    "id": "fb-001",
    "commuter_name": "Priya S.",
    "commuter_role": "College Student (Daily Commuter)",
    "primary_route": "Salem Central → Omalur Bus Stand",
    "ui_ux_rating": 5,
    "crowd_categorization_accurate": true,
    "suggested_crowd_threshold_changes": "In morning college rush (8:15 to 9:15 AM), 75% already feels like full because seats are taken and standing aisle is packed.",
    "feedback_notes": "Dark mode dashboard is exceptionally clean. Adding a quick-filter for Direct College Buses would be amazing."
  },
  {
    "id": "fb-002",
    "commuter_name": "Rajesh Kumar",
    "commuter_role": "IT Professional / Regular Commuter",
    "primary_route": "Salem Central → Erode Central",
    "ui_ux_rating": 4,
    "crowd_categorization_accurate": true,
    "suggested_crowd_threshold_changes": "Keep 0-44% FREE, but show an explicit counter for Remaining Seated vs Standing Room.",
    "feedback_notes": "The Smart Choice recommendation saved me 25 minutes of standing yesterday by recommending SB-104 instead of packed SB-103."
  },
  {
    "id": "fb-003",
    "commuter_name": "Murugan V.",
    "commuter_role": "Senior Citizen Passenger",
    "primary_route": "MGR Integrated → Mettur Bus Stand",
    "ui_ux_rating": 5,
    "crowd_categorization_accurate": true,
    "suggested_crowd_threshold_changes": "For senior citizens, anything above 60% is tough because lower front priority seats fill up first.",
    "feedback_notes": "The large font, live ETA countdown, and green/yellow/red color-coding make it very easy to read even in bright outdoor sunlight."
  }
]
'@

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    # CORS Headers
    $response.AddHeader("Access-Control-Allow-Origin", "*")
    $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    $response.AddHeader("Access-Control-Allow-Headers", "Content-Type")

    if ($request.HttpMethod -eq "OPTIONS") {
        $response.StatusCode = 200
        $response.Close()
        continue
    }

    $localPath = $request.Url.LocalPath

    # REST API Routing
    if ($localPath -eq "/api/buses") {
        $response.ContentType = "application/json; charset=utf-8"
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($busesJson)
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.Close()
        continue
    }

    if ($localPath -eq "/api/feedback") {
        $response.ContentType = "application/json; charset=utf-8"
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($feedbackJson)
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.Close()
        continue
    }

    if ($localPath -eq "/api/predict/crowd") {
        $response.ContentType = "application/json; charset=utf-8"
        $predictionJson = @'
{
  "route_id": "salem-omalur",
  "predicted_occupancy_percent": 88.5,
  "predicted_status": "FULL",
  "confidence_interval_low": 83.0,
  "confidence_interval_high": 94.0,
  "model_used": "PatchTST-Ensemble-v2.4",
  "peak_risk_flag": true,
  "recommendation_reason": "High rush predicted (88.5% load). Consider traveling 20 mins earlier on SB-104 (31 seats available)."
}
'@
        $buffer = [System.Text.Encoding]::UTF8.GetBytes($predictionJson)
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
        $response.Close()
        continue
    }

    # Static File Serving
    if ($localPath -eq "/") { $localPath = "/index.html" }
    $filePath = Join-Path $root $localPath.TrimStart('/')

    if (Test-Path $filePath -PathType Leaf) {
        $content = [System.IO.File]::ReadAllBytes($filePath)
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        switch ($ext) {
            ".html" { $response.ContentType = "text/html; charset=utf-8" }
            ".css"  { $response.ContentType = "text/css" }
            ".js"   { $response.ContentType = "application/javascript" }
            ".json" { $response.ContentType = "application/json" }
            ".png"  { $response.ContentType = "image/png" }
            ".jpg"  { $response.ContentType = "image/jpeg" }
            default { $response.ContentType = "application/octet-stream" }
        }
        $response.ContentLength64 = $content.Length
        $response.OutputStream.Write($content, 0, $content.Length)
    } else {
        $response.StatusCode = 404
        $buffer = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $response.ContentLength64 = $buffer.Length
        $response.OutputStream.Write($buffer, 0, $buffer.Length)
    }

    $response.Close()
}
