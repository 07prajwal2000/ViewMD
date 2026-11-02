import React, { useState, useEffect } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Group, Panel, Separator } from 'react-resizable-panels';
import type { ViewerProps } from '../../types/plugin';
import { useTheme } from '../../context/ThemeContext';
import { getStoredViewMode, type MarkdownViewMode } from '../../services/storage/settings';

export const MarkdownViewer: React.FC<ViewerProps> = ({ tab, onContentChange, onSave }) => {
  const { resolvedTheme } = useTheme();
  const [viewMode, setViewMode] = useState<MarkdownViewMode>(getStoredViewMode());

  // Listen for view mode changes triggered by toolbar
  useEffect(() => {
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<MarkdownViewMode>;
      if (customEvent.detail) {
        setViewMode(customEvent.detail);
      }
    };

    window.addEventListener('viewmd:viewmode-change', handler);
    return () => window.removeEventListener('viewmd:viewmode-change', handler);
  }, []);

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

  const renderEditor = () => (
    <div className="h-full w-full overflow-hidden bg-white dark:bg-[#1e1e1e] flex flex-col">
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={rawText}
          height="100%"
          className="h-full text-sm"
          theme={resolvedTheme === 'dark' ? oneDark : 'light'}
          extensions={[markdown()]}
          onChange={(val) => onContentChange(val)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="h-full w-full overflow-y-auto bg-white dark:bg-[#0d1117] p-8 transition-colors">
      <div className="max-w-4xl mx-auto">
        <article className="markdown-body" data-theme={resolvedTheme}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={{
              a: ({ ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              ),
            }}
          >
            {rawText || '*No content*'}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );

  if (viewMode === 'edit') {
    return <div className="h-full w-full">{renderEditor()}</div>;
  }

  if (viewMode === 'preview') {
    return <div className="h-full w-full">{renderPreview()}</div>;
  }

  // Split View (Default)
  return (
    <div className="h-full w-full select-text">
      <Group orientation="horizontal" className="h-full w-full">
        <Panel defaultSize={50} minSize={20} className="h-full">
          {renderEditor()}
        </Panel>
        <Separator className="relative w-1 bg-gray-200 dark:bg-gray-800 hover:bg-blue-500 active:bg-blue-600 transition-colors cursor-col-resize z-10 after:absolute after:inset-y-0 after:-left-2 after:-right-2 after:content-['']" />
        <Panel defaultSize={50} minSize={20} className="h-full">
          {renderPreview()}
        </Panel>
      </Group>
    </div>
  );
};
