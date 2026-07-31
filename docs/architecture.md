# Arquitectura inicial de Nexo

```text
┌───────────────────────────────────────────────────────────────┐
│ Interfaces                                                    │
│ CMS/PWA React        ChatGPT App        Otras automatizaciones│
└──────────┬──────────────────┬──────────────────┬───────────────┘
           │                  │ MCP tools        │ API/MCP
           ▼                  ▼                  ▼
┌───────────────────────────────────────────────────────────────┐
│ Casos de uso y autorización                                   │
│ clientes · activos · operaciones · documentos · análisis      │
└──────────────────────────────┬────────────────────────────────┘
                               ▼
┌───────────────────────────────────────────────────────────────┐
│ Supabase                                                      │
│ Auth · PostgreSQL/RLS · Storage · auditoría                   │
└───────────────────────────────────────────────────────────────┘
```

## Decisiones

- Las entidades genéricas son multitenant y llevan `organization_id`.
- Las diferencias entre industrias viven en tipos configurables y `custom_data`.
- Los campos importantes para relaciones, filtros e integridad siguen siendo
  columnas estructuradas.
- Los documentos conservan un `snapshot` inmutable de lo emitido.
- La IA no recibe SQL arbitrario: consume herramientas con entradas y salidas
  acotadas.
- Las escrituras de alto impacto necesitan autorización y confirmación humana.

## Primer flujo vertical

1. Elegir institución y destino.
2. Elegir una caja disponible.
3. Reservar el número de remito de forma atómica.
4. Emitir el documento con snapshot del contenido.
5. Capturar firma de entrega.
6. Registrar retiro y condición de regreso.
7. Actualizar ubicación y estado del activo.
8. Conservar eventos y auditoría.
