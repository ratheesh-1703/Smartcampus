# Enable XAMPP Apache access from network
# Run this script as Administrator (Right-click -> Run as Administrator)

Write-Host "Creating Windows Firewall rules for XAMPP Apache..." -ForegroundColor Yellow

# Allow HTTP (port 80)
New-NetFirewallRule -DisplayName "XAMPP Apache HTTP" `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 80 `
    -Profile Any `
    -ErrorAction SilentlyContinue

# Allow HTTPS (port 443)
New-NetFirewallRule -DisplayName "XAMPP Apache HTTPS" `
    -Direction Inbound `
    -Action Allow `
    -Protocol TCP `
    -LocalPort 443 `
    -Profile Any `
    -ErrorAction SilentlyContinue

Write-Host "Firewall rules created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Your mobile device should now be able to access:" -ForegroundColor Cyan
Write-Host "  - Backend: http://10.236.26.203/SmartCampus/backend/" -ForegroundColor White
Write-Host "  - Frontend: http://10.236.26.203:5175/" -ForegroundColor White
Write-Host ""
Write-Host "Test backend by opening this on mobile:" -ForegroundColor Yellow
Write-Host "  http://10.236.26.203/SmartCampus/backend/test_mobile.php" -ForegroundColor White
Write-Host ""
Read-Host "Press Enter to exit"
