export interface StackBlitzFile {
  name: string
  type: string
  contents: string
  fullPath: string
  lastModified: number
}

export interface StackBlitzProject {
  id: number
  title: string
  description: string
  slug: string
  preset: string
  visibility: string
  appFiles: Record<string, StackBlitzFile>
}

export interface StackBlitzResponse {
  project: StackBlitzProject
}

const cache = new Map<string, { data: StackBlitzResponse; expiry: number }>()
const CACHE_TTL = 5 * 60 * 1000
const CACHE_MAX_SIZE = 50

const KNOWN_PATH_SEGMENTS = new Set(['edit', 'fork', 'github', '~'])

export function resolveProjectId(ref: string): string {
  let url: URL
  try {
    url = new URL(ref)
  } catch {
    return ref
  }

  if (url.hostname !== 'stackblitz.com') {
    throw new Error(
      `Unsupported URL: only stackblitz.com URLs are supported, got ${url.hostname}`,
    )
  }

  const parts = url.pathname.split('/').filter(Boolean)
  if (parts[0] === 'edit' && parts[1]) return parts[1]
  if (parts.length === 1 && !KNOWN_PATH_SEGMENTS.has(parts[0])) return parts[0]

  throw new Error(`Could not extract project ID from URL: ${ref}`)
}

export async function fetchProject(
  projectId: string,
): Promise<StackBlitzResponse> {
  const cached = cache.get(projectId)
  if (cached && cached.expiry > Date.now()) {
    return cached.data
  }

  const response = await fetch(
    `https://stackblitz.com/api/projects/${encodeURIComponent(projectId)}?include_files=true`,
  )

  if (!response.ok) {
    throw new Error(
      `Failed to fetch project ${projectId}: ${response.status} ${response.statusText}`,
    )
  }

  const data = (await response.json()) as StackBlitzResponse

  if (cache.size >= CACHE_MAX_SIZE) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) cache.delete(oldest)
  }
  cache.set(projectId, { data, expiry: Date.now() + CACHE_TTL })

  return data
}

export function getFileList(project: StackBlitzProject): string[] {
  return Object.values(project.appFiles)
    .map((f) => f.fullPath)
    .toSorted()
}

export function getFileContents(
  project: StackBlitzProject,
  path: string,
): StackBlitzFile | undefined {
  return Object.values(project.appFiles).find((f) => f.fullPath === path)
}
