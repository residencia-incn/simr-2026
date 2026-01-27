# 📔 BITÁCORA DE IMPLEMENTACIÓN - SIMR 2026

Este documento registra todas las dependencias, configuraciones y tecnologías instaladas en el proyecto para asegurar la replicabilidad en diferentes entornos de desarrollo.

## 🛠️ Requisitos del Sistema
- **OS:** Windows / Linux / macOS
- **Node.js:** >= 18.x
- **Python:** >= 3.10
- **PostgreSQL:** >= 15.x
- **Docker:** (Opcional, para DB)

---

## 📦 Dependencias Instaladas

### 🔹 Backend (FastAPI)
| Fecha | Tecnología | Comando de Instalación | Propósito |
| :--- | :--- | :--- | :--- |
| 18/01/2026 | **Firebase Admin** | `pip install firebase-admin` | Conexión del Backend con Firestore (Real-time). |

### 🔸 Frontend (React)
| Fecha | Tecnología | Comando de Instalación | Propósito |
| :--- | :--- | :--- | :--- |
| 18/01/2026 | **Firebase SDK** | `npm install firebase` | Conexión del cliente con Firestore (Real-time). |
| 26/01/2026 | **Recharts** | `npm install recharts` | Biblioteca de gráficos de alta fidelidad para analíticas financieras. |
| 26/01/2026 | **Accounting V2 Stats** | Backend Internal | Endpoint unificado `/stats` para agregación masiva de datos contables. |

---

## ⚙️ Configuraciones Críticas

### 🔧 Firebase Emulators (Desarrollo Local)
Para correr el entorno de tiempo real sin usar la nube:
1. Tener instalado Firebase CLI: `npm install -g firebase-tools`.
2. Ejecutar emuladores: `firebase emulators:start`.
3. El frontend y backend detectarán automáticamente `localhost:8080`.

### 🔐 Variables de Entorno (.env)
Asegúrate de tener estas variables en `backend/.env`:
```ini
FIRESTORE_EMULATOR_HOST="localhost:8080"
GCLOUD_PROJECT="demo-simr-2026"
```

---

> [!IMPORTANT]
> **REGLA GLOBAL:** Cada vez que se agregue una nueva dependencia o tecnología, se DEBE registrar en esta bitácora con su respectivo propósito y comando de instalación.
