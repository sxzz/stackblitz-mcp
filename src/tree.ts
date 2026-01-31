export interface FileNode {
  path: string
  name: string
  type: 'file' | 'directory'
  children?: FileNode[]
}

export function buildTree(paths: string[]): FileNode {
  const root: FileNode = {
    path: '',
    name: '',
    type: 'directory',
    children: [],
  }

  for (const filePath of paths.toSorted()) {
    const parts = filePath.split('/')
    let current = root

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const isFile = i === parts.length - 1
      const currentPath = parts.slice(0, i + 1).join('/')

      if (!current.children) current.children = []

      if (isFile) {
        current.children.push({ path: currentPath, name: part, type: 'file' })
      } else {
        let dir = current.children.find(
          (c) => c.name === part && c.type === 'directory',
        )
        if (!dir) {
          dir = {
            path: currentPath,
            name: part,
            type: 'directory',
            children: [],
          }
          current.children.push(dir)
        }
        current = dir
      }
    }
  }

  return root
}

export function formatTree(node: FileNode): string {
  if (!node.children || node.children.length === 0) return ''

  const sorted = sortChildren(node.children)
  const lines: string[] = []

  for (let i = 0; i < sorted.length; i++) {
    formatNode(sorted[i], '', i === sorted.length - 1, lines)
  }

  return lines.join('\n')
}

function sortChildren(children: FileNode[]): FileNode[] {
  return children.toSorted((a, b) => {
    if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

function formatNode(
  node: FileNode,
  prefix: string,
  isLast: boolean,
  lines: string[],
): void {
  const connector = isLast ? '└── ' : '├── '
  const suffix = node.type === 'directory' ? '/' : ''
  lines.push(`${prefix}${connector}${node.name}${suffix}`)

  if (node.children && node.children.length > 0) {
    const childPrefix = prefix + (isLast ? '    ' : '│   ')
    const sorted = sortChildren(node.children)
    for (let i = 0; i < sorted.length; i++) {
      formatNode(sorted[i], childPrefix, i === sorted.length - 1, lines)
    }
  }
}
