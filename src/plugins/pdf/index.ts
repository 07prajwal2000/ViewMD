import { FileText } from 'lucide-react';
import type { ViewerPlugin } from '../../types/plugin';
import { PdfViewer } from './PdfViewer';

export const pdfPlugin: ViewerPlugin = {
  id: 'pdf',
  name: 'PDF Document',
  extensions: ['.pdf'],
  icon: FileText,
  supportsEditing: false,
  component: PdfViewer,
};
