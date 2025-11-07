# Restart API Server Script
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   RESTARTING API SERVER" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Find and stop the API server
Write-Host "Step 1: Finding API server on port 8000..." -ForegroundColor Yellow
$connections = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($connections) {
    $processId = $connections[0].OwningProcess
    Write-Host "   Found API server (Process ID: $processId)" -ForegroundColor Green
    Write-Host "   Stopping process..." -ForegroundColor Yellow
    Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    Write-Host "   SUCCESS: API server stopped" -ForegroundColor Green
} else {
    Write-Host "   INFO: No API server found on port 8000" -ForegroundColor Gray
}
Write-Host ""

# Step 2: Wait a moment
Write-Host "Step 2: Waiting 2 seconds..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
Write-Host ""

# Step 3: Start the API server
Write-Host "Step 3: Starting API server..." -ForegroundColor Yellow
$apiPath = Join-Path $PSScriptRoot "api"
Set-Location $apiPath

# Start in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
Write-Host "   SUCCESS: API server starting in new window" -ForegroundColor Green
Write-Host ""

# Step 4: Wait for server to start
Write-Host "Step 4: Waiting 5 seconds for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5
Write-Host ""

# Verify server is running
Write-Host "Step 5: Verifying server is running..." -ForegroundColor Yellow
$newConnections = Get-NetTCPConnection -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($newConnections) {
    Write-Host "   SUCCESS: API server is running on port 8000" -ForegroundColor Green
} else {
    Write-Host "   WARNING: Could not verify server is running" -ForegroundColor Red
    Write-Host "   Please check the new window for any errors" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   API SERVER RESTARTED!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The API server should now be running on http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Go back to your browser" -ForegroundColor White
Write-Host "2. Press Ctrl+Shift+R to hard refresh" -ForegroundColor White
Write-Host "3. The 403 error should be gone!" -ForegroundColor White
Write-Host ""
Write-Host "If you still see errors, try logging out and logging back in." -ForegroundColor Gray
Write-Host ""

# Return to original directory
Set-Location $PSScriptRoot

Read-Host "Press Enter to close this window"
