[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$url = "https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/MinGit-2.44.0-64-bit.zip"
$destDir = "$env:LOCALAPPDATA\MinGit"
$zipFile = "$env:LOCALAPPDATA\mingit.zip"

if (!(Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

Write-Host "Downloading MinGit portable from GitHub..."
Invoke-WebRequest -Uri $url -OutFile $zipFile

Write-Host "Extracting to $destDir..."
Expand-Archive -Path $zipFile -DestinationPath $destDir -Force

Remove-Item $zipFile -Force
Write-Host "Git extracted successfully!"

$gitCmd = "$destDir\cmd\git.exe"
& $gitCmd --version
