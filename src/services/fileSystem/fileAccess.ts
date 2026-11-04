/// <reference types="wicg-file-system-access" />

export async function openDirectoryPicker(): Promise<FileSystemDirectoryHandle | null> {
  if (!('showDirectoryPicker' in window)) {
    throw new Error('Your browser does not support the File System Access API. Please use Chrome, Edge, or Brave.');
  }

  try {
    const handle = await (window as unknown as { showDirectoryPicker: (options?: unknown) => Promise<FileSystemDirectoryHandle> }).showDirectoryPicker({
      mode: 'readwrite',
    });
    return handle;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return null; // User cancelled
    }
    throw err;
  }
}

export async function openFilePicker(): Promise<FileSystemFileHandle[] | null> {
  if (!('showOpenFilePicker' in window)) {
    throw new Error('Your browser does not support the File System Access API. Please use Chrome, Edge, or Brave.');
  }

  try {
    const handles = await (window as unknown as {
      showOpenFilePicker: (options?: unknown) => Promise<FileSystemFileHandle[]>;
    }).showOpenFilePicker({
      multiple: true,
      types: [
        {
          description: 'Supported Files (Markdown, Presentations, PDF)',
          accept: {
            'text/markdown': ['.md', '.markdown', '.mdown', '.mkd', '.mdp', '.deck'],
            'text/plain': ['.txt'],
            'application/pdf': ['.pdf'],
          },
        },
      ],
    });
    return handles;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return null; // User cancelled
    }
    throw err;
  }
}

export async function verifyPermission(
  handle: FileSystemHandle,
  readWrite: boolean = true
): Promise<boolean> {
  const options = {
    mode: readWrite ? 'readwrite' : 'read',
  };

  const handleAny = handle as unknown as {
    queryPermission: (options: { mode: string }) => Promise<PermissionState>;
    requestPermission: (options: { mode: string }) => Promise<PermissionState>;
  };

  if (typeof handleAny.queryPermission === 'function') {
    if ((await handleAny.queryPermission(options)) === 'granted') {
      return true;
    }
  }

  if (typeof handleAny.requestPermission === 'function') {
    if ((await handleAny.requestPermission(options)) === 'granted') {
      return true;
    }
  }

  return false;
}

export async function readFileAsText(fileHandle: FileSystemFileHandle): Promise<string> {
  const file = await fileHandle.getFile();
  return await file.text();
}

export async function readFileAsBlob(fileHandle: FileSystemFileHandle): Promise<Blob> {
  return await fileHandle.getFile();
}

export async function writeFile(
  fileHandle: FileSystemFileHandle,
  content: string | Blob
): Promise<void> {
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
}

