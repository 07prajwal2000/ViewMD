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
  saveRecentLocalWorkspace,
  removeRecentWorkspace,
} from '../services/storage/recents';
import {
  getLocalProject,
  createLocalProjectRecord,
  saveFileToLocalProject,
  deleteItemFromLocalProject,
  renameItemInLocalProject,
  buildFileTreeFromLocalProject,
  type LocalProjectRecord,
} from '../services/storage/localProjects';

interface WorkspaceContextType {
  currentDirectory: FileSystemDirectoryHandle | null;
  currentLocalProject: LocalProjectRecord | null;
  isLocalWorkspace: boolean;
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
  // Local project actions
  createLocalProject: (name?: string, initialFiles?: Record<string, string>) => Promise<string | null>;
  openLocalProject: (projectId: string) => Promise<boolean>;
  updateLocalFileContent: (path: string, content: string) => void;
  getLocalFileContent: (path: string) => string | null;
  setLocalProjectDirectly: (project: LocalProjectRecord) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentDirectory, setCurrentDirectory] = useState<FileSystemDirectoryHandle | null>(null);
  const [currentLocalProject, setCurrentLocalProject] = useState<LocalProjectRecord | null>(null);
  const [fileTree, setFileTree] = useState<FileEntry[]>([]);
  const [recentWorkspaces, setRecentWorkspaces] = useState<RecentWorkspace[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const isLocalWorkspace = currentLocalProject !== null;
  const directoryName = currentDirectory
    ? currentDirectory.name
    : currentLocalProject
      ? currentLocalProject.name
      : null;

  // Load recents on mount
  useEffect(() => {
    getRecentWorkspaces().then(setRecentWorkspaces);
  }, []);

  const refreshTree = useCallback(async () => {
    if (currentLocalProject) {
      const refreshed = getLocalProject(currentLocalProject.id);
      if (refreshed) {
        setCurrentLocalProject(refreshed);
        setFileTree(buildFileTreeFromLocalProject(refreshed));
      }
      return;
    }

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
  }, [currentDirectory, currentLocalProject]);

  const loadDirectory = useCallback(async (dirHandle: FileSystemDirectoryHandle) => {
    setIsLoading(true);
    try {
      setCurrentLocalProject(null);
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

  const openLocalProject = useCallback(async (projectId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const project = getLocalProject(projectId);
      if (!project) {
        alert('Could not find this local project in LocalStorage.');
        await removeRecentWorkspace(projectId);
        const updated = await getRecentWorkspaces();
        setRecentWorkspaces(updated);
        return false;
      }

      setCurrentDirectory(null);
      setCurrentLocalProject(project);
      setFileTree(buildFileTreeFromLocalProject(project));

      const updatedRecents = await saveRecentLocalWorkspace(project.id, project.name);
      setRecentWorkspaces(updatedRecents);
      return true;
    } catch (err) {
      console.error('Failed to open local project:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setLocalProjectDirectly = useCallback((project: LocalProjectRecord) => {
    setCurrentDirectory(null);
    setCurrentLocalProject(project);
    setFileTree(buildFileTreeFromLocalProject(project));
    saveRecentLocalWorkspace(project.id, project.name).then(setRecentWorkspaces);
  }, []);

  const createLocalProject = useCallback(
    async (name?: string, initialFiles?: Record<string, string>): Promise<string | null> => {
      try {
        const projectName = name?.trim() || window.prompt('Enter project name:', 'LocalStorage Project')?.trim();
        if (!projectName) return null;

        const project = createLocalProjectRecord(projectName, initialFiles);
        setLocalProjectDirectly(project);
        return project.id;
      } catch (err) {
        console.error('Failed to create local project:', err);
        alert('Failed to create project: ' + (err instanceof Error ? err.message : String(err)));
        return null;
      }
    },
    [setLocalProjectDirectly]
  );

  const openRecentFolder = useCallback(
    async (recent: RecentWorkspace): Promise<boolean> => {
      if (recent.isLocal || !recent.handle) {
        return openLocalProject(recent.id);
      }

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
        await removeRecentWorkspace(recent.id || recent.name);
        const updated = await getRecentWorkspaces();
        setRecentWorkspaces(updated);
        alert('This folder is no longer accessible and has been removed from recents.');
        return false;
      }
    },
    [loadDirectory, openLocalProject]
  );

  const removeRecent = useCallback(async (nameOrId: string) => {
    const updated = await removeRecentWorkspace(nameOrId);
    setRecentWorkspaces(updated);
  }, []);

  const createItem = useCallback(
    async (
      pathWithSlashes: string,
      isDirectory: boolean,
      targetDirHandle?: FileSystemDirectoryHandle
    ): Promise<FileEntry | null> => {
      // Local workspace branch
      if (currentLocalProject) {
        try {
          const normPath = pathWithSlashes.replace(/\\/g, '/').replace(/^\/+/, '');
          const segments = normPath.split('/');
          const finalName = segments[segments.length - 1];

          let updated: LocalProjectRecord | null = null;
          if (isDirectory) {
            // Create directory placeholder file so it appears in the tree
            const keepPath = `${normPath}/.viewmdkeep`;
            updated = saveFileToLocalProject(currentLocalProject.id, keepPath, '');
          } else {
            const initialText = `# ${finalName.replace(/\.[^/.]+$/, '')}\n\n`;
            updated = saveFileToLocalProject(currentLocalProject.id, normPath, initialText);
          }

          if (updated) {
            setCurrentLocalProject(updated);
            setFileTree(buildFileTreeFromLocalProject(updated));
            return {
              id: normPath,
              name: finalName,
              path: normPath,
              kind: isDirectory ? 'directory' : 'file',
              content: isDirectory ? undefined : updated.files[normPath]?.content,
              isLocal: true,
            };
          }
          return null;
        } catch (err) {
          console.error('Failed to create local item:', err);
          alert('Failed to create item: ' + (err instanceof Error ? err.message : String(err)));
          return null;
        }
      }

      // Native disk workspace branch
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
    [currentDirectory, currentLocalProject, refreshTree]
  );

  const deleteNode = useCallback(
    async (entry: FileEntry): Promise<boolean> => {
      const isDir = entry.kind === 'directory';
      const confirmed = window.confirm(
        `Are you sure you want to delete ${isDir ? 'folder' : 'file'} "${entry.name}"?`
      );
      if (!confirmed) return false;

      // Local workspace branch
      if (currentLocalProject) {
        try {
          const updated = deleteItemFromLocalProject(
            currentLocalProject.id,
            entry.path,
            isDir
          );
          if (updated) {
            setCurrentLocalProject(updated);
            setFileTree(buildFileTreeFromLocalProject(updated));
            return true;
          }
          return false;
        } catch (err) {
          console.error('Failed to delete local node:', err);
          alert('Failed to delete: ' + (err instanceof Error ? err.message : String(err)));
          return false;
        }
      }

      // Native disk workspace branch
      const parentDir = entry.parentDirHandle || currentDirectory;
      if (!parentDir) return false;

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
    [currentDirectory, currentLocalProject, refreshTree]
  );

  const renameNode = useCallback(
    async (entry: FileEntry, newName: string): Promise<boolean> => {
      if (!newName || newName === entry.name) return false;

      // Local workspace branch
      if (currentLocalProject) {
        try {
          const segments = entry.path.replace(/\\/g, '/').split('/');
          segments[segments.length - 1] = newName;
          const newPath = segments.join('/');

          const updated = renameItemInLocalProject(
            currentLocalProject.id,
            entry.path,
            newPath,
            entry.kind === 'directory'
          );
          if (updated) {
            setCurrentLocalProject(updated);
            setFileTree(buildFileTreeFromLocalProject(updated));
            return true;
          }
          return false;
        } catch (err) {
          console.error('Failed to rename local node:', err);
          alert('Failed to rename: ' + (err instanceof Error ? err.message : String(err)));
          return false;
        }
      }

      // Native disk workspace branch
      const parentDir = entry.parentDirHandle || currentDirectory;
      if (!parentDir) return false;

      try {
        await renameEntry(parentDir, entry.handle!, entry.name, newName);
        await refreshTree();
        return true;
      } catch (err) {
        console.error('Failed to rename:', err);
        alert('Failed to rename: ' + (err instanceof Error ? err.message : String(err)));
        return false;
      }
    },
    [currentDirectory, currentLocalProject, refreshTree]
  );

  const moveNode = useCallback(
    async (
      sourceEntry: FileEntry,
      targetDirHandle: FileSystemDirectoryHandle
    ): Promise<boolean> => {
      if (currentLocalProject) {
        // In local project, drag and drop to root or subfolder
        return false;
      }

      const sourceParentDir = sourceEntry.parentDirHandle || currentDirectory;
      if (!sourceParentDir || !sourceEntry.handle) return false;

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
    [currentDirectory, currentLocalProject, refreshTree]
  );

  const updateLocalFileContent = useCallback(
    (path: string, content: string) => {
      if (!currentLocalProject) return;
      const updated = saveFileToLocalProject(currentLocalProject.id, path, content);
      if (updated) {
        setCurrentLocalProject(updated);
      }
    },
    [currentLocalProject]
  );

  const getLocalFileContent = useCallback(
    (path: string): string | null => {
      if (!currentLocalProject) return null;
      return currentLocalProject.files[path]?.content ?? null;
    },
    [currentLocalProject]
  );

  return (
    <WorkspaceContext.Provider
      value={{
        currentDirectory,
        currentLocalProject,
        isLocalWorkspace,
        directoryName,
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
        createLocalProject,
        openLocalProject,
        updateLocalFileContent,
        getLocalFileContent,
        setLocalProjectDirectly,
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
