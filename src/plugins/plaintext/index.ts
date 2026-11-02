import { FileCode } from 'lucide-react';
import type { ViewerPlugin } from '../../types/plugin';
import { PlainTextViewer } from './PlainTextViewer';
import { PlaintextToolbar } from './PlaintextToolbar';

export const plaintextPlugin: ViewerPlugin = {
  id: 'plaintext',
  name: 'Plain Text',
  extensions: [
    '.txt', '.log', '.json', '.js', '.jsx', '.ts', '.tsx',
    '.css', '.html', '.xml', '.yaml', '.yml', '.toml',
    '.ini', '.env', '.sh', '.bash', '.bat', '.ps1',
    '.py', '.go', '.rs', '.java', '.c', '.cpp', '.h',
    '.sql', '.csv', '.tsv',
  ],
  icon: FileCode,
  supportsEditing: true,
  component: PlainTextViewer,
  headerActions: PlaintextToolbar,
};
