import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  File,
  FilePlus,
  FolderPlus,
  MoreVertical,
  Edit2,
  Trash2,
} from 'lucide-react';
import type { FileEntry } from '../../types/fileSystem';
import { useTabs } from '../../context/TabsContext';
import { useWorkspace } from '../../context/WorkspaceContext';

interface FileTreeNodeProps {
  entry: FileEntry;
  depth?: number;
  onNewPrompt: (type: 'file' | 'folder', dirHandle: FileSystemDirectoryHandle) => void;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  entry,
  depth = 0,
  onNewPrompt,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(entry.name);
  const [isDragOver, setIsDragOver] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const { openFile, activePrimaryTabId, activeSecondaryTabId, closeTab } = useTabs();
  const { deleteNode, renameNode, moveNode, fileTree } = useWorkspace();

  const isDirectory = entry.kind === 'directory';
  const isSelected = !isDirectory && (activePrimaryTabId === entry.id || activeSecondaryTabId === entry.id);

  // Close 3-dot menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDirectory) {
      setIsOpen(!isOpen);
    } else {
      openFile(entry);
    }
  };

  const handleRenameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newName = renameValue.trim();
    if (newName && newName !== entry.name) {
      const success = await renameNode(entry, newName);
      if (success) {
        setIsRenaming(false);
      }
    } else {
      setIsRenaming(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    const success = await deleteNode(entry);
    if (success) {
      // If deleted entry is open in tabs, close in both panes
      closeTab(entry.id, 'primary');
      closeTab(entry.id, 'secondary');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData('application/json', JSON.stringify({ path: entry.path, name: entry.name }));
  };

  const findEntryByPath = (items: FileEntry[], targetPath: string): FileEntry | null => {
    for (const item of items) {
      if (item.path === targetPath) return item;
      if (item.children) {
        const found = findEntryByPath(item.children, targetPath);
        if (found) return found;
      }
    }
    return null;
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (!isDirectory || !entry.dirHandle) return;

    try {
      const dataStr = e.dataTransfer.getData('application/json');
      if (!dataStr) return;
      const data = JSON.parse(dataStr) as { path: string; name: string };

      // Cannot drop inside self
      if (data.path === entry.path || data.path.startsWith(entry.path + '/')) {
        return;
      }

      const sourceEntry = findEntryByPath(fileTree, data.path);
      if (sourceEntry) {
        await moveNode(sourceEntry, entry.dirHandle);
      }
    } catch (err) {
      console.error('Error handling drop:', err);
    }
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'md':
      case 'markdown':
        return <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
      case 'pdf':
        return <File className="w-3.5 h-3.5 text-rose-500 shrink-0" />;
      case 'json':
      case 'js':
      case 'ts':
      case 'tsx':
      case 'jsx':
      case 'go':
      case 'rs':
        return <FileCode className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      default:
        return <File className="w-3.5 h-3.5 text-gray-400 shrink-0" />;
    }
  };

  return (
    <div className="select-none text-xs">
      <div
        draggable={!isRenaming}
        onDragStart={handleDragStart}
        onDragOver={(e) => {
          if (isDirectory) {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(true);
          }
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={`flex items-center justify-between pr-2 py-1 cursor-pointer group transition-colors rounded-sm relative ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 font-medium'
            : isDragOver
            ? 'bg-blue-200/70 dark:bg-blue-900/60 ring-1 ring-blue-500'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate flex-1 min-w-0 mr-1">
          {isDirectory ? (
            <>
              <span className="p-0.5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300">
                {isOpen ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </span>
              {isOpen ? (
                <FolderOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              ) : (
                <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              )}
            </>
          ) : (
            <>
              <span className="w-4 shrink-0" />
              {getFileIcon(entry.name)}
            </>
          )}

          {isRenaming ? (
            <form onSubmit={handleRenameSubmit} onClick={(e) => e.stopPropagation()} className="flex-1">
              <input
                type="text"
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsRenaming(false);
                    setRenameValue(entry.name);
                  }
                }}
                className="w-full text-xs px-1 py-0.5 rounded bg-white dark:bg-gray-900 border border-blue-500 text-gray-900 dark:text-gray-100 outline-hidden"
              />
            </form>
          ) : (
            <span className="truncate">{entry.name}</span>
          )}
        </div>

        {/* Hover Action Icons */}
        {!isRenaming && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Folder Actions: New File & New Folder */}
            {isDirectory && entry.dirHandle && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                    onNewPrompt('file', entry.dirHandle!);
                  }}
                  className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded cursor-pointer"
                  title="New File in folder"
                >
                  <FilePlus className="w-3 h-3" />
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(true);
                    onNewPrompt('folder', entry.dirHandle!);
                  }}
                  className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded cursor-pointer"
                  title="New Subfolder"
                >
                  <FolderPlus className="w-3 h-3" />
                </button>
              </>
            )}

            {/* 3-dot context menu for both file & folder */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded cursor-pointer"
                title="Options"
              >
                <MoreVertical className="w-3 h-3" />
              </button>

              {isMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsRenaming(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Rename</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Render Subdirectory Children */}
      {isDirectory && isOpen && entry.children && (
        <div>
          {entry.children.map((child) => (
            <FileTreeNode
              key={child.id}
              entry={child}
              depth={depth + 1}
              onNewPrompt={onNewPrompt}
            />
          ))}
        </div>
      )}
    </div>
  );
};
