@echo off
echo ==========================================
echo   SIMR 2026 - Inicio Rapido de Servidores
echo ==========================================

echo [1/5] Limpiando procesos en puertos ocupados (8000, 5173, 8080, 4000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4000') do taskkill /F /PID %%a 2>nul

echo [2/5] Iniciando infraestructura Docker (DB/pgAdmin)...
docker-compose up -d

echo [3/5] Iniciando Backend FastAPI...
start "SIMR Backend" cmd /k "cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload"

echo [4/5] Iniciando Frontend Vite...
start "SIMR Frontend" cmd /k "cd frontend && npm run dev"

echo [5/5] Iniciando Firebase Emulators...
start "SIMR Firebase" cmd /k "firebase emulators:start"

echo ------------------------------------------
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo pgAdmin:  http://localhost:5050
echo Firebase: http://localhost:4000
echo ------------------------------------------
echo Los servidores se estan iniciando en ventanas separadas.
echo Presiona cualquier tecla para cerrar esta ventana...
pause > nul
