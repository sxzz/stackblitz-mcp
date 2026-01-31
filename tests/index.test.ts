import { describe, expect, it } from 'vitest'
import { resolveProjectId } from '../src/stackblitz.js'
import { buildTree, formatTree } from '../src/tree.js'

describe('resolveProjectId', () => {
  it('returns plain project ID as-is', () => {
    expect(resolveProjectId('stackblitz-starters-rf7brvcm')).toBe(
      'stackblitz-starters-rf7brvcm',
    )
  })

  it('extracts project ID from /edit/ URL', () => {
    expect(
      resolveProjectId(
        'https://stackblitz.com/edit/stackblitz-starters-rf7brvcm',
      ),
    ).toBe('stackblitz-starters-rf7brvcm')
  })

  it('extracts project ID from direct URL', () => {
    expect(
      resolveProjectId('https://stackblitz.com/stackblitz-starters-rf7brvcm'),
    ).toBe('stackblitz-starters-rf7brvcm')
  })

  it('throws on non-stackblitz URLs', () => {
    expect(() => resolveProjectId('https://example.com/foo')).toThrow(
      'Unsupported URL',
    )
  })

  it('throws on /edit/ URL without project ID', () => {
    expect(() => resolveProjectId('https://stackblitz.com/edit/')).toThrow(
      'Could not extract project ID',
    )
  })

  it('throws on known path segments without project ID', () => {
    expect(() => resolveProjectId('https://stackblitz.com/edit')).toThrow(
      'Could not extract project ID',
    )
  })
})

describe('buildTree', () => {
  it('builds tree from flat file paths', () => {
    const tree = buildTree(['src/index.ts', 'src/utils.ts', 'package.json'])
    expect(tree.children).toHaveLength(2)

    const src = tree.children!.find((c) => c.name === 'src')
    expect(src).toBeDefined()
    expect(src!.type).toBe('directory')
    expect(src!.children).toHaveLength(2)

    const pkg = tree.children!.find((c) => c.name === 'package.json')
    expect(pkg).toBeDefined()
    expect(pkg!.type).toBe('file')
  })

  it('handles nested directories', () => {
    const tree = buildTree(['a/b/c/file.ts'])
    expect(tree.children).toHaveLength(1)

    const a = tree.children![0]
    expect(a.name).toBe('a')
    expect(a.children![0].name).toBe('b')
    expect(a.children![0].children![0].name).toBe('c')
    expect(a.children![0].children![0].children![0].name).toBe('file.ts')
  })
})

describe('formatTree', () => {
  it('formats tree as ASCII art', () => {
    const tree = buildTree(['src/index.ts', 'src/utils.ts', 'package.json'])
    const output = formatTree(tree)

    expect(output).toContain('src/')
    expect(output).toContain('index.ts')
    expect(output).toContain('utils.ts')
    expect(output).toContain('package.json')
    expect(output).toContain('├──')
    expect(output).toContain('└──')
  })

  it('returns empty string for empty tree', () => {
    const tree = buildTree([])
    expect(formatTree(tree)).toBe('')
  })
})
