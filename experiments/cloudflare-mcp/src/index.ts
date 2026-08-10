import { createMcpHandler } from "agents/mcp/server";
import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

function createServer() {
  const server = new McpServer({
    name: "nexo-mcp-core",
    version: "0.1.0",
  });

  server.registerTool(
    "nexo_status",
    {
      description: "Returns the operational status of the Nexo MCP core.",
      inputSchema: {
        echo: z.string().max(200).optional(),
      },
    },
    async ({ echo }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify({
            ok: true,
            service: "nexo-mcp-core",
            runtime: "cloudflare-workers",
            transport: "streamable-http",
            echo: echo ?? null,
          }),
        },
      ],
    }),
  );

  return server;
}

const handleMcp = createMcpHandler(createServer);

export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return Response.json({
        ok: true,
        service: "nexo-mcp-core",
        version: "0.1.0",
        runtime: "cloudflare-workers",
        mcp: "/mcp",
      });
    }

    if (url.pathname === "/mcp") {
      return handleMcp(request, env, ctx);
    }

    return Response.json(
      {
        ok: false,
        error: "not_found",
        endpoints: ["/health", "/mcp"],
      },
      { status: 404 },
    );
  },
} satisfies ExportedHandler;
