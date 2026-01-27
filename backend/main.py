# Force reload - 2026-01-20 01:40
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
import os

# IMPORTANTE: Verifica que estas importaciones coincidan con tus nombres de archivo reales
from routers import auth, users, accounting, academic, config, logistics, speakers

# 1. Crear carpeta física si no existe
UPLOAD_DIR = os.path.join("archivo", "vouchers")
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI(title="SIMR 2026 API - Nucleus", version="2.0.1")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print(f"❌ ERROR DE VALIDACIÓN EN {request.method} {request.url}")
    print(f"   Detalles: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": str(exc.body)},
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import traceback
    error_msg = traceback.format_exc()
    print(f"🚨 FATAL ERROR EN {request.method} {request.url}:")
    print(error_msg)
    
    # Escribir a un archivo para lectura remota
    with open("last_backend_error.txt", "w", encoding="utf-8") as f:
        f.write(error_msg)
        f.write("\n\n--- DEBUG BODY ---\n")
        try:
            if hasattr(exc, 'body'):
                # Intenta convertir FormData a dict simple para ver claves
                import starlette.datastructures
                if isinstance(exc.body, starlette.datastructures.FormData):
                    f.write(str(dict(exc.body)))
                else:
                    f.write(str(exc.body))
        except Exception as e:
            f.write(f"Error inspecting body: {e}")
        
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "traceback": error_msg}
    )

# 2. MONTAR LA CARPETA ESTÁTICA
app.mount("/vouchers", StaticFiles(directory=UPLOAD_DIR), name="vouchers")

# Mount 'archivo' folder to serve uploaded files locally
if not os.path.exists("archivo"):
    os.makedirs("archivo", exist_ok=True)
app.mount("/archivo", StaticFiles(directory="archivo"), name="archivo")

# 1. Configuración de CORS (Permisiva para desarrollo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Montaje de Routers (La Sutura Crítica)
# Observa bien los prefijos. Si el router tiene @router.get("/"), la ruta final es el prefijo.

app.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
app.include_router(users.router, prefix="/users", tags=["Usuarios"]) 
app.include_router(accounting.router, prefix="/accounting", tags=["Contabilidad"])
app.include_router(academic.router, prefix="/academic", tags=["Académico"])
app.include_router(config.router, prefix="/config", tags=["Configuración"]) 
app.include_router(logistics.router, prefix="/logistics", tags=["Logística"])
app.include_router(speakers.router, prefix="/speakers", tags=["Ponentes"])

from routers import research
app.include_router(research.router, prefix="/research", tags=["Investigación (Experto)"])

from routers import treasury_config, registrations, accounting_v2
app.include_router(treasury_config.router)
app.include_router(registrations.router)
app.include_router(accounting_v2.router)

from routers import committee, program, treasury
app.include_router(treasury.router)
app.include_router(committee.router, prefix="/committee", tags=["Comité Organizador"])
app.include_router(program.router, prefix="/program", tags=["Program Hub (Agenda)"])

from routers import roadmap, planning, dashboard, coupons
app.include_router(roadmap.router)
app.include_router(planning.router)
app.include_router(dashboard.router)
app.include_router(coupons.router)

from routers import polls, documents
app.include_router(polls.router)
app.include_router(documents.router)

@app.get("/")
def health_check():
    return {"status": "vital_signs_stable", "system": "SIMR 2026"}

# DIAGNÓSTICO DE RUTAS ACTIVAS
# Forces reload
@app.on_event("startup")
def startup_event():
    print("🔥🔥🔥 SERVER RESTART: RADICAL FIX ACTIVE 🔥🔥🔥")
    # 0. Crear tablas en BD si no existen
    from database import engine, Base
    import models # Registrar modelos
    import models_research # Registrar modelos de investigación
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas de Base de Datos verificadas/creadas.")

    # Inicializar Firebase para Tiempo Real
    try:
        from core.firebase import init_firebase
        init_firebase()
        print("🔥 Firebase inicializado correctamente.")
    except Exception as e:
        print(f"⚠️ Error inicializando Firebase en startup: {e}")

    print("\n" + "="*50)
    print("🚑 DIAGNÓSTICO DE RUTAS ACTIVAS:")
    for route in app.routes:
        # Imprime método y ruta (ej: GET /accounting/transactions)
        methods = ", ".join(route.methods) if hasattr(route, "methods") else "None"
        print(f"   👉 {methods}  {route.path}")
    print("="*50 + "\n")
