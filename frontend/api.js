const API = {
    // Obtiene el esquema autogenerado por FastAPI (/openapi.json)
    async obtenerEsquema() {
        const res = await fetch("/openapi.json");
        if (!res.ok) throw new Error("No se pudo obtener el esquema OpenAPI de FastAPI");
        return await res.json();
    },

    // Función genérica ejecutra para CUALQUIER endpoint y método
    async ejecutar({ ruta, metodo, pathParams = {}, queryParams = {}, body = null }) {
        let url = ruta;

        // 1. Reemplazar parámetros de ruta (ej: /tareas/{tarea_id} -> /tareas/5)
        Object.keys(pathParams).forEach((key) => {
            url = url.replace(`{${key}}`, encodeURIComponent(pathParams[key]));
        });

        // 2. Construir Query Parameters (ej: ?estado=true)
        const queryString = new URLSearchParams();
        Object.keys(queryParams).forEach((key) => {
            if (queryParams[key] !== undefined && queryParams[key] !== null && queryParams[key] !== "") {
                queryString.append(key, queryParams[key]);
            }
        });

        if ([...queryString].length > 0) {
            url += `?${queryString.toString()}`;
        }

        // 3. Opciones de la petición HTTP
        const options = {
            method: metodo.toUpperCase(),
            headers: { "Content-Type": "application/json" }
        };

        if (body && ["POST", "PUT", "PATCH"].includes(metodo.toUpperCase())) {
            options.body = typeof body === "string" ? body : JSON.stringify(body);
        }

        // 4. Realizar la petición
        const res = await fetch(url, options);
        let data = null;

        if (res.status !== 204) {
            try {
                data = await res.json();
            } catch {
                data = null;
            }
        }

        return {
            status: res.status,
            ok: res.ok,
            data: data,
            url: url
        };
    }
};