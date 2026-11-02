import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface TabItem {
  id: string; // unique path or id
  name: string;
  path: string;
  fileHandle?: FileSystemFileHandle | null;
  content: string | Blob;
  isDirty: boolean;
  pluginId: string;
  isPinned?: boolean;
  isMissing?: boolean;
  errorMessage?: string;
}

export interface ViewerProps {
  tab: TabItem;
  onContentChange: (newContent: string) => void;
  onSave: () => void;
}

export interface ViewerHeaderActionProps {
  tab: TabItem;
  onSave: () => void;
}

export interface ViewerPlugin {
  id: string;
  name: string;
  extensions: string[];
  icon?: LucideIcon;
  supportsEditing: boolean;
  component: React.ComponentType<ViewerProps>;
  headerActions?: React.ComponentType<ViewerHeaderActionProps>;
}
