import { get, set } from 'idb-keyval';
import type { RecentWorkspace } from '../../types/fileSystem';

const RECENTS_KEY = 'viewmd_recent_workspaces';

export async function getRecentWorkspaces(): Promise<RecentWorkspace[]> {
  try {
    const list = await get<RecentWorkspace[]>(RECENTS_KEY);
    return list || [];
  } catch (err) {
    console.error('Failed to load recent workspaces from IndexedDB:', err);
    return [];
  }
}

export async function saveRecentWorkspace(handle: FileSystemDirectoryHandle): Promise<RecentWorkspace[]> {
  try {
    const existing = await getRecentWorkspaces();
    const id = handle.name;
    const now = Date.now();

    // Filter out previous entry with same name if any
    const filtered = existing.filter((item) => item.name !== handle.name);

    const updated: RecentWorkspace[] = [
      {
        id,
        name: handle.name,
        handle,
        lastOpened: now,
      },
      ...filtered,
    ].slice(0, 10); // Keep max 10 recents

    await set(RECENTS_KEY, updated);
    return updated;
  } catch (err) {
    console.error('Failed to save recent workspace to IndexedDB:', err);
    return [];
  }
}

export async function removeRecentWorkspace(name: string): Promise<RecentWorkspace[]> {
  try {
    const existing = await getRecentWorkspaces();
    const updated = existing.filter((item) => item.name !== name);
    await set(RECENTS_KEY, updated);
    return updated;
  } catch (err) {
    console.error('Failed to remove recent workspace:', err);
    return [];
  }
}
