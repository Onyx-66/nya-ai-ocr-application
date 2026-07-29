@echo off
REM MangaText AI — Local Translation Controller launcher (Windows RDP)
cd /d %~dp0
echo Starting MangaText AI Translation Controller...
python main.py
echo.
echo Server stopped. Press any key to close.
pause >nul