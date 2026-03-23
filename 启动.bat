@echo off
cd /d "%~dp0"
echo Starting Ollama...
start "" ollama serve
echo Starting GPU monitor...
start "" node server.cjs
timeout /t 2 /nobreak >nul
echo Starting frontend...
start "" http://localhost:5173
npm run dev
echo.
echo Frontend stopped.
