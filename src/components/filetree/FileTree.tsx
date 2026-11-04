import React, { useState } from 'react';
import {
  FolderOpen,
  FilePlus,
  FolderPlus,
  RefreshCw,
  Folder,
  Clock,
  Search,
  Database,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTabs } from '../../context/TabsContext';
import { useSearch } from '../../context/SearchContext';
import { FileTreeNode } from './FileTreeNode';

export const FileTree: React.FC = () => {
  const {
    currentDirectory,
    isLocalWorkspace,
    directoryName,
    fileTree,
    recentWorkspaces,
    isLoading,
    openFolder,
    openRecentFolder,
    refreshTree,
    createItem,
    moveNode,
    createLocalProject,
  } = useWorkspace();

  const { openFile, createNewInMemoryFile } = useTabs();
  const { openSearch } = useSearch();

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [targetDir, setTargetDir] = useState<FileSystemDirectoryHandle | undefined>(undefined);
  const [isRootDragOver, setIsRootDragOver] = useState(false);

  const handleCreatePrompt = (
    type: 'file' | 'folder',
    target?: FileSystemDirectoryHandle
  ) => {
    setTargetDir(target || currentDirectory || undefined);
    setNewItemName('');
    if (type === 'file') {
      setIsCreatingFile(true);
      setIsCreatingFolder(false);
    } else {
      setIsCreatingFolder(true);
      setIsCreatingFile(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawName = newItemName.trim();
    if (!rawName) return;

    if (isCreatingFile) {
      // If no extension given at end of path, default to .md
      const segments = rawName.split('/');
      const last = segments[segments.length - 1];
      const withExt = last.includes('.') ? rawName : `${rawName}.md`;

      const newEntry = await createItem(withExt, false, targetDir);
      if (newEntry) {
        openFile(newEntry);
      }
      setIsCreatingFile(false);
    } else if (isCreatingFolder) {
      await createItem(rawName, true, targetDir);
      setIsCreatingFolder(false);
    }
    setNewItemName('');
  };

  const findEntryByPath = (items: typeof fileTree, targetPath: string): typeof fileTree[0] | null => {
    for (const item of items) {
      if (item.path === targetPath) return item;
      if (item.children) {
        const found = findEntryByPath(item.children, targetPath);
        if (found) return found;
      }
    }
    return null;
  };

  const handleRootDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsRootDragOver(false);
    if (!currentDirectory) return;

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr) as { path: string };
      const sourceEntry = findEntryByPath(fileTree, data.path);
      if (sourceEntry && sourceEntry.parentDirHandle !== currentDirectory) {
        await moveNode(sourceEntry, currentDirectory);
      }
    } catch (err) {
      console.error('Failed to move to root:', err);
    }
  };

  if (!currentDirectory && !isLocalWorkspace) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none overflow-y-auto">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
          <Folder className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
          No Workspace Open
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5 max-w-[210px] leading-relaxed">
          Open a folder from your disk, or create a fast in-memory project stored in LocalStorage.
        </p>

        <div className="flex flex-col gap-2 w-full max-w-[190px]">
          <button
            type="button"
            onClick={() => createLocalProject()}
            className="flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FolderPlus className="w-4 h-4" />
            <span>New Local Project</span>
          </button>

          <button
            type="button"
            onClick={openFolder}
            className="flex items-center justify-center gap-2 px-3.5 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Open Folder</span>
          </button>

          <button
            type="button"
            onClick={() => createNewInMemoryFile()}
            className="flex items-center justify-center gap-2 px-3.5 py-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-medium transition-colors cursor-pointer"
          >
            <FilePlus className="w-4 h-4" />
            <span>New File</span>
          </button>
        </div>

        {recentWorkspaces.length > 0 && (
          <div className="mt-8 w-full text-left">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-gray-400 uppercase mb-2">
              <Clock className="w-3 h-3" />
              <span>Recent Workspaces</span>
            </div>
            <div className="flex flex-col gap-1">
              {recentWorkspaces.slice(0, 5).map((recent) => (
                <button
                  key={recent.id || recent.name}
                  type="button"
                  onClick={() => openRecentFolder(recent)}
                  className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs text-left text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors truncate cursor-pointer group"
                >
                  <div className="flex items-center gap-2 truncate">
                    {recent.isLocal ? (
                      <Database className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    ) : (
                      <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    )}
                    <span className="truncate">{recent.name}</span>
                  </div>
                  {recent.isLocal && (
                    <span className="text-[9px] px-1 py-0.2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 dark:text-indigo-400 rounded shrink-0">
                      Local
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsRootDragOver(true);
      }}
      onDragLeave={() => setIsRootDragOver(false)}
      onDrop={handleRootDrop}
      className={`h-full flex flex-col bg-gray-50/50 dark:bg-[#161b22] select-none ${
        isRootDragOver ? 'ring-2 ring-inset ring-blue-500/50' : ''
      }`}
    >
      {/* Explorer Header */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800/80 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          {isLocalWorkspace && (
            <span title="Stored in LocalStorage" className="shrink-0 flex items-center">
              <Database className="w-3 h-3 text-indigo-500" />
            </span>
          )}
          <span className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase truncate">
            {directoryName}
          </span>
          {isLocalWorkspace && (
            <span className="text-[9px] px-1 py-0.2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded font-semibold shrink-0">
              Local
            </span>
          )}
        </div>

        <div className="flex items-center gap-0.5 text-gray-500 dark:text-gray-400 shrink-0">
          <button
            type="button"
            onClick={() => openSearch('files')}
            className="p-1 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
            title="Search Workspace (Ctrl+P / Ctrl+Shift+F)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleCreatePrompt('file')}
            className="p-1 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
            title="New File (supports sub/folder/file.md)"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleCreatePrompt('folder')}
            className="p-1 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
            title="New Folder (supports path/subfolder)"
          >
            <FolderPlus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={refreshTree}
            className="p-1 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
            title="Refresh Explorer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Inline Create Input */}
      {(isCreatingFile || isCreatingFolder) && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/20">
          <input
            type="text"
            autoFocus
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setIsCreatingFile(false);
                setIsCreatingFolder(false);
              }
            }}
            placeholder={isCreatingFile ? 'folder/file.md' : 'folder/subfolder'}
            className="w-full text-xs px-2 py-1 rounded bg-white dark:bg-gray-900 border border-blue-500 focus:outline-hidden text-gray-900 dark:text-gray-100 shadow-2xs"
          />
          <div className="text-[10px] text-gray-400 mt-1 flex justify-between px-0.5">
            <span>Use `/` to create subfolders automatically</span>
            <button
              type="button"
              onClick={() => {
                setIsCreatingFile(false);
                setIsCreatingFolder(false);
              }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto py-1">
        {fileTree.length === 0 ? (
          <div className="p-4 text-center text-xs text-gray-400 italic">
            Workspace is empty
          </div>
        ) : (
          fileTree.map((entry) => (
            <FileTreeNode
              key={entry.id}
              entry={entry}
              depth={0}
              onNewPrompt={(type, dir) => handleCreatePrompt(type, dir)}
            />
          ))
        )}
      </div>
    </div>
  );
};
