import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Request, Response } from "express";
import * as z from "zod/v4";
import { config, bearerToken, userClient } from "./config.js";
import { demoAssets, demoOperations, statusLabel, type DemoOperation } from "./demo-data.js";

type ToolExtra = { requestInfo?: { headers?: Record<string, string | string[] | undefined> } };

function requestToken(extra: ToolExtra): string | null {
  const authorization = extra.requestInfo?.headers?.authorization;
  return bearerToken(typeof authorization === "string" ? authorization : undefined);
}

function searchText(operation: DemoOperation): string {
  return `${operation.number} · ${operation.customer} · ${operation.asset} · ${statusLabel(operation.status)}`;
}

function errorResult(message: string) {
  return { isError: true, content: [{ type: "text" as const, text: message }] };
}

async function accessibleOperations(extra: ToolExtra) {
  const token = requestToken(extra);
  if (!token) {
    if (config.demoMode) return { mode: "demo" as const, operations: demoOperations };
    throw new Error("Authentication required. Connect Nexo with a valid Supabase access token.");
  }

  const client = userClient(token);
  const { data, error } = await client
    .from("operations")
    .select("id, number, status, title, expected_start_at, expected_end_at, customers(legal_name), operation_assets(assets(name))")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Could not read operations: ${error.message}`);

  return {
    mode: "supabase" as const,
    operations: (data ?? []).map((row: any) => ({
      id: `operation:${row.id}`,
      number: row.number,
      customer: row.customers?.legal_name ?? "Sin institución",
      destination: row.title ?? "Sin destino indicado",
      asset: row.operation_assets?.[0]?.assets?.name ?? "Sin caja asociada",
      status: row.status,
      sentAt: row.expected_start_at,
      dueAt: row.expected_end_at,
      signedBy: null,
    })),
  };
}

async function accessibleAssets(extra: ToolExtra) {
  const token = requestToken(extra);
  if (!token) {
    if (config.demoMode) return { mode: "demo" as const, assets: demoAssets };
    throw new Error("Authentication required. Connect Nexo with a valid Supabase access token.");
  }

  const client = userClient(token);
  const { data, error } = await client
    .from("assets")
    .select("id, code, name, status")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(`Could not read assets: ${error.message}`);
  return {
    mode: "supabase" as const,
    assets: (data ?? []).map((row: any) => ({ id: `asset:${row.id}`, code: row.code, name: row.name, status: row.status, pieces: 0 })),
  };
}

function createServer() {
  const server = new McpServer(
    { name: "nexo-operations", version: "0.1.0" },
    { instructions: "Nexo gives authorized, read-only operational information. Use search or list_remitos to locate records, then fetch or get_remito for detail. Never infer access to another organization; the server enforces tenant permissions." },
  );

  server.registerTool("search", {
    title: "Buscar en Nexo",
    description: "Use this when the user wants to find remitos, cajas de instrumental o instituciones en Nexo. Returns citation-ready result identifiers.",
    inputSchema: { query: z.string().min(1).max(200).describe("Texto a buscar") },
    outputSchema: { results: z.array(z.object({ id: z.string(), title: z.string(), url: z.string() })) },
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  }, async ({ query }, extra) => {
    try {
      const normalized = query.toLocaleLowerCase();
      const { operations } = await accessibleOperations(extra);
      const { assets } = await accessibleAssets(extra);
      const operationResults = operations.filter((item) => searchText(item).toLocaleLowerCase().includes(normalized)).map((item) => ({ id: item.id, title: `${item.number} · ${item.customer}`, url: `${config.appUrl}/operations/${item.id.replace("operation:", "")}` }));
      const assetResults = assets.filter((item) => `${item.code} ${item.name}`.toLocaleLowerCase().includes(normalized)).map((item) => ({ id: item.id, title: `${item.code} · ${item.name}`, url: `${config.appUrl}/assets/${item.id.replace("asset:", "")}` }));
      const results = [...operationResults, ...assetResults].slice(0, 20);
      return { structuredContent: { results }, content: [{ type: "text" as const, text: JSON.stringify({ results }) }] };
    } catch (error) { return errorResult(error instanceof Error ? error.message : "Search failed."); }
  });

  server.registerTool("fetch", {
    title: "Abrir registro de Nexo",
    description: "Use this after search when the user needs the details of a specific remito or asset. The id must be one returned by search.",
    inputSchema: { id: z.string().min(1).max(200).describe("Identificador devuelto por search") },
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  }, async ({ id }, extra) => {
    try {
      const { operations } = await accessibleOperations(extra);
      const { assets } = await accessibleAssets(extra);
      const operation = operations.find((item) => item.id === id);
      const asset = assets.find((item) => item.id === id);
      const record = operation ?? asset;
      if (!record) return errorResult("Record not found or not accessible.");
      const title = "number" in record ? `${record.number} · ${record.customer}` : `${record.code} · ${record.name}`;
      const url = `${config.appUrl}/${"number" in record ? "operations" : "assets"}/${id.split(":")[1]}`;
      return { content: [{ type: "text" as const, text: JSON.stringify({ id, title, text: JSON.stringify(record), url, metadata: { source: "Nexo" } }) }] };
    } catch (error) { return errorResult(error instanceof Error ? error.message : "Fetch failed."); }
  });

  server.registerTool("list_remitos", {
    title: "Listar remitos",
    description: "Use this when the user asks for remitos recientes, remitos en curso, devoluciones o retiros pendientes. Read-only and limited to the user's authorized organizations.",
    inputSchema: { status: z.enum(["draft", "in_use", "return_due", "returned"]).optional().describe("Filtrar por estado"), limit: z.number().int().min(1).max(50).default(20).describe("Cantidad máxima") },
    outputSchema: { remitos: z.array(z.object({ id: z.string(), number: z.string(), customer: z.string(), asset: z.string(), status: z.string(), dueAt: z.string().nullable() })) },
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  }, async ({ status, limit }, extra) => {
    try {
      const { operations, mode } = await accessibleOperations(extra);
      const remitos = operations.filter((item) => !status || item.status === status).slice(0, limit).map((item) => ({ id: item.id, number: item.number, customer: item.customer, asset: item.asset, status: statusLabel(item.status), dueAt: item.dueAt ?? null }));
      return { structuredContent: { remitos }, content: [{ type: "text" as const, text: `Nexo devolvió ${remitos.length} remitos (${mode}).` }] };
    } catch (error) { return errorResult(error instanceof Error ? error.message : "Could not list remitos."); }
  });

  server.registerTool("get_remito", {
    title: "Consultar un remito",
    description: "Use this when the user asks for the complete operational detail of a specific remito, including institution, box, dates and signature.",
    inputSchema: { id: z.string().min(1).describe("Id del remito, por ejemplo operation:o1") },
    outputSchema: { remito: z.object({ id: z.string(), number: z.string(), customer: z.string(), destination: z.string(), asset: z.string(), status: z.string(), sentAt: z.string().nullable(), dueAt: z.string().nullable(), signedBy: z.string().nullable() }) },
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  }, async ({ id }, extra) => {
    try {
      const { operations } = await accessibleOperations(extra);
      const operation = operations.find((item) => item.id === id || item.number === id);
      if (!operation) return errorResult("Remito no encontrado o no autorizado.");
      const remito = { id: operation.id, number: operation.number, customer: operation.customer, destination: operation.destination, asset: operation.asset, status: statusLabel(operation.status), sentAt: operation.sentAt ?? null, dueAt: operation.dueAt ?? null, signedBy: operation.signedBy ?? null };
      return { structuredContent: { remito }, content: [{ type: "text" as const, text: `${operation.number} está ${statusLabel(operation.status)}.` }] };
    } catch (error) { return errorResult(error instanceof Error ? error.message : "Could not get remito."); }
  });

  return server;
}

const app = createMcpExpressApp({ host: "0.0.0.0" });
app.get("/health", (_req: Request, res: Response) => res.json({ ok: true, service: "nexo-operations", version: "0.1.0" }));
app.post("/mcp", async (req, res) => {
  try {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    const server = createServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    res.on("close", () => { void transport.close(); void server.close(); });
  } catch (error) {
    console.error("MCP request failed", error);
    if (!res.headersSent) res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal server error" }, id: null });
  }
});
app.get("/mcp", (_req: Request, res: Response) => res.status(405).set("Allow", "POST").send("Method Not Allowed"));
app.delete("/mcp", (_req: Request, res: Response) => res.status(405).set("Allow", "POST").send("Method Not Allowed"));

app.listen(config.port, "0.0.0.0", () => console.log(`Nexo MCP server listening on http://localhost:${config.port}/mcp (${config.demoMode ? "demo" : "authenticated"} mode)`));
