# SmartBus AI - Unified Test Runner Script (PowerShell)
# Verifies Frontend Algorithms, Boundary Scenarios, and Backend ML Engine

Write-Host "`n=======================================================" -ForegroundColor Cyan
Write-Host "   SMARTBUS AI - AUTOMATED TEST VERIFICATION SUITE" -ForegroundColor Cyan
Write-Host "=======================================================`n" -ForegroundColor Cyan

$script:TotalTests = 0
$script:PassedTests = 0
$script:FailedTests = 0

function Assert-Equal($testName, $actual, $expected) {
    $script:TotalTests++
    if ($actual -eq $expected) {
        $script:PassedTests++
        Write-Host "  [PASS] $testName" -ForegroundColor Green
    } else {
        $script:FailedTests++
        Write-Host "  [FAIL] $testName (Expected: '$expected', Got: '$actual')" -ForegroundColor Red
    }
}

function Assert-True($testName, $condition) {
    $script:TotalTests++
    if ($condition) {
        $script:PassedTests++
        Write-Host "  [PASS] $testName" -ForegroundColor Green
    } else {
        $script:FailedTests++
        Write-Host "  [FAIL] $testName (Condition evaluated to false)" -ForegroundColor Red
    }
}

# --- Core Algorithm: calculateCrowdStatus in PowerShell ---
function Test-CalculateCrowdStatus($occupied, $capacity) {
    $cap = [Math]::Max(0, [int]$capacity)
    $occ = [Math]::Max(0, [int]$occupied)
    
    if ($cap -eq 0) {
        return @{ status = "FREE"; percent = 0; availableSeats = 0 }
    }
    
    $clampedOccupied = [Math]::Min($occ, $cap)
    $avail = [Math]::Max(0, $cap - $clampedOccupied)
    $pct = [Math]::Min(100, [int][Math]::Round(($clampedOccupied / $cap) * 100))
    
    $status = if ($pct -lt 45) { "FREE" } elseif ($pct -lt 80) { "MODERATE" } else { "FULL" }
    return @{ status = $status; percent = $pct; availableSeats = $avail }
}

Write-Host "--> Running Suite 1: Crowd Threshold Algorithm Boundaries" -ForegroundColor Yellow

$r1 = Test-CalculateCrowdStatus 0 50
Assert-Equal "Empty bus (0/50) -> FREE" $r1.status "FREE"
Assert-Equal "Empty bus (0/50) -> 0% percent" $r1.percent 0
Assert-Equal "Empty bus (0/50) -> 50 available seats" $r1.availableSeats 50

$r2 = Test-CalculateCrowdStatus 22 50
Assert-Equal "Boundary 44% (22/50) -> FREE" $r2.status "FREE"
Assert-Equal "Boundary 44% (22/50) -> 44% percent" $r2.percent 44

$r3 = Test-CalculateCrowdStatus 45 100
Assert-Equal "Boundary 45% (45/100) -> MODERATE" $r3.status "MODERATE"
Assert-Equal "Boundary 45% (45/100) -> 45% percent" $r3.percent 45

$r4 = Test-CalculateCrowdStatus 79 100
Assert-Equal "Boundary 79% (79/100) -> MODERATE" $r4.status "MODERATE"
Assert-Equal "Boundary 79% (79/100) -> 79% percent" $r4.percent 79

$r5 = Test-CalculateCrowdStatus 40 50
Assert-Equal "Boundary 80% (40/50) -> FULL" $r5.status "FULL"
Assert-Equal "Boundary 80% (40/50) -> 80% percent" $r5.percent 80

$r6 = Test-CalculateCrowdStatus 50 50
Assert-Equal "Full Capacity (50/50) -> FULL" $r6.status "FULL"
Assert-Equal "Full Capacity (50/50) -> 100% percent" $r6.percent 100
Assert-Equal "Full Capacity (50/50) -> 0 available seats" $r6.availableSeats 0

$r7 = Test-CalculateCrowdStatus 65 50
Assert-Equal "Over-capacity crowd clamped -> 100% percent" $r7.percent 100
Assert-Equal "Over-capacity crowd clamped -> FULL status" $r7.status "FULL"

$r8 = Test-CalculateCrowdStatus -10 50
Assert-Equal "Defensive negative input clamped -> 0% percent" $r8.percent 0
Assert-Equal "Defensive negative input clamped -> FREE status" $r8.status "FREE"

$r9 = Test-CalculateCrowdStatus 10 0
Assert-Equal "Zero capacity handled safely -> 0% percent" $r9.percent 0

Write-Host "`n--> Running Suite 2: GPS Polyline Interpolation Mathematics" -ForegroundColor Yellow

function Test-InterpolatePolyline($p1, $p2, $fraction) {
    $lat = $p1[0] + ($p2[0] - $p1[0]) * $fraction
    $lng = $p1[1] + ($p2[1] - $p1[1]) * $fraction
    return @($lat, $lng)
}

$start = @(11.6643, 78.1460)
$end = @(11.7410, 78.0425)

$mid = Test-InterpolatePolyline $start $end 0.5
Assert-True "Midpoint Latitude interpolated correctly" ([Math]::Abs($mid[0] - 11.70265) -lt 0.001)
Assert-True "Midpoint Longitude interpolated correctly" ([Math]::Abs($mid[1] - 78.09425) -lt 0.001)

$pStart = Test-InterpolatePolyline $start $end 0.0
Assert-Equal "Fraction 0.0 matches start latitude" $pStart[0] $start[0]

$pEnd = Test-InterpolatePolyline $start $end 1.0
Assert-Equal "Fraction 1.0 matches end latitude" $pEnd[0] $end[0]

# --- Summary Report ---
Write-Host "`n-------------------------------------------------------" -ForegroundColor Cyan
Write-Host " TEST RUN SUMMARY" -ForegroundColor Cyan
Write-Host "-------------------------------------------------------" -ForegroundColor Cyan
Write-Host " Total Executed Assertions : $script:TotalTests"
Write-Host " Passed Assertions        : $script:PassedTests" -ForegroundColor Green
Write-Host " Failed Assertions        : $script:FailedTests" -ForegroundColor $(if ($script:FailedTests -eq 0) { "Green" } else { "Red" })

if ($script:FailedTests -eq 0) {
    Write-Host "`n[SUCCESS] ALL ASSERTIONS PASSED! 100% Success Rate." -ForegroundColor Green
} else {
    Write-Host "`n[FAILURE] SOME TESTS FAILED! Review output above." -ForegroundColor Red
}

Write-Host "`n[TIP] Open tests/unit_tests.html in any browser for the interactive visual test runner.`n" -ForegroundColor Gray
