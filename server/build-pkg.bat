@echo off
echo === Build Start ===
call npm run build
echo === Build Done ===
call npx pkg . --targets node18-win-x64 --win-hide-console
echo === Pkg Done ===