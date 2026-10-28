@echo off
title Attendance System - Live Cloudflare Tunnel
echo ===============================================================
echo   Starting Attendance System Live Backend (Cloudflare Tunnel)
echo ===============================================================
cd /d "%~dp0backend_flask"
call .venv\Scripts\activate.bat
python tunnel.py
pause
