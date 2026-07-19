@echo off
setlocal EnableDelayedExpansion

set "ROOT=%~dp0"
cd /d "%ROOT%"

echo Starting Dipali Fashion presentation...
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed or not available in PATH.
  echo Install Node.js, then run this file again.
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo npm is not available in PATH.
  echo Reinstall Node.js with npm, then run this file again.
  pause
  exit /b 1
)

for /f %%s in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "try { (Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -UseBasicParsing -TimeoutSec 2).StatusCode } catch { 0 }"') do set "STATUS=%%s"

if not "%STATUS%"=="200" (
  if not exist "backend\node_modules" (
    echo Installing backend packages. This needs internet only the first time.
    npm --prefix backend install
    if errorlevel 1 (
      echo Package install failed.
      pause
      exit /b 1
    )
  )

  echo Opening server window. Keep that window open during presentation.
  start "Dipali Fashion Server - Keep Open" cmd /k "cd /d ""%ROOT%"" && npm start"

  echo Waiting for local server on http://localhost:5000 ...
  for /l %%i in (1,1,25) do (
    timeout /t 1 /nobreak >nul
    for /f %%s in ('powershell -NoProfile -ExecutionPolicy Bypass -Command "try { (Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -UseBasicParsing -TimeoutSec 2).StatusCode } catch { 0 }"') do set "STATUS=%%s"
    if "!STATUS!"=="200" goto open_site
  )
)

:open_site
echo Opening website...
start "" "http://localhost:5000"
echo.
echo If Chrome shows an error, wait 5 seconds and press Reload.
echo Keep the server window open until your presentation is finished.
pause
