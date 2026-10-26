@echo off
title Attendance System - Local Backend
echo ===============================================================
echo   Starting Local Flask Backend (http://127.0.0.1:5000)
echo ===============================================================
cd /d "%~dp0backend_flask"
call .venv\Scripts\activate.bat
python app.py
pause
