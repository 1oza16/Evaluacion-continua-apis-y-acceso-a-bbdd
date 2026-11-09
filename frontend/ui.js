document.addEventListener("DOMContentLoaded", async () => {
    const container = document.getElementById("endpoints-container");
    const statusBadge = document.getElementById("status-badge");
    const endpointInfo = document.getElementById("endpoint-info");
    const jsonViewer = document.getElementById("json-viewer");
    const tableHead = document.getElementById("table-head");
    const tableBody = document.getElementById("table-body");

    try {
        const schema = await API.obtenerEsquema();
        renderizarInterfaz(schema);
    } catch (err) {
        container.innerHTML = `<div style="color:var(--error); padding: 10px;">Error al conectar con la API: ${err.message}</div>`;
    }

    // Detecta el tipo real de dato incluso en esquemas complejos de FastAPI (ej: bool | None)
    function resolverTipoParametro(schemaParam) {
        if (!schemaParam) return "string";
        if (schemaParam.type) return schemaParam.type;
        if (schemaParam.anyOf) {
            const tipos = schemaParam.anyOf
                .map((t) => t.type)
                .filter((t) => t && t !== "null");
            if (tipos.length > 0) return tipos[0];
        }
        return "string";
    }

    function renderizarInterfaz(schema) {
        container.innerHTML = "";
        const paths = schema.paths || {};
        const metodos = { GET: [], POST: [], PUT: [], DELETE: [], PATCH: [] };

        Object.keys(paths).forEach((path) => {
            Object.keys(paths[path]).forEach((metodo) => {
                const metUpper = metodo.toUpperCase();
                if (metodos[metUpper]) {
                    metodos[metUpper].push({
                        path,
                        metodo: metUpper,
                        detalle: paths[path][metodo]
                    });
                }
            });
        });

        Object.keys(metodos).forEach((metodo) => {
            const endpoints = metodos[metodo];
            if (endpoints.length === 0) return;

            const groupAccordion = document.createElement("details");
            groupAccordion.className = `group-accordion group-${metodo.toLowerCase()}`;
            groupAccordion.open = true;

            const summary = document.createElement("summary");
            summary.innerHTML = `<span class="badge-method badge-${metodo.toLowerCase()}">${metodo}</span> <strong>Peticiones ${metodo}</strong> <span class="count">(${endpoints.length})</span>`;
            groupAccordion.appendChild(summary);

            const content = document.createElement("div");
            content.className = "group-content";

            endpoints.forEach((ep) => {
                const card = crearTarjetaEndpoint(ep, schema);
                content.appendChild(card);
            });

            groupAccordion.appendChild(content);
            container.appendChild(groupAccordion);
        });
    }

    function crearTarjetaEndpoint(ep, schema) {
        const card = document.createElement("div");
        card.className = `endpoint-card border-${ep.metodo.toLowerCase()}`;

        const params = ep.detalle.parameters || [];
        const requestBodySchema = ep.detalle.requestBody;

        let inputsHTML = "";

        // Generar inputs dinámicos según el tipo de dato detectado
        params.forEach((p) => {
            const tipo = resolverTipoParametro(p.schema);
            const isRequired = p.required;
            const labelText = `<strong>${p.name}</strong> <small>(${p.in} - ${tipo})</small>:`;

            if (tipo === "boolean") {
                inputsHTML += `
                    <div class="field-group">
                        <label>${labelText}</label>
                        <select data-param-type="${p.in}" data-param-name="${p.name}">
                            <option value="">-- Sin filtrar (${isRequired ? 'Requerido' : 'Opcional'}) --</option>
                            <option value="true">true (Completada)</option>
                            <option value="false">false (Pendiente)</option>
                        </select>
                    </div>
                `;
            } else if (tipo === "integer" || tipo === "number") {
                inputsHTML += `
                    <div class="field-group">
                        <label>${labelText}</label>
                        <input type="number" data-param-type="${p.in}" data-param-name="${p.name}" placeholder="${isRequired ? 'Requerido (Número)' : 'Opcional (Número)'}" />
                    </div>
                `;
            } else {
                inputsHTML += `
                    <div class="field-group">
                        <label>${labelText}</label>
                        <input type="text" data-param-type="${p.in}" data-param-name="${p.name}" placeholder="${isRequired ? 'Requerido' : 'Opcional'}" />
                    </div>
                `;
            }
        });

        if (requestBodySchema) {
            const bodyExample = generarEjemploBody(requestBodySchema, schema);
            inputsHTML += `
                <div class="field-group">
                    <label><strong>Cuerpo de la Petición (JSON)</strong>:</label>
                    <textarea data-body="true" rows="4">${JSON.stringify(bodyExample, null, 2)}</textarea>
                </div>
            `;
        }

        card.innerHTML = `
            <div class="endpoint-header">
                <span class="endpoint-path">${ep.path}</span>
            </div>
            <form class="endpoint-form">
                ${inputsHTML}
                <button type="submit" class="btn-execute btn-${ep.metodo.toLowerCase()}">Ejecutar ${ep.metodo}</button>
            </form>
        `;

        const form = card.querySelector("form");
        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const pathParams = {};
            const queryParams = {};
            let bodyData = null;

            // Recolectar parámetros tanto de inputs como de selects
            form.querySelectorAll("[data-param-name]").forEach((control) => {
                const type = control.dataset.paramType;
                const name = control.dataset.paramName;
                const val = control.value.trim();

                if (val !== "") {
                    if (type === "path") pathParams[name] = val;
                    if (type === "query") queryParams[name] = val;
                }
            });

            const bodyTextarea = form.querySelector("textarea[data-body='true']");
            if (bodyTextarea) {
                try {
                    bodyData = JSON.parse(bodyTextarea.value);
                } catch {
                    alert("El JSON ingresado no es válido.");
                    return;
                }
            }

            const res = await API.ejecutar({
                ruta: ep.path,
                metodo: ep.metodo,
                pathParams,
                queryParams,
                body: bodyData
            });

            actualizarSalida(res);
        });

        return card;
    }

    function generarEjemploBody(requestBody, schema) {
        try {
            const ref = requestBody.content["application/json"].schema.$ref;
            if (!ref) return {};
            const schemaName = ref.split("/").pop();
            const properties = schema.components.schemas[schemaName].properties;

            const example = {};
            Object.keys(properties).forEach((key) => {
                const prop = properties[key];
                const propType = resolverTipoParametro(prop);
                if (propType === "integer" || propType === "number") example[key] = 1;
                else if (propType === "boolean") example[key] = false;
                else example[key] = "texto_ejemplo";
            });
            return example;
        } catch {
            return {};
        }
    }

    function actualizarSalida(res) {
        statusBadge.textContent = `HTTP ${res.status}`;
        statusBadge.className = res.ok ? "badge success" : "badge error";
        endpointInfo.textContent = res.url;

        if (res.data !== null) {
            jsonViewer.textContent = JSON.stringify(res.data, null, 2);
        } else {
            jsonViewer.textContent = res.ok ? "// HTTP 204 No Content" : "// Petición sin respuesta";
        }

        renderizarTablaDinamica(res.data);
    }

    function renderizarTablaDinamica(data) {
        tableHead.innerHTML = "";
        tableBody.innerHTML = "";

        if (!data || (Array.isArray(data) && data.length === 0)) {
            tableBody.innerHTML = `<tr><td style="text-align:center; color: var(--text-dim);">Sin datos tabulares que mostrar</td></tr>`;
            return;
        }

        const items = Array.isArray(data) ? data : [data];
        if (typeof items[0] !== "object" || items[0] === null) {
            tableBody.innerHTML = `<tr><td>${items[0]}</td></tr>`;
            return;
        }

        const columnas = Object.keys(items[0]);

        const trHead = document.createElement("tr");
        columnas.forEach((col) => {
            const th = document.createElement("th");
            th.textContent = col.toUpperCase();
            trHead.appendChild(th);
        });
        tableHead.appendChild(trHead);

        items.forEach((item) => {
            const tr = document.createElement("tr");
            columnas.forEach((col) => {
                const td = document.createElement("td");
                const val = item[col];
                if (typeof val === "boolean") {
                    td.innerHTML = val ? `<span class="badge success">true</span>` : `<span class="badge warning">false</span>`;
                } else {
                    td.textContent = val !== null && val !== undefined ? val : "";
                }
                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    }
});
