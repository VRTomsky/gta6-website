@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title GTA VI - Server stoppen

rem ===================================================================
rem  Beendet den Hintergrund-Server und entfernt den Autostart.
rem  Ohne das Entfernen wuerde der Server beim naechsten Hochfahren
rem  wieder anspringen - "gestoppt" waere er dann nur bis zum Neustart.
rem
rem  ACHTUNG beim Bearbeiten: reines ASCII mit CRLF-Zeilenenden, sonst
rem  zerlegt der cmd-Parser die Zeilen an falschen Stellen.
rem ===================================================================

set "ROOT=%~dp0"
set "PORT=5174"
set "SCRIPT=%~dp0serve.py"

echo.
echo   GRAND THEFT AUTO VI - Fan-Seite
echo   Server wird gestoppt...
echo.

rem ---- Autostart-Verknuepfung entfernen ----
powershell -NoProfile -Command "$p=Join-Path ([Environment]::GetFolderPath('Startup')) 'GTA VI Server.lnk'; if(Test-Path $p){ Remove-Item $p -Force }" >nul 2>&1

rem ---- den Serverprozess beenden ----
rem Gesucht wird ueber die Kommandozeile: nur python*-Prozesse, die genau
rem dieses serve.py ausfuehren. Ueber den Port allein waere es unsicher,
rem ein fremdes Programm koennte ihn belegen.
rem
rem Kein "for /f" drumherum: dort wuerde das erste einfache Anfuehrungs-
rem zeichen im PowerShell-Code die Befehlszeile vorzeitig beenden.
rem PowerShell schreibt seine Meldung deshalb selbst.
powershell -NoProfile -Command "$ps=@(Get-CimInstance Win32_Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'python*' -and $_.CommandLine -and $_.CommandLine -like ('*'+$env:SCRIPT+'*') }); if($ps.Count -eq 0){ Write-Host '  Es lief kein Server.' } else { $ps | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; Write-Host ('  Server beendet (' + $ps.Count + ' Prozess(e)).') }"

echo   Autostart entfernt - nach dem Hochfahren bleibt er aus.
echo.
echo   Wieder einschalten mit "Server starten.bat".
echo.
timeout /t 7 >nul
exit /b 0
