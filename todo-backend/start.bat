@echo off
cd /d "%~dp0"
if not exist "node_modules" (
    echo npm install を実行しています...
    call npm install
)
echo サーバーを起動しています...
node index.js
