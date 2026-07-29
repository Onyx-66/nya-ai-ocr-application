@echo off
REM MangaText AI — Local OCR Controller launcher (Windows RDP)
cd /d %~dp0
echo Starting MangaText AI OCR Controller...
python main.py
echo.
echo Server stopped. Press any key to close.
pause >nul