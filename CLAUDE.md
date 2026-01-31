# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

An MCP (Model Context Protocol) server that provides read-only access to StackBlitz project files. It fetches project data from the StackBlitz API (`https://stackblitz.com/api/projects/{id}?include_files=true`) and exposes it via MCP tools and resources over stdio transport.

## Commands

```bash
pnpm run build          # Build with tsdown → dist/index.mjs
pnpm run dev            # Watch mode build
pnpm run test           # Run tests (vitest, watch mode)
pnpm run test -- --run  # Run tests once
pnpm run lint           # ESLint check
pnpm run lint:fix       # ESLint auto-fix
pnpm run typecheck      # Type check with tsgo (native TS)
pnpm run format         # Prettier format
```

## Architecture

The server has three modules:

- **`src/index.ts`** — MCP server entry point. Registers 2 resources and 4 tools on `McpServer`, then connects via `StdioServerTransport`. Use `registerResource`/`registerTool` (not the deprecated `resource`/`tool` methods).
- **`src/stackblitz.ts`** — StackBlitz API client. `resolveProjectId()` extracts project IDs from URLs or passes plain IDs through. `fetchProject()` calls the API with a TTL cache (5 min, max 50 entries).
- **`src/tree.ts`** — Builds a `FileNode` tree from flat file paths and formats it as ASCII art with `├──`/`└──` connectors.

## Key Conventions

- **ESM only** (`"type": "module"`). Use `.js` extensions in imports (e.g., `./stackblitz.js`).
- **`verbatimModuleSyntax`** is enabled — use `import type` for type-only imports.
- Type checking uses `tsgo` (native TypeScript preview), which has stricter overload resolution than `tsc`.
- ESLint uses `@sxzz/eslint-config` which enforces: `toSorted()` over `sort()`, `for-of` over index loops, `node:` prefix for Node.js builtins, no duplicate imports.
- Prettier uses `@sxzz/prettier-config`.
- Tool results use `type: 'text' as const` and `type: 'resource_link' as const` for content items. `resource_link` fields (`uri`, `name`, `mimeType`) are at top level, not nested in a `resource` object.
