@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title GTA VI - Server starten

rem ===================================================================
rem  Startet den Server im Hintergrund und richtet den Autostart ein.
rem  Dieses Fenster schliesst sich danach von selbst; der Server laeuft
rem  weiter, bis "Server stoppen.bat" ausgefuehrt wird.
rem
rem  Der Server laeuft unter pythonw.exe. Das ist der Python-Start ohne
rem  Konsolenfenster - nur deshalb ueberlebt der Prozess das Schliessen
rem  dieses Fensters. Mit python.exe wuerde er mit sterben.
rem
rem  ACHTUNG beim Bearbeiten: diese Datei muss reines ASCII mit CRLF-
rem  Zeilenenden bleiben. Umlaute, Sonderzeichen oder Unix-Zeilenenden
rem  bringen den cmd-Parser durcheinander, er zerlegt dann Zeilen an
rem  falschen Stellen und fuehrt Kommentare als Befehle aus.
rem ===================================================================

set "ROOT=%~dp0"
set "PORT=5174"
set "SCRIPT=%~dp0serve.py"
set "LOG=%~dp0server.log"

echo.
echo   GRAND THEFT AUTO VI - Fan-Seite
echo   Server wird gestartet...
echo.

rem ---- laeuft er vielleicht schon? ----
powershell -NoProfile -Command "try{(New-Object Net.Sockets.TcpClient('127.0.0.1',[int]$env:PORT)).Close();exit 0}catch{exit 1}" >nul 2>&1
if not errorlevel 1 (
  echo   Der Server laeuft bereits.
  goto fertig
)

rem ---- Python suchen: erst der py-Launcher, dann python im PATH ----
set "PYDIR="
for /f "delims=" %%i in ('py -3 -c "import sys,os;print(os.path.dirname(sys.executable))" 2^>nul') do set "PYDIR=%%i"
if not defined PYDIR (
  for /f "delims=" %%i in ('python -c "import sys,os;print(os.path.dirname(sys.executable))" 2^>nul') do set "PYDIR=%%i"
)
if not defined PYDIR goto kein_python

set "PY=%PYDIR%\python.exe"
set "PYW=%PYDIR%\pythonw.exe"
if not exist "%PYW%" set "PYW=%PY%"
if not exist "%PY%" goto kein_python

rem ---- Server ohne Konsolenfenster starten ----
start "" "%PYW%" "%SCRIPT%" --no-browser --port %PORT% --log "%LOG%"

rem ---- warten, bis der Port antwortet (max. 15 Sekunden) ----
powershell -NoProfile -Command "$d=(Get-Date).AddSeconds(15); while((Get-Date) -lt $d){ try{ $c=New-Object Net.Sockets.TcpClient('127.0.0.1',[int]$env:PORT); $c.Close(); exit 0 }catch{ Start-Sleep -Milliseconds 250 } }; exit 1" >nul 2>&1
if errorlevel 1 goto start_fehler

:fertig
rem ---- Autostart einrichten (Verknuepfung im Autostart-Ordner) ----
call :autostart_ein

rem ---- WLAN-Adresse fuer das Handy ermitteln ----
set "LANIP="
if exist "%PY%" (
  for /f "delims=" %%i in ('"%PY%" "%SCRIPT%" --print-lan-ip 2^>nul') do set "LANIP=%%i"
)

start "" "http://localhost:%PORT%/"

cls
echo.
echo   GRAND THEFT AUTO VI - Fan-Seite
echo   --------------------------------------------------------
echo   Server laeuft im Hintergrund.
echo.
echo   Am PC        http://localhost:%PORT%
if defined LANIP (
  echo   Am Handy     http://%LANIP%:%PORT%
  echo                gleiches WLAN; beim ersten Start fragt die
  echo                Windows-Firewall - "Privates Netzwerk" zulassen
) else (
  echo   Am Handy     keine Netzwerkadresse gefunden
)
echo   --------------------------------------------------------
echo   Autostart ist eingerichtet - nach dem Hochfahren laeuft
echo   der Server von selbst wieder.
echo.
echo   Beenden mit "Server stoppen.bat".
echo   Diese Adressen stehen auch in server.log.
echo.
echo   Dieses Fenster schliesst sich gleich von selbst.
timeout /t 12 >nul
exit /b 0


rem ===================================================================
:autostart_ein
rem Legt eine Verknuepfung in den Autostart-Ordner des Benutzers.
rem Sie zeigt direkt auf pythonw.exe, damit beim Hochfahren kein
rem Konsolenfenster aufblitzt. Die Pfade kommen ueber Umgebungs-
rem variablen herein - das erspart die Anfuehrungszeichen-Hoelle
rem zwischen cmd und PowerShell.
powershell -NoProfile -Command "$q=[char]34; $sp=[Environment]::GetFolderPath('Startup'); $w=New-Object -ComObject WScript.Shell; $s=$w.CreateShortcut((Join-Path $sp 'GTA VI Server.lnk')); $s.TargetPath=$env:PYW; $s.Arguments=$q+$env:SCRIPT+$q+' --no-browser --port '+$env:PORT+' --log '+$q+$env:LOG+$q; $s.WorkingDirectory=$env:ROOT; $s.WindowStyle=7; $s.Description='Lokaler Server der GTA-VI-Fan-Seite'; $s.Save()" >nul 2>&1
goto :eof


rem ===================================================================
:kein_python
echo   [FEHLER] Python 3 wurde nicht gefunden.
echo.
echo   Python 3 hier laden:  https://www.python.org/downloads/
echo   Bei der Installation "Add python.exe to PATH" anhaken.
echo.
pause
exit /b 1

:start_fehler
echo   [FEHLER] Der Server hat nicht geantwortet.
echo.
echo   Was in der Logdatei steht:
echo   %LOG%
echo.
if exist "%LOG%" powershell -NoProfile -Command "Get-Content $env:LOG -Tail 15"
echo.
pause
exit /b 1
