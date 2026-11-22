import type { ToolGroupDraft } from './types'

/** The Host Config schema rejects any identifier this pattern does not match. */
export const GROUP_IDENTIFIER_PATTERN = /^[\w.-]+$/u

/**
 * Why the Host would refuse this draft, or `undefined` once it can be saved.
 *
 * The Config schema rejects a missing or malformed identifier, and the runtime
 * policy rejects a repeated identifier, a group without tools, and a tool that
 * two groups claim. None of those is visible while the user is still filling a
 * group in, so the editor has to keep such a draft local: sending it would only
 * bounce back as "宿主拒绝了本次修改。" and lose the card the user just added.
 */
export function groupDraftProblem(groups: readonly ToolGroupDraft[], index: number): string | undefined {
  const group = groups[index]
  if (group === undefined)
    return undefined
  if (group.identifier === '')
    return '填写标识符后才会保存。'
  if (!GROUP_IDENTIFIER_PATTERN.test(group.identifier))
    return '标识符只能包含字母、数字、下划线、点和连字符。'
  // Only the later card of a repeated identifier is flagged: the first one is
  // the definition the duplicate collides with.
  if (groups.some((item, at) => at < index && item.identifier === group.identifier))
    return `标识符 ${group.identifier} 重复，宿主会拒绝保存。`
  if (group.tools.length === 0)
    return '至少选择一个工具后才会保存。'
  for (const tool of group.tools) {
    const owner = groups.findIndex((item, at) => at < index && item.tools.includes(tool))
    if (owner !== -1) {
      const name = groups[owner]?.identifier
      // A latin identifier needs the space before 中; a position does not.
      return `工具 ${tool} 已在${name === undefined || name === '' ? `第 ${owner + 1} 组` : `分组 ${name} `}中。`
    }
  }
  return undefined
}

/** Whether every group of this draft can be written without the Host refusing it. */
export function groupsArePersistable(groups: readonly ToolGroupDraft[]): boolean {
  return groups.every((_group, index) => groupDraftProblem(groups, index) === undefined)
}
