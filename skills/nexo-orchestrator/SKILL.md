# Nexo Orchestrator Skill

## Purpose
Preserve the operating model, architecture decisions, provider priorities, deployment rules, and discoveries for Nexo so future sessions can continue without relying on chat context.

## Core principle
Nexo is the stable capability layer. Providers are replaceable workers. GitHub is the source of truth. A provider outage or credit exhaustion must not take Nexo offline.

## Phase 1 target
Expose a minimal sellable capability layer with:
- browser
- terminal/shell
- files
- jobs
- storage
- GitHub
- observe/QA
- audit log

## Current MCP
Previous Replit MCP project: `nexocms-replit-import-v2.zip`.
Previous public MCP endpoint: `https://6a72eb9f-eb6b-46fc-9614-ca94f5e8b490-00-2adyjnl0z9q38.worf.replit.dev/mcp`.
Previous health endpoint: `https://6a72eb9f-eb6b-46fc-9614-ca94f5e8b490-00-2adyjnl0z9q38.worf.replit.dev/health`.
As of 2026-08-10 the Replit deployment was unavailable because daily credits were exhausted before deployment.

## Deployment rule
A code task is NOT complete until the capability is externally usable.
Required order:
1. implement
2. basic checks/tests
3. commit/sync to GitHub
4. deploy/redeploy
5. verify `/health`
6. verify `/mcp` with an MCP client/inspector
7. only then spend remaining provider credits on secondary improvements

## Provider credit policy
Reserve enough provider quota to complete deployment and smoke tests.
Priority classes:
- P0: current user request / blocking outage
- P1: implementation, GitHub, tests, CI, deploy, MCP availability
- P2: maintenance/refactor/improvements for active projects
- P3: opportunistic or idle-time jobs

P3 work must be interruptible. Never consume the last useful quota of Replit, v0, Lovable, or another scarce provider while unpublished P0/P1 work exists.

## Provider roles
### Replit Agent
Primary: implementation, debugging, validation, deployment of active GitHub-backed projects.
Secondary: opportunistic tasks only when quota remains after deploy reserve.
Do not treat Replit as the critical always-on Nexo host.

### v0
Primary: frontend/UI specialist and Vercel-oriented prototyping for active projects.
Preserve credits for real interface work.

### Lovable
Primary: full-stack/UI application specialist where it is faster than general coding agents.
Preserve credits for active project delivery.

### GitHub
Source of truth for code, history, PRs, CI and deployment triggers.
Preferred flow: ChatGPT/Nexo -> GitHub -> specialist worker -> PR/commit -> QA -> deploy.

### Supabase
Preferred state plane for jobs, tenant data, operational state, audit records and artifacts metadata when suitable.

## Nexo hosting strategy
Critical MCP hosting must be independent of Replit Agent credits.

### Preferred candidate: Cloudflare Workers
As of 2026-08-10 Cloudflare officially documents remote MCP servers on Workers using Streamable HTTP.
For a new stateless server, prefer `createMcpHandler()` rather than deprecated stateful/legacy patterns.
Typical endpoint: `https://<worker>.<account>.workers.dev/mcp`.
Cloudflare can deploy automatically from a connected GitHub repository on push/merge.
This is currently the leading candidate for Nexo Core.

