# Contrato MCP inicial

Arquetipo actual: `tool-only`. La UI del CMS existe por separado; el widget MCP
se agregará cuando las herramientas y autorización estén estables.

| Herramienta | Uso | Escritura | Resultado |
|---|---|---:|---|
| `search` | Encontrar remitos, activos e instituciones | No | `results` con id, título y URL |
| `fetch` | Abrir un resultado encontrado | No | registro con texto y URL |
| `list_remitos` | Listar por estado y límite | No | remitos resumidos |
| `get_remito` | Consultar detalle operativo | No | remito completo |

En modo autenticado, el servidor toma el Bearer token recibido por MCP, crea un
cliente Supabase con ese JWT y deja que las políticas RLS filtren por organización.
El servidor no acepta `organization_id` como una orden de confianza proveniente
del modelo: el acceso se determina por la identidad autenticada.

## Próxima fase

- Añadir OAuth para la conexión remota de ChatGPT en lugar de depender sólo de un
  token de desarrollo.
- Incorporar `create_draft_remito` como escritura reversible y confirmable.
- Registrar el usuario, organización, herramienta y resultado resumido en
  `audit_log`.
- Vincular `list_remitos` con una tarjeta MCP Apps usando
  `ui://nexo-operations/v1.html`.
