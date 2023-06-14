@echo off
title SteroidMC - SOLVER! - by @spook

if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo Dependencies installed. Re-run this script to start the application.
)

:run
echo Starting the application.
node index.js

echo Application crashed. Restarting...
timeout /t 2 >nul
goto run
