# Nexo Demo

Demo portable de una plataforma multitenant para operaciones, activos retornables, documentos numerados e interacción con IA. El primer caso de uso representa el flujo de instrumental quirúrgico de Medcare SRL.

## Ejecutar

```bash
npm install
npm run dev
```

Sin variables de entorno la aplicación inicia en modo demostración, con datos ficticios. Copiar `.env.example` a `.env.local` para configurar Supabase.

## Servidor MCP

La primera versión expone herramientas de sólo lectura en `/mcp`: `search`, `fetch`, `list_remitos` y `get_remito`. En modo demo usa datos ficticios; en producción requiere un token Supabase Bearer y las consultas quedan protegidas por RLS.

```bash
npm run mcp:dev
curl http://localhost:3000/health
```

Para conectar ChatGPT durante el desarrollo se necesita una URL HTTPS pública que apunte al puerto 3000 y registrar esa URL terminada en `/mcp` en Developer Mode. El servidor todavía no habilita escrituras ni captura de firmas.

## Principios

- Git es la fuente de verdad del código.
- Supabase es la fuente de verdad de datos, identidad y aislamiento multitenant.
- Replit es un entorno opcional de generación, edición y demostración.
- El cliente web nunca recibe una clave `service_role`.
- La futura capa MCP reutilizará las mismas entidades, pero expondrá herramientas pequeñas, autorizadas y auditables en lugar de SQL genérico.

## Próximos incrementos

1. Inicio de sesión y selección de organización.
2. Repositorios Supabase para clientes, activos y operaciones.
3. Emisión atómica y numerada de remitos.
4. Firma táctil, snapshot inmutable y PDF.
5. OAuth para la conexión remota y auditoría de cada consulta MCP.
6. Widgets MCP para ChatGPT y confirmaciones de escritura.
