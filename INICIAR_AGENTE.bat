@echo off
chcp 65001 >nul
title Nekutoon Titan Agent
cd /d "%~dp0"
"C:\Python315\python.exe" "%~dp0nekutoon_agent.py"
pause
