export interface WorkspaceSessionState {
  openPaths: string[];
  activePath: string | null;
  pinnedPaths: string[];
  splitActivePath?: string | null;
  isSplit?: boolean;
}

const SESSION_PREFIX = 'viewmd_session_';

export function saveWorkspaceSession(
  workspaceName: string,
  state: WorkspaceSessionState
): void {
  try {
    localStorage.setItem(`${SESSION_PREFIX}${workspaceName}`, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save workspace session:', err);
  }
}

export function getWorkspaceSession(
  workspaceName: string
): WorkspaceSessionState | null {
  try {
    const raw = localStorage.getItem(`${SESSION_PREFIX}${workspaceName}`);
    if (!raw) return null;
    return JSON.parse(raw) as WorkspaceSessionState;
  } catch (err) {
    console.error('Failed to load workspace session:', err);
    return null;
  }
}
