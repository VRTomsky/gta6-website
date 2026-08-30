@echo off
setlocal
title GTA VI Fan-Seite - lokaler Server
cd /d "%~dp0"

echo.
echo   GRAND THEFT AUTO VI - Fan-Seite
echo   Server wird gestartet...
echo.

rem ---- Python suchen (py-Launcher zuerst, dann python im PATH) ----
set "PY="

py -3 --version >nul 2>&1
if not errorlevel 1 set "PY=py -3"

if not defined PY (
  python --version >nul 2>&1
  if not errorlevel 1 set "PY=python"
)

if not defined PY (
  echo   [FEHLER] Python 3 wurde nicht gefunden.
  echo.
  echo   Python 3 hier laden:  https://www.python.org/downloads/
  echo   Bei der Installation "Add python.exe to PATH" anhaken.
  echo.
  pause
  exit /b 1
)

rem ---- Server starten ----
if exist "%~dp0serve.py" (
  %PY% "%~dp0serve.py"
) else (
  echo   [Hinweis] serve.py fehlt - einfacher Server ohne Range-Support.
  echo   Adresse: http://localhost:5174
  echo.
  start "" "http://localhost:5174/"
  %PY% -m http.server 5174
)

echo.
echo   Server beendet.
pause
