@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title GTA VI - auf GitHub hochladen

rem ===================================================================
rem  Spiegelt diesen Ordner ins Git-Repository und laedt ihn zu GitHub
rem  hoch. Ein paar Minuten spaeter ist der neue Stand auf
rem  https://luciajason.de zu sehen.
rem
rem  Warum zwei Ordner?
rem    Gearbeitet wird hier, in OneDrive. Das Repository liegt bewusst
rem    ausserhalb von OneDrive: OneDrive synchronisiert sonst staendig
rem    den .git-Ordner mit, sperrt dabei Dateien und kann das Repository
rem    beschaedigen. robocopy haelt beide Ordner deckungsgleich.
rem
rem  Aufruf:
rem    "Auf GitHub hochladen.bat"                 (Standard-Beschreibung)
rem    "Auf GitHub hochladen.bat" Kurze Notiz     (eigene Beschreibung)
rem
rem  ACHTUNG beim Bearbeiten: reines ASCII mit CRLF-Zeilenenden, sonst
rem  zerlegt der cmd-Parser die Zeilen an falschen Stellen.
rem ===================================================================

set "QUELLE=%~dp0"
set "REPO=C:\Users\young\gta6-website"
set "SEITE=https://luciajason.de"

rem ---- Beschreibung: alles was hinter dem Dateinamen steht ----
set "NOTIZ=%*"
if not defined NOTIZ set "NOTIZ=Stand aktualisiert"

echo.
echo   GRAND THEFT AUTO VI - Fan-Seite
echo   Aktueller Stand wird zu GitHub hochgeladen...
echo.

if not exist "%REPO%\.git" (
  echo   [FEHLER] Kein Repository unter:
  echo   %REPO%
  echo.
  pause
  exit /b 1
)

rem ---- 1. Erst holen, was auf GitHub liegt ----
rem Sonst geht z.B. eine dort angelegte CNAME-Datei beim Spiegeln verloren.
echo   [1/4] Stand von GitHub holen...
git -C "%REPO%" fetch origin --quiet
git -C "%REPO%" merge --ff-only origin/main --quiet
if errorlevel 1 (
  echo.
  echo   [FEHLER] Lokal und GitHub sind auseinandergelaufen.
  echo   Das muss von Hand zusammengefuehrt werden - am einfachsten
  echo   in GitHub Desktop.
  echo.
  pause
  exit /b 1
)

rem ---- 2. Ordner spiegeln ----
rem /MIR loescht im Ziel, was hier geloescht wurde - so bleiben beide
rem   Ordner wirklich gleich.
rem /XD .git  muss ausgeschlossen bleiben, sonst loescht /MIR das
rem   Repository selbst.
echo   [2/4] Dateien spiegeln...
robocopy "%QUELLE%." "%REPO%" /MIR /NFL /NDL /NJH /NJS /NP ^
  /XD ".git" "_backup" "__pycache__" ^
  /XF "server.log" >nul
if errorlevel 8 (
  echo   [FEHLER] Kopieren fehlgeschlagen.
  pause
  exit /b 1
)

rem ---- 3. Committen ----
echo   [3/4] Aenderungen erfassen...
git -C "%REPO%" add -A
git -C "%REPO%" diff --cached --quiet
if not errorlevel 1 (
  echo.
  echo   Keine Aenderungen - auf GitHub liegt schon der aktuelle Stand.
  echo.
  timeout /t 6 >nul
  exit /b 0
)
git -C "%REPO%" commit -m "%NOTIZ%" --quiet
if errorlevel 1 (
  echo   [FEHLER] Commit fehlgeschlagen.
  pause
  exit /b 1
)

rem ---- 4. Hochladen ----
echo   [4/4] Zu GitHub hochladen...
git -C "%REPO%" push origin main --quiet
if errorlevel 1 (
  echo.
  echo   [FEHLER] Hochladen fehlgeschlagen.
  echo   Meist fehlt die Anmeldung - einmal GitHub Desktop oeffnen
  echo   und dort anmelden, danach geht es wieder.
  echo.
  pause
  exit /b 1
)

cls
echo.
echo   GRAND THEFT AUTO VI - Fan-Seite
echo   --------------------------------------------------------
echo   Hochgeladen.
echo.
echo   Beschreibung  %NOTIZ%
echo   Seite         %SEITE%
echo.
echo   GitHub Pages baut die Seite jetzt neu - das dauert
echo   ungefaehr eine Minute. Danach im Browser einmal mit
echo   Strg+F5 neu laden, sonst zeigt er die alte Fassung.
echo   --------------------------------------------------------
echo.
timeout /t 12 >nul
exit /b 0
