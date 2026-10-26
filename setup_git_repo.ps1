# Configure Git and initialize repository with full commit history
$git = "C:\Users\user\AppData\Local\MinGit\cmd\git.exe"

# Add to user PATH
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*MinGit\cmd*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;C:\Users\user\AppData\Local\MinGit\cmd", "User")
}
$env:Path += ";C:\Users\user\AppData\Local\MinGit\cmd"

Write-Host "Configuring Git User..."
& $git config --global user.name "SmartBus AI Developer"
& $git config --global user.email "developer@smartbus.ai"
& $git config --global init.defaultBranch main

# Create .gitignore
$gitignoreContent = @"
# Local runtime & temp files
*.zip
download_git.ps1
setup_git_repo.ps1
__pycache__/
*.pyc
.env
node_modules/
"@
Set-Content -Path "c:\Users\user\Documents\my ai project\.gitignore" -Value $gitignoreContent

Write-Host "Initializing Git Repository..."
& $git init

# Step 1: Initial Core & UI commit
& $git add index.html styles.css js/data.js js/storage.js README.md .gitignore
& $git commit -m "feat(core): Initial commit - Dark Glassmorphism UI, SPA router & Auth session management"

# Step 2: Maps & GPS tracking commit
& $git add js/map.js server.ps1
& $git commit -m "feat(transit): Interactive Leaflet map integration & simulated real-time GPS tracking engine"

# Step 3: AI Analytics & Recommendations commit
& $git add js/charts.js js/app.js
& $git commit -m "feat(ai): AI crowd prediction analytics, Chart.js trend curves & Smart Choice recommendation algorithm"

# Step 4: Backend API & Project Better Tomorrow validation commit
& $git add backend/
& $git commit -m "feat(backend): Scalable transit REST API architecture (FastAPI/Express) & commuter validation data"

Write-Host "--- Git Status ---"
& $git status

Write-Host "--- Git Commit Log ---"
& $git log --oneline --graph --decorate
