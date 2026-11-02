import React, { useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import type { ViewerProps } from '../../types/plugin';
import { useTheme } from '../../context/ThemeContext';
import { useEditorSettings } from '../../context/EditorSettingsContext';

export const PlainTextViewer: React.FC<ViewerProps> = ({ tab, onContentChange, onSave }) => {
  const { resolvedTheme } = useTheme();
  const { isWrapText } = useEditorSettings();

  // Listen for Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  const rawText = typeof tab.content === 'string' ? tab.content : '';

  return (
    <div className="h-full w-full bg-white dark:bg-[#1e1e1e] flex flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={rawText}
          height="100%"
          className="h-full text-sm font-mono"
          theme={resolvedTheme === 'dark' ? oneDark : 'light'}
          extensions={isWrapText ? [EditorView.lineWrapping] : []}
          onChange={(val) => onContentChange(val)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: false, // No folding for clean raw plaintext
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: false,
            syntaxHighlighting: false, // Pure plaintext - no formatting
            bracketMatching: true,
            closeBrackets: false,
            autocompletion: false,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
          }}
        />
      </div>
    </div>
  );
};
