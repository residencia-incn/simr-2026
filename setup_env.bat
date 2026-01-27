@echo off
echo ==========================================
echo   SIMR 2026 - Configuracion de Entorno
echo ==========================================
echo.
echo [1/2] Instalando dependencias del Backend...
cd backend
pip install -r requirements.txt
echo.
echo [2/2] Instalando dependencias del Frontend...
cd ../frontend
npm install
echo.
echo ==========================================
echo   Configuracion completada con exito!
echo   Ya puedes usar start_servers.bat
echo ==========================================
pause
