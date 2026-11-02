export interface FileEntry {
  id: string; // full path or unique identifier
  name: string;
  path: string;
  kind: 'file' | 'directory';
  handle: FileSystemHandle;
  fileHandle?: FileSystemFileHandle;
  dirHandle?: FileSystemDirectoryHandle;
  parentDirHandle?: FileSystemDirectoryHandle;
  children?: FileEntry[];
  isOpen?: boolean;
}

export interface RecentWorkspace {
  id: string;
  name: string;
  handle: FileSystemDirectoryHandle;
  lastOpened: number;
}
