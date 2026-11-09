# API de Gestión de Tareas (FastAPI + SQLite)

Proyecto backend y panel interactivo para la gestión de tareas (CRUD) desarrollado con **FastAPI**, **SQLite** y un cliente web frontend en HTML, CSS y JavaScript Vanilla.

---

## ¿Qué hace el proyecto?

- **Backend con FastAPI y SQLite:**
  - **Crear tareas (`POST /nueva/tarea`)**: Inserta nuevas tareas con título y descripción.
  - **Listar tareas (`GET /tareas`)**: Obtiene todas las tareas registradas en la base de datos.
  - **Filtrar tareas (`GET /tareas/filtradas`)**: Permite filtrar tareas por su estado (completadas / pendientes).
  - **Consultar por ID (`GET /tareas/{tarea_id}`)**: Busca una tarea específica.
  - **Marcar como completada (`PUT /tareas/{tarea_id}/completar`)**: Actualiza el estado de la tarea.
  - **Eliminar tareas (`DELETE /tareas/borrar/{tarea_id}`)**: Elimina una tarea por su identificador.

- **Panel de Control Frontend:**
  - Consume dinámicamente el esquema autogenerado de FastAPI (`/openapi.json`).
  - Genera formularios automáticos para probar y ejecutar cada endpoint de la API.
  - Muestra las respuestas en una tabla interactiva y en un visor de JSON crudo en tiempo real.

---

## Cómo ejecutar el proyecto

1. **Activar el entorno virtual:**
   ```powershell
   .venv\Scripts\activate
   ```

2. **Iniciar el servidor FastAPI:**
   ```powershell
   uvicorn main:app --reload
   ```

3. **Acceder a la aplicación:**
   - Panel Web: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
   - Documentación Swagger UI: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
