#!/usr/bin/env node

import process from 'node:process'
import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import {
  fetchProject,
  getFileContents,
  getFileList,
  resolveProjectId,
} from './stackblitz.js'
import { buildTree, formatTree } from './tree.js'

const server = new McpServer({
  name: 'stackblitz-mcp',
  version: '0.1.0',
})

// --- Resources ---

server.registerResource(
  'project_tree',
  new ResourceTemplate('stackblitz://{projectId}/tree', { list: undefined }),
  {
    description: 'File tree of a StackBlitz project',
    mimeType: 'text/plain',
  },
  async (uri, variables) => {
    const projectId = resolveProjectId(String(variables.projectId))
    const { project } = await fetchProject(projectId)
    const files = getFileList(project)
    const tree = buildTree(files)
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/plain',
          text: formatTree(tree),
        },
      ],
    }
  },
)

server.registerResource(
  'project_file',
  new ResourceTemplate('stackblitz://{projectId}/files/{+path}', {
    list: undefined,
  }),
  { description: 'Contents of a file in a StackBlitz project' },
  async (uri, variables) => {
    const projectId = resolveProjectId(String(variables.projectId))
    const path = String(variables.path)
    const { project } = await fetchProject(projectId)
    const file = getFileContents(project, path)

    if (!file) {
      throw new Error(`File not found: ${path}`)
    }

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: guessMimeType(path),
          text: file.contents,
        },
      ],
    }
  },
)

// --- Tools ---

server.registerTool(
  'resolve_project',
  {
    description:
      'Resolve a StackBlitz project URL or ID and return project metadata',
    inputSchema: {
      projectRef: z.string().min(1).describe('StackBlitz project ID or URL'),
    },
  },
  async ({ projectRef }) => {
    const projectId = resolveProjectId(projectRef)
    const { project } = await fetchProject(projectId)
    const files = getFileList(project)

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              projectId,
              title: project.title,
              description: project.description,
              preset: project.preset,
              visibility: project.visibility,
              fileCount: files.length,
            },
            null,
            2,
          ),
        },
        {
          type: 'resource_link' as const,
          uri: `stackblitz://${projectId}/tree`,
          name: `${projectId} file tree`,
          mimeType: 'text/plain',
        },
      ],
    }
  },
)

server.registerTool(
  'list_files',
  {
    description:
      'List files in a StackBlitz project, optionally filtered by path prefix',
    inputSchema: {
      projectRef: z.string().min(1).describe('StackBlitz project ID or URL'),
      path: z.string().optional().describe('Filter files by path prefix'),
    },
  },
  async ({ projectRef, path }) => {
    const projectId = resolveProjectId(projectRef)
    const { project } = await fetchProject(projectId)
    let files = getFileList(project)

    if (path) {
      const prefix = path.endsWith('/') ? path : `${path}/`
      files = files.filter((f) => f.startsWith(prefix) || f === path)
    }

    const tree = buildTree(files)

    return {
      content: [
        {
          type: 'text' as const,
          text: formatTree(tree),
        },
      ],
    }
  },
)

server.registerTool(
  'read_file',
  {
    description: 'Read the contents of a file from a StackBlitz project',
    inputSchema: {
      projectRef: z.string().min(1).describe('StackBlitz project ID or URL'),
      path: z.string().min(1).describe('File path within the project'),
    },
  },
  async ({ projectRef, path }) => {
    const projectId = resolveProjectId(projectRef)
    const { project } = await fetchProject(projectId)
    const file = getFileContents(project, path)

    if (!file) {
      const files = getFileList(project)
      const basename = path.split('/').pop() || ''
      const suggestions = files.filter((f) => f.includes(basename)).slice(0, 5)

      return {
        content: [
          {
            type: 'text' as const,
            text: `File not found: ${path}${
              suggestions.length
                ? `\n\nDid you mean:\n${suggestions.map((s) => `  - ${s}`).join('\n')}`
                : ''
            }`,
          },
        ],
        isError: true,
      }
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: file.contents,
        },
        {
          type: 'resource_link' as const,
          uri: `stackblitz://${projectId}/files/${path}`,
          name: path,
          mimeType: guessMimeType(path),
        },
      ],
    }
  },
)

server.registerTool(
  'search_files',
  {
    description: 'Search for content within files of a StackBlitz project',
    inputSchema: {
      projectRef: z.string().min(1).describe('StackBlitz project ID or URL'),
      query: z.string().min(1).describe('Search query string'),
      regex: z.boolean().default(false).describe('Treat query as regex'),
      caseSensitive: z
        .boolean()
        .default(false)
        .describe('Case-sensitive search'),
      maxResults: z
        .number()
        .int()
        .positive()
        .default(50)
        .describe('Maximum number of results'),
    },
  },
  async ({ projectRef, query, regex, caseSensitive, maxResults }) => {
    const projectId = resolveProjectId(projectRef)
    const { project } = await fetchProject(projectId)

    let pattern: RegExp | undefined
    if (regex) {
      try {
        pattern = new RegExp(query, caseSensitive ? 'g' : 'gi')
      } catch (error) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Invalid regex: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
          isError: true,
        }
      }
    }
    const searchQuery = caseSensitive ? query : query.toLowerCase()

    interface Match {
      file: string
      line: number
      text: string
    }

    const matches: Match[] = []

    for (const file of Object.values(project.appFiles)) {
      if (matches.length >= maxResults) break

      const lines = file.contents.split('\n')
      for (const [i, line] of lines.entries()) {
        if (matches.length >= maxResults) break
        let found: boolean

        if (pattern) {
          found = pattern.test(line)
          pattern.lastIndex = 0
        } else {
          found = (caseSensitive ? line : line.toLowerCase()).includes(
            searchQuery,
          )
        }

        if (found) {
          matches.push({
            file: file.fullPath,
            line: i + 1,
            text: line.trimEnd(),
          })
        }
      }
    }

    if (matches.length === 0) {
      return {
        content: [
          { type: 'text' as const, text: `No matches found for "${query}"` },
        ],
      }
    }

    const grouped = new Map<string, Match[]>()
    for (const match of matches) {
      const group = grouped.get(match.file) || []
      group.push(match)
      grouped.set(match.file, group)
    }

    let output = `Found ${matches.length} match${matches.length === 1 ? '' : 'es'} in ${grouped.size} file${grouped.size === 1 ? '' : 's'}:\n\n`

    for (const [file, fileMatches] of grouped) {
      output += `## ${file}\n`
      for (const m of fileMatches) {
        output += `  L${m.line}: ${m.text}\n`
      }
      output += '\n'
    }

    return {
      content: [{ type: 'text' as const, text: output.trimEnd() }],
    }
  },
)

// --- Utilities ---

const MIME_TYPES: Record<string, string> = {
  ts: 'text/typescript',
  tsx: 'text/typescript',
  js: 'text/javascript',
  jsx: 'text/javascript',
  json: 'application/json',
  md: 'text/markdown',
  html: 'text/html',
  css: 'text/css',
  scss: 'text/scss',
  less: 'text/less',
  svg: 'image/svg+xml',
  yaml: 'text/yaml',
  yml: 'text/yaml',
  xml: 'text/xml',
  txt: 'text/plain',
  vue: 'text/x-vue',
  svelte: 'text/x-svelte',
}

function guessMimeType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  return MIME_TYPES[ext || ''] || 'text/plain'
}

// --- Start ---

async function main(): Promise<void> {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('StackBlitz MCP server running on stdio')
}

main().catch((error: unknown) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
