import type { FileEntry } from '../../types/fileSystem';

const IGNORED_NAMES = new Set(['.git', 'node_modules', '.vscode', '.idea', 'dist', '.DS_Store', 'Thumbs.db']);

export async function readDirectoryTree(
  dirHandle: FileSystemDirectoryHandle,
  parentPath = ''
): Promise<FileEntry[]> {
  const entries: FileEntry[] = [];

  for await (const entry of dirHandle.values()) {
    if (IGNORED_NAMES.has(entry.name)) {
      continue;
    }

    const currentPath = parentPath ? `${parentPath}/${entry.name}` : entry.name;

    if (entry.kind === 'directory') {
      const subDirHandle = entry as FileSystemDirectoryHandle;
      const children = await readDirectoryTree(subDirHandle, currentPath);

      entries.push({
        id: currentPath,
        name: entry.name,
        path: currentPath,
        kind: 'directory',
        handle: entry,
        dirHandle: subDirHandle,
        parentDirHandle: dirHandle,
        children,
        isOpen: false,
      });
    } else {
      entries.push({
        id: currentPath,
        name: entry.name,
        path: currentPath,
        kind: 'file',
        handle: entry,
        fileHandle: entry as FileSystemFileHandle,
        parentDirHandle: dirHandle,
      });
    }
  }

  // Sort directories first, then alphabetical
  return entries.sort((a, b) => {
    if (a.kind !== b.kind) {
      return a.kind === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
}
