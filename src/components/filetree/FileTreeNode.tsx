import React, { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  File,
  Plus,
} from 'lucide-react';
import type { FileEntry } from '../../types/fileSystem';
import { useTabs } from '../../context/TabsContext';

interface FileTreeNodeProps {
  entry: FileEntry;
  depth?: number;
  onNewFilePrompt?: (dirHandle: FileSystemDirectoryHandle) => void;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  entry,
  depth = 0,
  onNewFilePrompt,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { openFile, activeTabId } = useTabs();

  const isDirectory = entry.kind === 'directory';
  const isSelected = !isDirectory && activeTabId === entry.id;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDirectory) {
      setIsOpen(!isOpen);
    } else {
      openFile(entry);
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
        onClick={handleClick}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        className={`flex items-center justify-between pr-2 py-1 cursor-pointer group transition-colors rounded-sm ${
          isSelected
            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-100 font-medium'
            : 'hover:bg-gray-100 dark:hover:bg-gray-800/60 text-gray-700 dark:text-gray-300'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
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
              <span className="w-4 shrink-0" /> {/* indent align */}
              {getFileIcon(entry.name)}
            </>
          )}

          <span className="truncate">{entry.name}</span>
        </div>

        {/* Action icons on hover (e.g. create file in directory) */}
        {isDirectory && entry.dirHandle && onNewFilePrompt && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNewFilePrompt(entry.dirHandle!);
            }}
            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-opacity rounded hover:bg-gray-200/50 dark:hover:bg-gray-700/50"
            title="New File in folder"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}
      </div>

      {isDirectory && isOpen && entry.children && (
        <div>
          {entry.children.map((child) => (
            <FileTreeNode
              key={child.id}
              entry={child}
              depth={depth + 1}
              onNewFilePrompt={onNewFilePrompt}
            />
          ))}
        </div>
      )}
    </div>
  );
};
