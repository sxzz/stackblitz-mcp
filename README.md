# stackblitz-mcp

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![Unit Test][unit-test-src]][unit-test-href]

[MCP](https://modelcontextprotocol.io/) server for reading files from [StackBlitz](https://stackblitz.com/) projects. Enables AI to access file contents and project structure from StackBlitz reproduction repositories.

## Install

```bash
npm i -g stackblitz-mcp
```

## Usage

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "stackblitz": {
      "command": "npx",
      "args": ["-y", "stackblitz-mcp"]
    }
  }
}
```

### Claude Code

```bash
claude mcp add stackblitz -- npx -y stackblitz-mcp
```

### Cursor

Add to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "stackblitz": {
      "command": "npx",
      "args": ["-y", "stackblitz-mcp"]
    }
  }
}
```

## Tools

### `resolve_project`

Resolve a StackBlitz project URL or ID and return project metadata (title, description, preset, visibility, file count).

**Input:**

- `projectRef` (string) — Project ID or StackBlitz URL (e.g. `stackblitz-starters-rf7brvcm` or `https://stackblitz.com/edit/stackblitz-starters-rf7brvcm`)

### `list_files`

List files in a StackBlitz project as an ASCII tree, optionally filtered by path prefix.

**Input:**

- `projectRef` (string) — Project ID or URL
- `path` (string, optional) — Filter files by path prefix

### `read_file`

Read the contents of a file from a StackBlitz project.

**Input:**

- `projectRef` (string) — Project ID or URL
- `path` (string) — File path within the project

### `search_files`

Search for content within files of a StackBlitz project.

**Input:**

- `projectRef` (string) — Project ID or URL
- `query` (string) — Search query
- `regex` (boolean, default: `false`) — Treat query as regex
- `caseSensitive` (boolean, default: `false`) — Case-sensitive search
- `maxResults` (number, default: `50`) — Maximum number of results

## Resources

| URI Pattern | Description |
|---|---|
| `stackblitz://{projectId}/tree` | File tree of a project |
| `stackblitz://{projectId}/files/{path}` | Contents of a specific file |

## Sponsors

<p align="center">
  <a href="https://cdn.jsdelivr.net/gh/sxzz/sponsors/sponsors.svg">
    <img src='https://cdn.jsdelivr.net/gh/sxzz/sponsors/sponsors.svg'/>
  </a>
</p>

## License

[MIT](./LICENSE) License © 2026-PRESENT [Kevin Deng](https://github.com/sxzz)

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/stackblitz-mcp.svg
[npm-version-href]: https://npmjs.com/package/stackblitz-mcp
[npm-downloads-src]: https://img.shields.io/npm/dm/stackblitz-mcp
[npm-downloads-href]: https://www.npmcharts.com/compare/stackblitz-mcp?interval=30
[unit-test-src]: https://github.com/sxzz/stackblitz-mcp/actions/workflows/unit-test.yml/badge.svg
[unit-test-href]: https://github.com/sxzz/stackblitz-mcp/actions/workflows/unit-test.yml