export async function createFileInDir(
  dirHandle: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemFileHandle> {
  return await dirHandle.getFileHandle(name, { create: true });
}

export async function createSubDirInDir(
  dirHandle: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemDirectoryHandle> {
  return await dirHandle.getDirectoryHandle(name, { create: true });
}

/**
 * Creates files or folders recursively when slashes `/` are included.
 * Example: 'docs/architecture/spec.md' -> creates 'docs', then 'architecture', then 'spec.md'
 */
export async function createPathRecursive(
  baseDir: FileSystemDirectoryHandle,
  pathStr: string,
  isDirectory: boolean
): Promise<{ handle: FileSystemHandle; parentDir: FileSystemDirectoryHandle; finalName: string }> {
  // Normalize slashes
  const segments = pathStr.replace(/\\/g, '/').split('/').filter((s) => s.trim().length > 0);
  if (segments.length === 0) {
    throw new Error('Invalid path');
  }

  let currentDir = baseDir;

  if (isDirectory) {
    // All segments are directories
    for (const segment of segments) {
      currentDir = await currentDir.getDirectoryHandle(segment, { create: true });
    }
    return { handle: currentDir, parentDir: baseDir, finalName: segments[segments.length - 1] };
  } else {
    // All segments except the last one are directories
    for (let i = 0; i < segments.length - 1; i++) {
      currentDir = await currentDir.getDirectoryHandle(segments[i], { create: true });
    }
    const finalName = segments[segments.length - 1];
    const fileHandle = await currentDir.getFileHandle(finalName, { create: true });
    return { handle: fileHandle, parentDir: currentDir, finalName };
  }
}

/**
 * Resolves a relative path (e.g., 'folder/sub/file.md') from root directory.
 */
export async function resolvePath(
  rootDirHandle: FileSystemDirectoryHandle,
  relativePath: string
): Promise<{ fileHandle?: FileSystemFileHandle; dirHandle?: FileSystemDirectoryHandle; parentDir: FileSystemDirectoryHandle } | null> {
  const segments = relativePath.replace(/\\/g, '/').split('/').filter((s) => s.trim().length > 0);
  if (segments.length === 0) return null;

  try {
    let currentDir = rootDirHandle;
    for (let i = 0; i < segments.length - 1; i++) {
      currentDir = await currentDir.getDirectoryHandle(segments[i], { create: false });
    }

    const lastSegment = segments[segments.length - 1];
    try {
      const fileHandle = await currentDir.getFileHandle(lastSegment, { create: false });
      return { fileHandle, parentDir: currentDir };
    } catch {
      const dirHandle = await currentDir.getDirectoryHandle(lastSegment, { create: false });
      return { dirHandle, parentDir: currentDir };
    }
  } catch {
    return null;
  }
}

/**
 * Deletes a file or directory
 */
export async function deleteEntry(
  parentDirHandle: FileSystemDirectoryHandle,
  name: string,
  isDirectory: boolean
): Promise<void> {
  await parentDirHandle.removeEntry(name, { recursive: isDirectory });
}

/**
 * Renames an entry (file or folder)
 */
export async function renameEntry(
  parentDirHandle: FileSystemDirectoryHandle,
  handle: FileSystemHandle,
  oldName: string,
  newName: string
): Promise<FileSystemHandle> {
  // Check if native handle.move is supported (Chrome 111+)
  const handleAny = handle as unknown as { move?: (newName: string) => Promise<void> };
  if (typeof handleAny.move === 'function') {
    try {
      await handleAny.move(newName);
      return handle;
    } catch (e) {
      console.warn('Native move failed, falling back to copy/delete:', e);
    }
  }

  // Fallback for file renaming
  if (handle.kind === 'file') {
    const oldFileHandle = handle as FileSystemFileHandle;
    const file = await oldFileHandle.getFile();
    const newFileHandle = await parentDirHandle.getFileHandle(newName, { create: true });
    const writable = await newFileHandle.createWritable();
    await writable.write(file);
    await writable.close();
    await parentDirHandle.removeEntry(oldName, { recursive: false });
    return newFileHandle;
  }

  throw new Error('Renaming non-empty folders requires browser move() support');
}

/**
 * Moves an entry (drag & drop) into a target directory
 */
export async function moveEntry(
  sourceParentDir: FileSystemDirectoryHandle,
  handle: FileSystemHandle,
  targetDirHandle: FileSystemDirectoryHandle
): Promise<void> {
  // Check if native handle.move is supported
  const handleAny = handle as unknown as { move?: (targetDir: FileSystemDirectoryHandle, newName?: string) => Promise<void> };
  if (typeof handleAny.move === 'function') {
    await handleAny.move(targetDirHandle);
    return;
  }

  // Fallback for file
  if (handle.kind === 'file') {
    const fileHandle = handle as FileSystemFileHandle;
    const file = await fileHandle.getFile();
    const newFileHandle = await targetDirHandle.getFileHandle(handle.name, { create: true });
    const writable = await newFileHandle.createWritable();
    await writable.write(file);
    await writable.close();
    await sourceParentDir.removeEntry(handle.name, { recursive: false });
    return;
  }

  throw new Error('Moving folders requires browser move() support');
}
