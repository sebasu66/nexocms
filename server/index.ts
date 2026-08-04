import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import type { Request, Response } from "express";
import * as z from "zod/v4";
import { config, bearerToken, userClient } from "./config.js";
import { demoAssets, demoOperations, statusLabel, type DemoOperation } from "./demo-data.js";

type ToolExtra = { requestInfo?: { headers?: Record<string, string | string[] | undefined> } };

const REMITOS_WIDGET_URI = "ui://widget/remitos.html";

const remitosWidgetHtml = String.raw\`
<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
:root{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#1f2d28;background:#fff}
*{box-sizing:border-box}body{margin:0;padding:14px;background:linear-gradient(145deg,#f7faf8,#fff)}
.header{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.kicker{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#4e806a;font-weight:700}
h1{font-size:18px;margin:3px 0 0;letter-spacing:-.02em}
.count{font-size:11px;color:#71817a;background:#edf5f0;padding:5px 8px;border-radius:999px}
.grid{display:grid;gap:9px}
.card{border:1px solid #e0e9e3;border-radius:12px;background:#fff;padding:12px;box-shadow:0 3px 12px #214d3510}
.card-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
.number{font-weight:750;font-size:13px;color:#176b52}
.customer{font-size:12px;font-weight:650;margin-top:4px}
.asset{font-size:11px;color:#64756d;margin-top:3px}
.status{white-space:nowrap;border-radius:999px;padding:4px 7px;font-size:9px;font-weight:700;background:#edf5f0;color:#287658}
.status.return_due{background:#fff1df;color:#a76222}.status.returned{background:#eef1ef;color:#64736c}.status.draft{background:#edf1f8;color:#526d97}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:11px;padding-top:10px;border-top:1px solid #edf1ee}
.meta span{display:block;font-size:9px;color:#8a9790;text-transform:uppercase;letter-spacing:.04em}
.meta strong{display:block;font-size:10px;color:#42524b;margin-top:2px;font-weight:650}
.actions{display:flex;gap:7px;margin-top:11px}
button{border:0;border-radius:8px;padding:7px 9px;font:inherit;font-size:10px;font-weight:700;cursor:pointer}
.detail{color:#fff;background:#176b52}.ask{color:#286b53;background:#edf6f1}
.empty{padding:20px;text-align:center;color:#71817a;font-size:12px;border:1px dashed #d6e2da;border-radius:10px}
</style>
</head>
<body>
<div class="header"><div><div class="kicker">Nexo · trazabilidad</div><h1>Remitos encontrados</h1></div><div id="count" class="count">0</div></div>
<div id="grid" class="grid"><div class="empty">Esperando datos…</div></div>
<script>
const pending=new Map();let nextId=1;let latest=null;
function bridge(method,params){
  const id=nextId++;
  window.parent.postMessage({jsonrpc:"2.0",id,method,params},"*");
  return new Promise((resolve,reject)=>pending.set(id,{resolve,reject}));
}
function esc(value){
  return String(value??"").replace(/[&<>"']/g,(char)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
}
function date(value){if(!value)return "—";try{return new Date(value).toLocaleDateString("es-AR",{day:"2-digit",month:"short"})}catch{return value}}
function render(data){
  latest=data||{remitos:[]};
  const rows=Array.isArray(latest.remitos)?latest.remitos:[];
  document.getElementById("count").textContent=rows.length+" "+(rows.length===1?"registro":"registros");
  const grid=document.getElementById("grid");
  if(!rows.length){grid.innerHTML='<div class="empty">No hay remitos para mostrar.</div>';return}
  grid.innerHTML=rows.map((item,index)=>{
    const state=String(item.status||"").replaceAll(" ","_");
    return '<article class="card">'+
      '<div class="card-top"><div><div class="number">'+esc(item.number)+'</div><div class="customer">'+esc(item.customer)+'</div><div class="asset">'+esc(item.asset)+'</div></div>'+
      '<span class="status '+esc(state)+'">'+esc(item.status)+'</span></div>'+
      '<div class="meta"><div><span>Retiro previsto</span><strong>'+date(item.dueAt)+'</strong></div><div><span>Identificador</span><strong>'+esc(item.id)+'</strong></div></div>'+
      '<div class="actions"><button class="detail" data-index="'+index+'">Ver detalle</button><button class="ask" data-number="'+esc(item.number)+'">Preguntar</button></div>'+
      '</article>';
  }).join("");
  grid.querySelectorAll(".detail").forEach((button)=>button.addEventListener("click",async()=>{
    const item=rows[Number(button.dataset.index)];
    button.disabled=true;button.textContent="Cargando…";
    try{
      const result=await bridge("tools/call",{name:"get_remito",arguments:{id:item.id}});
      const detail=result?.structuredContent?.remito;
      if(detail){render({remitos:[{...item,...detail,customer:detail.customer,asset:detail.asset,status:detail.status}]});}
    }finally{button.disabled=false}
  }));
  grid.querySelectorAll(".ask").forEach((button)=>button.addEventListener("click",()=>{
    bridge("ui/message",{content:[{type:"text",text:"Dame más información del remito "+button.dataset.number}]}).catch(()=>{});
  }));
}
window.addEventListener("message",(event)=>{
  if(event.source!==window.parent)return;
  const message=event.data;
  if(!message||message.jsonrpc!=="2.0")return;
  if(message.id!==undefined&&pending.has(message.id)){const item=pending.get(message.id);pending.delete(message.id);message.error?item.reject(message.error):item.resolve(message.result);return}
  if(message.method==="ui/notifications/tool-result")render(message.params?.structuredContent);
});
if(window.openai?.toolOutput)render(window.openai.toolOutput);
bridge("ui/initialize",{capabilities:{},clientInfo:{name:"nexo-remitos-widget",version:"0.1.0"}}).catch(()=>{});
</script>
</body>
</html>
\`.trim();


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


  server.registerResource("remitos-widget", REMITOS_WIDGET_URI, {}, async () => ({
    contents: [{
      uri: REMITOS_WIDGET_URI,
      mimeType: "text/html;profile=mcp-app",
      text: remitosWidgetHtml,
      _meta: {
        ui: {
          prefersBorder: true,
          csp: { connectDomains: [], resourceDomains: [] },
        },
        "openai/widgetDescription": "Tarjetas interactivas de remitos de Nexo con acceso al detalle.",
      },
    }],
  }));

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


  server.registerTool("render_remitos_widget", {
    title: "Mostrar remitos como tarjetas",
    description: "Use this after list_remitos when the user needs a visual list of remitos. Pass the remitos returned by list_remitos; this tool only renders the prepared data and does not query the database.",
    inputSchema: {
      remitos: z.array(z.object({
        id: z.string(),
        number: z.string(),
        customer: z.string(),
        asset: z.string(),
        status: z.string(),
        dueAt: z.string().nullable(),
      })).max(50),
    },
    outputSchema: {
      remitos: z.array(z.object({
        id: z.string(),
        number: z.string(),
        customer: z.string(),
        asset: z.string(),
        status: z.string(),
        dueAt: z.string().nullable(),
      })),
    },
    _meta: {
      ui: { resourceUri: REMITOS_WIDGET_URI },
      "openai/outputTemplate": REMITOS_WIDGET_URI,
      "openai/toolInvocation/invoking": "Preparando tarjetas…",
      "openai/toolInvocation/invoked": "Tarjetas listas.",
    },
    annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
  }, async ({ remitos }) => ({
    structuredContent: { remitos },
    content: [{ type: "text" as const, text: `Se muestran ${remitos.length} remitos en una interfaz interactiva.` }],
  }));

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
