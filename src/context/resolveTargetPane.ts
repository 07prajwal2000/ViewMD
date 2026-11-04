import type { PaneType } from './TabsContext';

/**
 * Helper to safely resolve which pane to target for file operations (like saving),
 * preventing React SyntheticEvents or unverified objects from corrupting pane selection.
 */
export function resolveTargetPane(
  targetPane: unknown,
  isSplitView: boolean,
  focusedPane: PaneType
): PaneType {
  const validTargetPane = targetPane === 'primary' || targetPane === 'secondary' ? targetPane : undefined;
  return isSplitView ? (validTargetPane || focusedPane) : 'primary';
}
