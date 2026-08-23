@echo off
REM Builds (if needed) and runs the Marvel Watchlist Command Center.
REM Usage: run.bat [port]     (defaults to 8080)

setlocal
cd /d "%~dp0"

set PORT=%1
if "%PORT%"=="" set PORT=8080

echo Compiling...
if not exist out mkdir out
del /q out\*.class 2>nul

for /r src\main\java %%f in (*.java) do (
  set "SOURCES=!SOURCES! %%f"
)

dir /s /b src\main\java\*.java > sources.txt
javac -d out @sources.txt
del sources.txt

xcopy /e /i /y src\main\resources\public out\public >nul

echo Starting server on http://localhost:%PORT% ...
cd out
java com.marvelwatchlist.server.Main %PORT%
