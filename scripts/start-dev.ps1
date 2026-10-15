$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $projectRoot 'backend'
$frontendPath = Join-Path $projectRoot 'frontend'

function Get-FreePort {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
    $listener.Start()
    try {
        return ([System.Net.IPEndPoint]$listener.LocalEndpoint).Port
    }
    finally {
        $listener.Stop()
    }
}

$pythonCandidates = @(
    (Join-Path $backendPath '.venv\Scripts\python.exe'),
    (Join-Path $projectRoot '.venv\Scripts\python.exe')
)
$pythonPath = $pythonCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if (-not $pythonPath) {
    $pythonCommand = Get-Command python -ErrorAction SilentlyContinue
    if (-not $pythonCommand) {
        throw 'Python was not found. Install Python or create a project .venv first.'
    }
    $pythonPath = $pythonCommand.Source
}

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
if (-not $nodeCommand) {
    throw 'Node.js was not found. Install Node.js before starting the frontend.'
}
if (-not (Test-Path (Join-Path $frontendPath 'node_modules\vite\bin\vite.js'))) {
    throw 'Frontend dependencies are missing. Run npm.cmd install from the frontend folder first.'
}

$backendPort = Get-FreePort
$frontendPort = Get-FreePort
while ($frontendPort -eq $backendPort) {
    $frontendPort = Get-FreePort
}

$backendProcess = Start-Process -FilePath $pythonPath `
    -ArgumentList @('-m', 'uvicorn', 'app.main:app', '--host', '127.0.0.1', '--port', "$backendPort") `
    -WorkingDirectory $backendPath -PassThru

$previousApiTarget = $env:VITE_API_TARGET
try {
    $env:VITE_API_TARGET = "http://127.0.0.1:$backendPort"
    $frontendProcess = Start-Process -FilePath $nodeCommand.Source `
        -ArgumentList @('node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', "$frontendPort", '--strictPort') `
        -WorkingDirectory $frontendPath -PassThru
}
finally {
    $env:VITE_API_TARGET = $previousApiTarget
}

Write-Host "Frontend: http://localhost:$frontendPort"
Write-Host "Backend:  http://localhost:$backendPort"
Write-Host "API docs: http://localhost:$backendPort/api/docs"
Write-Host "Stop the servers by closing their terminal windows or ending processes $($frontendProcess.Id) and $($backendProcess.Id)."
