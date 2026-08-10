# Cloudflare MCP migration experiment

Goal: validate hosting the Nexo MCP core independently of Replit credits.

This experiment is intentionally isolated from the current Express MCP server. It should be deployed only after connecting this GitHub repository (or an extracted dedicated repository) to a Cloudflare Worker.

Validation criteria:
- public `/health` returns JSON with ok/service/version
- public `/mcp` accepts Streamable HTTP MCP connections
- MCP Inspector can connect and list tools
- deployment is triggered from GitHub without consuming Replit credits
- failure of Replit does not affect MCP availability

Current recommended Cloudflare pattern (August 2026): stateless `createMcpHandler()` / Streamable HTTP for new MCP servers. Avoid starting a new implementation on deprecated legacy `McpAgent` patterns.

Next deployment step requires Cloudflare account authorization / GitHub connection or Wrangler credentials. Do not store Cloudflare tokens in this repository.
