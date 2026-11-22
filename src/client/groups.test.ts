import type { ToolGroupDraft } from './types'
import { describe, expect, it } from 'vitest'
import { groupDraftProblem, groupsArePersistable } from './groups'

function group(overrides: Partial<ToolGroupDraft> = {}): ToolGroupDraft {
  return { identifier: 'files', name: 'Files', description: '', tools: ['read'], sections: [], ...overrides }
}

describe('group draft validation', () => {
  it('accepts a group the Host can take', () => {
    expect(groupDraftProblem([group()], 0)).toBeUndefined()
    expect(groupsArePersistable([group()])).toBe(true)
  })

  it('asks for an identifier before anything is written', () => {
    expect(groupDraftProblem([group({ identifier: '' })], 0)).toBe('填写标识符后才会保存。')
    expect(groupsArePersistable([group({ identifier: '' })])).toBe(false)
  })

  it('rejects an identifier the Config schema would refuse', () => {
    expect(groupDraftProblem([group({ identifier: 'has space' })], 0)).toBe('标识符只能包含字母、数字、下划线、点和连字符。')
  })

  it('flags only the later card of a repeated identifier', () => {
    const groups = [group(), group({ tools: ['write'] })]

    expect(groupDraftProblem(groups, 0)).toBeUndefined()
    expect(groupDraftProblem(groups, 1)).toBe('标识符 files 重复，宿主会拒绝保存。')
    expect(groupsArePersistable(groups)).toBe(false)
  })

  it('asks for a tool because the runtime policy refuses an empty group', () => {
    expect(groupDraftProblem([group({ tools: [] })], 0)).toBe('至少选择一个工具后才会保存。')
  })

  it('reports a tool an earlier group already claims', () => {
    const groups = [group({ identifier: 'files', tools: ['read'] }), group({ identifier: 'docs', tools: ['read'] })]

    expect(groupDraftProblem(groups, 1)).toBe('工具 read 已在分组 files 中。')
    expect(groupsArePersistable(groups)).toBe(false)
  })

  it('falls back to the position when the earlier group has no identifier yet', () => {
    const groups = [group({ identifier: '', tools: ['read'] }), group({ identifier: 'docs', tools: ['read'] })]

    expect(groupDraftProblem(groups, 1)).toBe('工具 read 已在第 1 组中。')
  })

  it('ignores an index outside the draft', () => {
    expect(groupDraftProblem([group()], 4)).toBeUndefined()
  })
})
