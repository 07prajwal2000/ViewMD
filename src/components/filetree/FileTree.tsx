import React, { useState } from 'react';
import {
  FolderOpen,
  FilePlus,
  FolderPlus,
  RefreshCw,
  Folder,
  Clock,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { useTabs } from '../../context/TabsContext';
import { FileTreeNode } from './FileTreeNode';

export const FileTree: React.FC = () => {
  const {
    currentDirectory,
    directoryName,
    fileTree,
    recentWorkspaces,
    isLoading,
    openFolder,
    openRecentFolder,
    refreshTree,
    createFile,
    createFolder,
  } = useWorkspace();

  const { openFile } = useTabs();

  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [targetDir, setTargetDir] = useState<FileSystemDirectoryHandle | undefined>(undefined);

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
    const name = newItemName.trim();
    if (!name) return;

    if (isCreatingFile) {
      // Ensure .md extension if no extension was provided
      const finalName = name.includes('.') ? name : `${name}.md`;
      const newEntry = await createFile(finalName, targetDir);
      if (newEntry) {
        openFile(newEntry);
      }
      setIsCreatingFile(false);
    } else if (isCreatingFolder) {
      await createFolder(name, targetDir);
      setIsCreatingFolder(false);
    }
    setNewItemName('');
  };

  if (!currentDirectory) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
          <Folder className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
          No Folder Open
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-[200px]">
          Open a local directory on your device to edit and preview Markdown documents.
        </p>

        <button
          type="button"
          onClick={openFolder}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Open Folder</span>
        </button>

        {recentWorkspaces.length > 0 && (
          <div className="mt-8 w-full text-left">
            <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-gray-400 uppercase mb-2">
              <Clock className="w-3 h-3" />
              <span>Recent Workspaces</span>
            </div>
            <div className="flex flex-col gap-1">
              {recentWorkspaces.slice(0, 5).map((recent) => (
                <button
                  key={recent.name}
                  type="button"
                  onClick={() => openRecentFolder(recent)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-left text-gray-700 dark:text-gray-300 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors truncate cursor-pointer"
                >
                  <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="truncate">{recent.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50/50 dark:bg-[#161b22] border-r border-gray-200 dark:border-gray-800 select-none">
      {/* Explorer Header */}
      <div className="h-9 px-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800/80 shrink-0">
        <span className="text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 uppercase truncate">
          {directoryName}
        </span>

        <div className="flex items-center gap-0.5 text-gray-500 dark:text-gray-400">
          <button
            type="button"
            onClick={() => handleCreatePrompt('file')}
            className="p-1 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
            title="New Markdown File"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => handleCreatePrompt('folder')}
            className="p-1 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
            title="New Folder"
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
            placeholder={isCreatingFile ? 'filename.md' : 'folder name'}
            className="w-full text-xs px-2 py-1 rounded bg-white dark:bg-gray-900 border border-blue-500 focus:outline-hidden text-gray-900 dark:text-gray-100 shadow-2xs"
          />
          <div className="text-[10px] text-gray-400 mt-1 flex justify-between px-0.5">
            <span>Press Enter to create</span>
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
            Folder is empty
          </div>
        ) : (
          fileTree.map((entry) => (
            <FileTreeNode
              key={entry.id}
              entry={entry}
              depth={0}
              onNewFilePrompt={(dir) => handleCreatePrompt('file', dir)}
            />
          ))
        )}
      </div>
    </div>
  );
};
