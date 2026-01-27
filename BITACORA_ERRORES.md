# 📖 BITÁCORA DE ERRORES Y SOLUCIONES (SIMR 2026)

Este documento sirve como "Cuaderno de Laboratorio" para registrar errores complejos, diagnósticos y soluciones aplicadas, con el fin de evitar reincidencias.

---

## 📅 [16/01/2026]
### 🚨 Error: Firebase Emulators no inician
- **Fecha:** 18/01/2026
- **Síntoma:** El comando `firebase emulators:start` falla o la UI (localhost:4000) no carga.
- **Causa:** Java (JRE/JDK) no está instalado o no está en el PATH de Windows. Los emuladores de Firebase requieren Java.
- **Solución:**
  1. Instalar OpenJDK 11+ o Oracle JDK.
  2. Verificar con `java -version` en una nueva terminal.
  3. Reintentar `firebase emulators:start`.

### 🚨 Error: 500 Internal Server Error en Actividades
- **Fecha:** 16/01/2026
- El frontend mostraba un `Network Error` al intentar guardar una nueva actividad.
- La consola del navegador indicaba bloqueo por **CORS**.
- El log del backend mostraba el código de estado `500 Internal Server Error`.

### 🩺 Diagnóstico Real
Aunque parecía un error de red/cors, la causa raíz estaba en la base de datos PostgreSQL:
1.  **Conflicto de Tipos (Enum):** La columna `status` estaba definida como un Enum estricto (`activitystatus`) en la BD.
2.  **Discrepancia de Datos:** El backend enviaba el nombre del miembro del Enum en mayúsculas (`"CANCELLED"`) mientras que Postgres esperaba el valor exacto en minúsculas (`"cancelado"`).
3.  **Crash:** Al fallar la validación de tipos en la BD, SQLAlchemy lanzaba una excepción `DataError` no manejada correctamente, crasheando el servidor antes de enviar cabeceras CORS.

### 💊 Solución Aplicada (La Opción Nuclear)
Para robustecer el sistema ante cambios rápidos en los estados:
1.  **Cambio de Esquema en BD:** Se convirtieron las columnas `status` y `type` de la tabla `program_activities` de `ENUM` a `VARCHAR` (Texto).
    ```sql
    ALTER TABLE program_activities ALTER COLUMN status TYPE VARCHAR(50) USING status::text;
    ```
2.  **Flexibilidad en Backend:** Se actualizaron los modelos Pydantic (`program.py`) para aceptar `str` en lugar de objetos Enum estrictos.
3.  **Limpieza de UI:** Se eliminaron los inputs redundantes de "Hora Inicio/Fin" del formulario, confiando en la lógica de Bloques Horarios.

### ✅ Resultado
El error desapareció y ahora el sistema acepta cualquier cadena de texto válida para los estados, evitando bloqueos por validación estricta de base de datos.


---

## 📅 [17/01/2026] Error 500 "AttributeError: AuditLog" en Detalles de Usuario

### 🚨 Síntomas
- Al intentar ver el detalle de un usuario, el frontend mostraba "Error de Carga".
- La consola mostraba bloqueo por **CORS** y un error **500** en el backend.
- El log del backend indicaba: `AttributeError: module 'models' has no attribute 'AuditLog'`.

### 🩺 Diagnóstico Real
1.  **Modelo Faltante:** El endpoint de detalle de usuario en `routers/users.py` intentaba consultar la tabla de auditoría (`AuditLog`), pero la clase no existía en `models.py`.
2.  **Columna Faltante:** Durante la verificación, se detectó que el modelo `User` tampoco tenía la columna `roles` (Nivel 3.1: Roles Múltiples), lo que causaba un fallo secundario.
3.  **Bloqueo CORS:** Al ocurrir un error no manejado (crash) en el backend, FastAPI no llegaba a inyectar las cabeceras CORS de respuesta, por lo que el navegador lo reportaba como bloqueo de política CORS.

### 💊 Solución Aplicada
1.  **Ajuste de Modelos:** Se añadió la clase `AuditLog` y la columna `roles` a la clase `User` en `backend/models.py`.
2.  **Actualización de BD:** Se crearon manualmente las tablas y columnas necesarias usando SQL:
    ```sql
    CREATE TABLE audit_logs (id SERIAL PRIMARY KEY, ...);
    ALTER TABLE users ADD COLUMN roles JSONB DEFAULT '[]'::jsonb;
    ```

### ✅ Resultado
El modal de detalle de usuario ahora carga correctamente y la bitácora de auditoría (logs) está funcional.

---

## 📅 [18/01/2026] Error 500 "ResponseValidationError" y Carga Infinita en Planificación

### 🚨 Síntomas
- El módulo de Planificación se quedaba bloqueado en `"Cargando planificación..."`.
- Al intentar guardar acuerdos, el frontend reportaba un error de guardado y la consola mostraba bloqueos por **CORS** y error **500**.
- El log del backend mostraba `fastapi.exceptions.ResponseValidationError` con el mensaje: `Input should be a valid dictionary or object to extract fields from`.

### 🩺 Diagnóstico Real
1.  **Código Entretejido (Corrupción):** Debido a múltiples ediciones concurrentes, el archivo `backend/routers/planning.py` terminó con definiciones duplicadas de la función `update_meeting`. Una de ellas no tenía sentencia `return`, lo que causaba que FastAPI recibiera `None` en lugar del modelo esperado, disparando el error de validación.
2.  **Referencia a Datos Inexistentes:** El objeto `meeting` retornado no siempre se refrescaba tras el guardado de los nuevos acuerdos, causando discrepancias entre la sesión de la BD y el esquema Pydantic.
3.  **Sanitización de Datos:** Campos opcionales como `assigned_user_id` llegaban como strings vacíos `""`, lo que en bases de datos estrictas podría causar fallos de llave foránea si se esperaba un UUID o ID numérico/NULL.

### 💊 Solución Aplicada
1.  **Reescritura Quirúrgica:** Se realizó un sobrescritura completa del archivo `routers/planning.py` para eliminar código "basura" y funciones duplicadas.
2.  **Estrategia "Clean Slate":** Se implementó una lógica de guardado que primero desvincula y borra todos los acuerdos existentes para una reunión y luego los reconstruye recursivamente desde cero.
3.  **Sincronización Obligatoria:** Se añadió `db.commit()` seguido de un `db.refresh(meeting)` antes del `return`. Esto garantiza que Pydantic reciba un objeto SQLAlchemy completamente poblado y válido.
4.  **Limpieza de Inputs:** Se añadió una micro-validación para convertir `""` en `None` en campos opcionales del árbol de acuerdos.

### ✅ Resultado
El módulo de planificación ahora carga instantáneamente y la jerarquía de acuerdos (padres, hijos, nietos) se guarda y persiste correctamente sin errores de validación.
