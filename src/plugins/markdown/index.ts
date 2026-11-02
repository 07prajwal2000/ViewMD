import { FileText } from 'lucide-react';
import type { ViewerPlugin } from '../../types/plugin';
import { MarkdownViewer } from './MarkdownViewer';
import { MarkdownToolbar } from './MarkdownToolbar';

export const markdownPlugin: ViewerPlugin = {
  id: 'markdown',
  name: 'Markdown',
  extensions: ['.md', '.markdown', '.mdown', '.mkd'],
  icon: FileText,
  supportsEditing: true,
  component: MarkdownViewer,
  headerActions: MarkdownToolbar,
};
