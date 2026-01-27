---
description: Inicia todos los servidores del proyecto (Docker, Backend, Frontend)
---

Este workflow inicia la infraestructura de base de datos, el backend FastAPI y el frontend Vite.

// turbo-all
1. Iniciar Docker Compose
```powershell
docker-compose up -d
```

2. Iniciar Backend (en segundo plano)
```powershell
cd backend; .\venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

3. Iniciar Frontend (en segundo plano)
```powershell
cd frontend; cmd /c .\node_modules\.bin\vite.cmd
```

4. Iniciar Firebase Emulators (en segundo plano)
```powershell
firebase emulators:start
```