Validated 2026-08-10 against current Cloudflare docs:
- Streamable HTTP is the standard remote MCP transport.
- `createMcpHandler()` is the recommended stateless path for new servers.
- Cloudflare Agents SDK v0.20.0 supports the MCP 2026-07-28 protocol generation while keeping compatibility with legacy stateless clients.
- Workers Free remains available.
- GitHub Actions deployment is supported with Wrangler using `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

### Cloudflare POC status
Branch: `poc/cloudflare-mcp-core`.
POC directory: `experiments/cloudflare-mcp/`.
Implemented:
- `/health`
- `/mcp`
- stateless `createMcpHandler()` integration
- test tool `nexo_status`
- Wrangler config
- GitHub Actions deploy workflow
- post-deploy `/health` smoke test

Worker candidate name: `nexo-mcp-core-poc`.
Deployment is intentionally isolated from production/Replit MCP.
Remaining external prerequisites for first Cloudflare deployment:
1. Cloudflare account ID stored in GitHub secret `CLOUDFLARE_ACCOUNT_ID`.
2. Cloudflare Workers API token stored in GitHub secret `CLOUDFLARE_API_TOKEN`.
3. Run/allow the GitHub Actions workflow, then verify the generated `*.workers.dev/health` and `*.workers.dev/mcp` endpoints.
Do not store either credential in source, chat, prompts, or logs.

### Secondary candidate: Deno Deploy
New Deno Deploy supports GitHub-driven deployments, logs, telemetry, CLI deploys and JavaScript/TypeScript apps.
Do NOT design around Deno Deploy Classic; it was sunset in July 2026.
Use as fallback or alternative host when compatibility is simpler than Workers.

### Render
Technically easy for Node/Express, but Free web services spin down after 15 minutes without inbound traffic and cold-start can take about one minute. Therefore not preferred as the primary always-on MCP endpoint.
Useful for compatibility testing/fallback.

### Firebase/Cloud Run
Technically strong and suitable for MCP, but billing setup may be required even when usage remains inside free allowances. Good production fallback, less attractive for a strictly zero-fixed-cost first stage.

## Architecture
ChatGPT -> Nexo MCP Core -> capability router -> APIs / MCP / CLI / browser / specialist workers.

Nexo Core should remain lightweight and reliable. Heavy or quota-bound work should be delegated.

## Router policy
Preferred route order:
1. official API
2. official MCP/CLI
3. authorized browser automation
4. RPA
5. human

For replaceable compute/providers:
FREE preferred -> FREE alternate -> cheap paid -> request authorization.

## Safety and reliability rules
- secrets never in prompts or public logs
- per-client/job isolation
- audit log for external actions
- idempotent retries
- own rate limits in addition to provider limits
- human approval for payments, contracts, sensitive publication or destructive actions
- artifact provenance and license tracking
- if commercial-use license is unknown, block automatic commercial publication
- browser automation only where authorized; no CAPTCHA bypass or anti-bot evasion

## MCP implementation notes
The existing `nexocms` repo uses `@modelcontextprotocol/sdk`, Express, StreamableHTTPServerTransport and Supabase. The current MCP is therefore already conceptually compatible with migration to a stateless Streamable HTTP host, although the Express-specific server layer must be adapted for Workers.

The Cloudflare POC deliberately uses the newer stateless stack instead of porting the entire existing server at once. Migration sequence should be:
1. prove Cloudflare `/health` + minimal `/mcp`
2. validate from MCP Inspector and ChatGPT connector/client
3. port read-only Nexo tools
4. add Supabase-backed state/auth
5. add capability router
6. only then retire the Replit MCP endpoint

## Continuation checklist
When resuming work:
1. Read this skill first.
2. Check current GitHub state and open PRs.
3. Check whether Nexo MCP has a live host and `/health` endpoint.
4. If MCP is down, restore core hosting before spending scarce specialist credits.
5. Keep GitHub as source of truth.
6. Check `poc/cloudflare-mcp-core` until Cloudflare hosting is proven.
7. Update this file whenever a provider, URL, policy, architecture decision, limitation, or successful deployment changes.

## Research basis
Primary sources checked in August 2026:
- Cloudflare Agents remote MCP documentation (Streamable HTTP, Workers, GitHub deployment)
- Cloudflare MCP handler API and July 2026 MCP protocol update
- Cloudflare Workers GitHub Actions documentation
- Deno Deploy documentation (new platform, GitHub deploy, CLI, observability)
- Render free service documentation (15-minute idle spin-down and cold-start behavior)
- Nexo 2026 capability/monetization research supplied by the user
