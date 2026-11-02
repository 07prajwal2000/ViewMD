import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { FileEntry, RecentWorkspace } from '../types/fileSystem';
import {
  openDirectoryPicker,
  verifyPermission,
  createPathRecursive,
  deleteEntry,
  renameEntry,
  moveEntry,
} from '../services/fileSystem/fileAccess';
import { readDirectoryTree } from '../services/fileSystem/directoryTree';
import {
  getRecentWorkspaces,
  saveRecentWorkspace,
  removeRecentWorkspace,
} from '../services/storage/recents';

interface WorkspaceContextType {
  currentDirectory: FileSystemDirectoryHandle | null;
  directoryName: string | null;
  fileTree: FileEntry[];
  recentWorkspaces: RecentWorkspace[];
  isLoading: boolean;
  openFolder: () => Promise<void>;
  openRecentFolder: (recent: RecentWorkspace) => Promise<boolean>;
  removeRecent: (name: string) => Promise<void>;
  refreshTree: () => Promise<void>;
  createItem: (
    pathWithSlashes: string,
    isDirectory: boolean,
    targetDirHandle?: FileSystemDirectoryHandle
  ) => Promise<FileEntry | null>;
  deleteNode: (entry: FileEntry) => Promise<boolean>;
  renameNode: (entry: FileEntry, newName: string) => Promise<boolean>;
  moveNode: (
    sourceEntry: FileEntry,
    targetDirHandle: FileSystemDirectoryHandle
  ) => Promise<boolean>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDirectory, setCurrentDirectory] = useState<FileSystemDirectoryHandle | null>(null);
  const [fileTree, setFileTree] = useState<FileEntry[]>([]);
  const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load recents on mount
  useEffect(() => {
    getRecentWorkspaces().then(setRecentWorkspaces);
  }, []);

  const refreshTree = useCallback(async () => {
    if (!currentDirectory) return;
    try {
      setIsLoading(true);
      const tree = await readDirectoryTree(currentDirectory);
      setFileTree(tree);
    } catch (err) {
      console.error('Error refreshing directory tree:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentDirectory]);

  const loadDirectory = useCallback(async (dirHandle: FileSystemDirectoryHandle) => {
    setIsLoading(true);
    try {
      setCurrentDirectory(dirHandle);
      const tree = await readDirectoryTree(dirHandle);
      setFileTree(tree);
      const updatedRecents = await saveRecentWorkspace(dirHandle);
      setRecentWorkspaces(updatedRecents);
    } catch (err) {
      console.error('Failed to load directory:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openFolder = useCallback(async () => {
    try {
      const handle = await openDirectoryPicker();
      if (handle) {
        await loadDirectory(handle);
      }
    } catch (err) {
      console.error('Error opening folder:', err);
      alert(err instanceof Error ? err.message : 'Failed to open folder');
    }
  }, [loadDirectory]);

  const openRecentFolder = useCallback(
    async (recent: RecentWorkspace): Promise<boolean> => {
      try {
        const hasPermission = await verifyPermission(recent.handle, true);
        if (!hasPermission) {
          alert('Permission was not granted to access this folder.');
          return false;
        }
        await loadDirectory(recent.handle);
        return true;
      } catch (err) {
        console.error('Failed to open recent folder:', err);
        await removeRecentWorkspace(recent.name);
        const updated = await getRecentWorkspaces();
        setRecentWorkspaces(updated);
        alert('This folder is no longer accessible and has been removed from recents.');
        return false;
      }
    },
    [loadDirectory]
  );

  const removeRecent = useCallback(async (name: string) => {
    const updated = await removeRecentWorkspace(name);
    setRecentWorkspaces(updated);
  }, []);

  const createItem = useCallback(
    async (
      pathWithSlashes: string,
      isDirectory: boolean,
      targetDirHandle?: FileSystemDirectoryHandle
    ): Promise<FileEntry | null> => {
      const baseDir = targetDirHandle || currentDirectory;
      if (!baseDir) return null;

      try {
        const { handle, finalName, parentDir } = await createPathRecursive(
          baseDir,
          pathWithSlashes,
          isDirectory
        );
        await refreshTree();

        return {
          id: pathWithSlashes,
          name: finalName,
          path: pathWithSlashes,
          kind: isDirectory ? 'directory' : 'file',
          handle,
          fileHandle: isDirectory ? undefined : (handle as FileSystemFileHandle),
          dirHandle: isDirectory ? (handle as FileSystemDirectoryHandle) : undefined,
          parentDirHandle: parentDir,
        };
      } catch (err) {
        console.error('Failed to create item:', err);
        alert('Failed to create item: ' + (err instanceof Error ? err.message : String(err)));
        return null;
      }
    },
    [currentDirectory, refreshTree]
  );

  const deleteNode = useCallback(
    async (entry: FileEntry): Promise<boolean> => {
      const parentDir = entry.parentDirHandle || currentDirectory;
      if (!parentDir) return false;

      const isDir = entry.kind === 'directory';
      const confirmed = window.confirm(
        `Are you sure you want to delete ${isDir ? 'folder' : 'file'} "${entry.name}"?`
      );
      if (!confirmed) return false;

      try {
        await deleteEntry(parentDir, entry.name, isDir);
        await refreshTree();
        return true;
      } catch (err) {
        console.error('Failed to delete:', err);
        alert('Failed to delete: ' + (err instanceof Error ? err.message : String(err)));
        return false;
      }
    },
    [currentDirectory, refreshTree]
  );

  const renameNode = useCallback(
    async (entry: FileEntry, newName: string): Promise<boolean> => {
      const parentDir = entry.parentDirHandle || currentDirectory;
      if (!parentDir || !newName || newName === entry.name) return false;

      try {
        await renameEntry(parentDir, entry.handle, entry.name, newName);
        await refreshTree();
        return true;
      } catch (err) {
        console.error('Failed to rename:', err);
        alert('Failed to rename: ' + (err instanceof Error ? err.message : String(err)));
        return false;
      }
    },
    [currentDirectory, refreshTree]
  );

  const moveNode = useCallback(
    async (
      sourceEntry: FileEntry,
      targetDirHandle: FileSystemDirectoryHandle
    ): Promise<boolean> => {
      const sourceParentDir = sourceEntry.parentDirHandle || currentDirectory;
      if (!sourceParentDir) return false;

      try {
        await moveEntry(sourceParentDir, sourceEntry.handle, targetDirHandle);
        await refreshTree();
        return true;
      } catch (err) {
        console.error('Failed to move:', err);
        alert('Failed to move: ' + (err instanceof Error ? err.message : String(err)));
        return false;
      }
    },
    [currentDirectory, refreshTree]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        currentDirectory,
        directoryName: currentDirectory ? currentDirectory.name : null,
        fileTree,
        recentWorkspaces,
        isLoading,
        openFolder,
        openRecentFolder,
        removeRecent,
        refreshTree,
        createItem,
        deleteNode,
        renameNode,
        moveNode,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export function useWorkspace(): WorkspaceContextType {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
