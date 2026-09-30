# n8n MCP: conector de n8n para Claude

Servidor [MCP](https://modelcontextprotocol.io) que conecta Claude (Desktop, Code o cualquier cliente MCP) con una
instancia de n8n a través de su API pública. Con él Claude puede:

- **Workflows**: listar, ver, crear, editar nodo a nodo, publicar/despublicar, archivar, borrar, etiquetar, ver versiones anteriores.
- **Ejecuciones**: listar, ver un resumen del error y de la salida de cada nodo, reintentar, parar, borrar.
- **Ejecutar workflows** llamando a su webhook (producción o test).
- **Credenciales**: listar (sin secretos), consultar el esquema de un tipo, crear, actualizar, probar, borrar.
- **Data tables**: crear tablas, leer, insertar, actualizar/upsert y borrar filas.
- **Tags, variables, proyectos, usuarios** y la **auditoría de seguridad** de n8n.

Probado contra n8n 2.41; funciona también con n8n 1.x (las herramientas marcadas "n8n 2.x" necesitan esa versión).

## 1. Requisitos

- Node.js 20 o superior.
- Una **API key de n8n**: en n8n, *Settings → n8n API → Create an API key*. En n8n 2.x puedes limitar sus permisos
  (scopes); dale solo los que quieras que Claude use.

## 2. Instalación

```bash
git clone <este repositorio>
cd e1577toplearning/n8n-mcp
npm install
npm run build
```

## 3. Conectarlo a Claude

Elige la opción que corresponda a cómo usas Claude.

### Opción A: Claude Desktop, como extensión (recomendada)

```bash
npm run pack:mcpb
```

Genera `n8n-mcp.mcpb`. Haz doble clic sobre él (o arrástralo a *Claude Desktop → Settings → Extensions*). Claude te
pedirá la URL de n8n (por defecto `https://n8n.toplearning.org`) y la API key, que se guarda en el llavero del sistema,
no en un archivo de texto. También puedes activar el modo solo lectura.

### Opción B: Claude Desktop, configuración manual

Edita `claude_desktop_config.json` (*Settings → Developer → Edit Config*; en macOS está en
`~/Library/Application Support/Claude/`, en Windows en `%APPDATA%\Claude\`):

```json
{
  "mcpServers": {
    "n8n": {
      "command": "node",
      "args": ["/ruta/completa/a/e1577toplearning/n8n-mcp/dist/index.js"],
      "env": {
        "N8N_API_URL": "https://n8n.toplearning.org",
        "N8N_API_KEY": "TU_API_KEY"
      }
    }
  }
}
```

Reinicia Claude Desktop y verás las herramientas de n8n en el menú de conectores.

### Opción C: Claude Code

```bash
claude mcp add n8n --scope user \
  -e N8N_API_URL=https://n8n.toplearning.org \
  -e N8N_API_KEY=TU_API_KEY \
  -- node /ruta/completa/a/e1577toplearning/n8n-mcp/dist/index.js
```

Comprueba con `claude mcp list` o, dentro de Claude Code, con `/mcp`.

### Opción D: servidor remoto (HTTP)

Para compartir un único servidor entre varias personas o equipos, ejecútalo en modo HTTP en un servidor propio
(por ejemplo, el mismo donde corre n8n), detrás de HTTPS:

```bash
MCP_TRANSPORT=http HOST=0.0.0.0 PORT=3000 \
MCP_AUTH_TOKEN="$(openssl rand -hex 32)" \
N8N_API_URL=https://n8n.toplearning.org N8N_API_KEY=TU_API_KEY \
node dist/index.js
```

- Endpoint MCP: `POST /mcp` (Streamable HTTP, sin estado). Comprobación de salud: `GET /health`.
- Todas las peticiones deben llevar `Authorization: Bearer <MCP_AUTH_TOKEN>`; el servidor no arranca sin token salvo
  que pongas `MCP_ALLOW_NO_AUTH=true`.
- Claude Code: `claude mcp add --transport http n8n https://tu-dominio/mcp --header "Authorization: Bearer <token>"`.
- **claude.ai (web y móvil)**: los conectores personalizados de claude.ai no permiten añadir una cabecera `Authorization`
  fija. Si quieres usar este servidor desde claude.ai, arráncalo con `MCP_ALLOW_NO_AUTH=true` y una ruta secreta
  imposible de adivinar (`MCP_HTTP_PATH=/mcp/<cadena-aleatoria-larga>`), y añade esa URL en
  *Settings → Connectors → Add custom connector*. Trata esa URL como una contraseña.

### ¿Y el MCP que ya trae n8n?

n8n incluye su propio servidor MCP (*Settings → Instance-level MCP*, URL `https://n8n.toplearning.org/mcp-server/http`
con un *access token*). Ese servidor permite a Claude buscar y ejecutar los workflows que marques como disponibles para
MCP. Este proyecto es complementario: usa la API pública con una API key y le da a Claude la gestión completa de la
instancia (crear y editar workflows, depurar ejecuciones, credenciales, data tables…). Puedes tener ambos conectados.

## 4. Configuración

| Variable | Obligatoria | Descripción |
| --- | --- | --- |
| `N8N_API_URL` | Sí | URL de n8n, con o sin `/api/v1`. |
| `N8N_API_KEY` | Sí | API key de n8n. |
| `N8N_WEBHOOK_URL` | No | Base para llamar a los webhooks, si difiere de la URL de n8n. |
| `N8N_MCP_READ_ONLY` | No | `true` para registrar solo herramientas de lectura. |
| `N8N_TIMEOUT_MS` | No | Tiempo máximo por petición a n8n (por defecto 30000). |
| `N8N_MCP_MAX_RESPONSE_CHARS` | No | Las respuestas más largas se recortan (por defecto 80000). |
| `MCP_TRANSPORT` | No | `stdio` (por defecto) o `http`. |
| `PORT`, `HOST`, `MCP_HTTP_PATH` | No | Modo HTTP: puerto (3000), interfaz (127.0.0.1) y ruta (`/mcp`). |
| `MCP_AUTH_TOKEN` | En HTTP | Token Bearer que deben enviar los clientes. |

## 5. Herramientas

| Área | Herramientas |
| --- | --- |
| Conexión | `n8n_health_check` |
| Workflows | `n8n_list_workflows`, `n8n_get_workflow`, `n8n_list_workflow_versions`, `n8n_create_workflow`, `n8n_update_workflow`, `n8n_edit_workflow`, `n8n_activate_workflow`, `n8n_deactivate_workflow`, `n8n_archive_workflow`, `n8n_delete_workflow`, `n8n_set_workflow_tags`, `n8n_transfer_workflow` |
| Ejecuciones | `n8n_list_executions`, `n8n_get_execution`, `n8n_retry_execution`, `n8n_stop_execution`, `n8n_delete_execution`, `n8n_trigger_webhook` |
| Data tables | `n8n_list_data_tables`, `n8n_create_data_table`, `n8n_get_data_table_rows`, `n8n_insert_data_table_rows`, `n8n_update_data_table_rows`, `n8n_delete_data_table_rows` |
| Credenciales | `n8n_list_credentials`, `n8n_get_credential_schema`, `n8n_create_credential`, `n8n_update_credential`, `n8n_test_credential`, `n8n_delete_credential`, `n8n_transfer_credential` |
| Otros | `n8n_list_tags`, `n8n_create_tag`, `n8n_update_tag`, `n8n_delete_tag`, `n8n_list_variables`, `n8n_create_variable`, `n8n_delete_variable`, `n8n_list_projects`, `n8n_list_users`, `n8n_generate_audit` |

Algunos detalles de diseño:

- Las listas devuelven **resúmenes** (id, nombre, estado, triggers, rutas de webhook) para no llenar el contexto de
  Claude; el detalle completo se pide con `n8n_get_workflow` / `n8n_get_execution`.
- `n8n_edit_workflow` aplica cambios concretos (añadir, modificar, renombrar o quitar nodos y conexiones) en un único
  guardado, sin reenviar el workflow entero. Si una operación falla no se guarda nada.
- `n8n_get_execution` en modo `summary` muestra el error, el último nodo ejecutado y, por nodo, el estado, el número de
  items y el primer item de salida: suficiente para depurar la mayoría de fallos.
- Cada herramienta declara si solo lee, si es destructiva o idempotente, para que Claude pida confirmación antes de
  borrar o sobrescribir.

## 6. Ejemplos de uso

- "¿Qué workflows activos tengo y cuáles han fallado hoy?"
- "Mira la última ejecución fallida de *Alta de alumnos* y dime qué nodo falla y por qué."
- "Crea un workflow con un webhook `POST /nuevo-lead` que guarde el email en la data table *leads*, y publícalo."
- "En el workflow *Newsletter*, cambia el canal del nodo Slack a `#marketing`."
- "Lanza el webhook `nuevo-lead` con `{\"email\": \"ana@ejemplo.com\"}` y enséñame la respuesta."

## 7. Seguridad

- La API key da acceso a tu n8n: **no la subas al repositorio** ni la compartas. Si se ha expuesto, revócala en
  *Settings → n8n API* y crea otra.
- Usa `N8N_MCP_READ_ONLY=true` (u opción "Read-only mode" de la extensión) si solo quieres consultar.
- En n8n 2.x, limita los scopes de la API key a lo necesario.
- La API nunca devuelve los secretos de las credenciales.

## 8. Desarrollo

```bash
npm run build       # compila a dist/
npm test            # tests (Vitest)
npm run typecheck   # comprobación de tipos, incluidos los tests
npm run inspect     # abre el MCP Inspector contra dist/index.js
npm run pack:mcpb   # genera la extensión n8n-mcp.mcpb
```

Estructura: `src/index.ts` (arranque stdio/HTTP), `src/server.ts` (registro de herramientas), `src/tools/*`
(herramientas por área), `src/n8n-client.ts` (cliente HTTP de la API), `src/workflow-edits.ts` (ediciones de
workflows) y `src/summaries.ts` (resúmenes de workflows y ejecuciones).
