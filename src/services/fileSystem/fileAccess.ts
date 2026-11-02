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
