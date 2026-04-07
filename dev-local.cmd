@echo off
set "NODE_DIR=%~dp0.tools\node\node-v24.14.1-win-x64"
set "PATH=%NODE_DIR%;%PATH%"
"%NODE_DIR%\npm.cmd" run dev
