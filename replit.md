# Nexo Demo

Multitenant operations platform demo — surgical instrument tracking (Medcare SRL use case).

## Stack

- **Frontend**: React 19 + Vite + TypeScript (port 5000)
- **Backend / MCP server**: Node.js + Express + `@modelcontextprotocol/sdk` (port 3000)
- **Database**: Supabase (Postgres + auth + RLS)

## Running

```bash
# Frontend (web app)
npm run dev          # starts on port 5000

# MCP server (separate process)
npm run mcp:dev      # starts on port 3000
```

The workflow `Start application` runs `npm run dev` automatically.

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key (secret) |
| `VITE_DEMO_MODE` | Set to `"false"` to use real Supabase data |
| `SUPABASE_URL` | Supabase URL for the MCP server |
| `NEXO_MCP_DEMO_MODE` | Set to `"false"` for real data in MCP |
| `MCP_PORT` | Port for the MCP server (default 3000) |

## Architecture

- Git is source of truth for code.
- Supabase is source of truth for data, identity, and multitenant isolation.
- The browser client never receives a `service_role` key.
- The MCP server exposes read-only tools: `search`, `fetch`, `list_remitos`, `get_remito`.

## User Preferences

- Keep existing project structure and stack.
- Demo mode available when `VITE_DEMO_MODE=true` (no credentials needed).
