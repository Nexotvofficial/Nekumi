@echo off
chcp 65001 >nul
title Nekutoon Titan Agent
cd /d "C:\Users\Administrator\.gemini\antigravity\scratch\Nekumi"
"C:\Python315\python.exe" "C:\Users\Administrator\.gemini\antigravity\scratch\Nekumi\nekutoon_agent.py" %*
pause
