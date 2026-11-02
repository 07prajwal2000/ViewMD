import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { FileEntry, RecentWorkspace } from '../types/fileSystem';
import {
  openDirectoryPicker,
  verifyPermission,
  createFileInDir,
  createSubDirInDir,
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
  createFile: (name: string, targetDirHandle?: FileSystemDirectoryHandle) => Promise<FileEntry | null>;
  createFolder: (name: string, targetDirHandle?: FileSystemDirectoryHandle) => Promise<boolean>;
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
        // If handle is no longer valid or accessible, remove it from recents
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

  const createFile = useCallback(
    async (name: string, targetDirHandle?: FileSystemDirectoryHandle): Promise<FileEntry | null> => {
      const dir = targetDirHandle || currentDirectory;
      if (!dir) return null;

      try {
        const fileHandle = await createFileInDir(dir, name);
        await refreshTree();
        return {
          id: name,
          name,
          path: name,
          kind: 'file',
          handle: fileHandle,
          fileHandle,
        };
      } catch (err) {
        console.error('Failed to create file:', err);
        alert('Failed to create file: ' + (err instanceof Error ? err.message : String(err)));
        return null;
      }
    },
    [currentDirectory, refreshTree]
  );

  const createFolder = useCallback(
    async (name: string, targetDirHandle?: FileSystemDirectoryHandle): Promise<boolean> => {
      const dir = targetDirHandle || currentDirectory;
      if (!dir) return false;

      try {
        await createSubDirInDir(dir, name);
        await refreshTree();
        return true;
      } catch (err) {
        console.error('Failed to create folder:', err);
        alert('Failed to create folder: ' + (err instanceof Error ? err.message : String(err)));
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
        createFile,
        createFolder,
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
