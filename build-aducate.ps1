$ErrorActionPreference = 'Stop'
Set-Location "$PSScriptRoot\desktop"
npm install
npm run dist
Write-Host "Aducate Windows build completed. Check desktop\dist\"
