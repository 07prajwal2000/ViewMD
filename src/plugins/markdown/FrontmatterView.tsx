import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  AlertCircle,
  Code2,
  Table as TableIcon,
  X,
} from 'lucide-react';

interface FrontmatterViewProps {
  data: Record<string, unknown> | null;
  raw: string;
  error: string | null;
}

export const FrontmatterView: React.FC<FrontmatterViewProps> = ({ data, raw, error }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewFormat, setViewFormat] = useState<'formatted' | 'raw'>('formatted');
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is not available
    }
  };

  const entries = data ? Object.entries(data) : [];
  const fieldCount = entries.length;

  // Render individual values intelligently based on their types
  const renderValue = (val: unknown): React.ReactNode => {
    if (val === null || val === undefined) {
      return <span className="text-gray-400 dark:text-gray-500 italic font-mono text-xs">null</span>;
    }

    if (typeof val === 'boolean') {
      return val ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
          <Check className="w-3 h-3" /> true
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
          <X className="w-3 h-3" /> false
        </span>
      );
    }

    if (typeof val === 'number') {
      return <span className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400">{val}</span>;
    }

    if (val instanceof Date) {
      const dateStr = val.toISOString().split('T')[0];
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-mono">
          <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          {dateStr}
        </span>
      );
    }

    if (Array.isArray(val)) {
      if (val.length === 0) {
        return <span className="text-gray-400 dark:text-gray-500 text-xs italic">empty list</span>;
      }

      // Check if primitive items (like tags/categories)
      const allPrimitives = val.every(
        (item) => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
      );

      if (allPrimitives) {
        return (
          <div className="flex flex-wrap gap-1.5 items-center">
            {val.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60"
              >
                {String(item)}
              </span>
            ))}
          </div>
        );
      }

      // Nested array of objects
      return (
        <div className="space-y-1.5 mt-1">
          {val.map((item, idx) => (
            <div
              key={idx}
              className="p-1.5 rounded bg-gray-50 dark:bg-[#161b22] border border-gray-200/70 dark:border-gray-800 text-xs"
            >
              {renderValue(item)}
            </div>
          ))}
        </div>
      );
    }

    if (typeof val === 'object') {
      return (
        <div className="rounded-md border border-gray-200/70 dark:border-gray-800 bg-white dark:bg-[#161b22] p-2 space-y-1.5 text-xs">
          {Object.entries(val as Record<string, unknown>).map(([subK, subV]) => (
            <div key={subK} className="grid grid-cols-12 gap-2 items-start">
              <span className="col-span-4 sm:col-span-3 font-mono text-gray-500 dark:text-gray-400 break-all select-all font-medium">
                {subK}:
              </span>
              <div className="col-span-8 sm:col-span-9 break-words">
                {renderValue(subV)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    const str = String(val);

    // URL formatting
    if (/^https?:\/\//i.test(str)) {
      return (
        <a
          href={str}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline break-all font-mono"
        >
          {str}
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      );
    }

    // Color swatch formatting
    if (/^#(?:[0-9a-fA-F]{3}){1,2}$/.test(str)) {
      return (
        <span className="inline-flex items-center gap-1.5 font-mono text-xs">
          <span
            className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600 shrink-0 shadow-2xs"
            style={{ backgroundColor: str }}
          />
          <span className="text-gray-800 dark:text-gray-200">{str}</span>
        </span>
      );
    }

    // Date formatted string
    if (/^\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?)?/.test(str)) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-mono">
          <Calendar className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
          {str}
        </span>
      );
    }

    return <span className="text-xs text-gray-800 dark:text-gray-200 break-words">{str}</span>;
  };

  return (
    <div className="mb-6 rounded-lg border border-gray-200 dark:border-gray-800/80 bg-gray-50/50 dark:bg-[#161b22]/50 overflow-hidden shadow-2xs transition-all">
      {/* Header bar */}
      <div className="px-3.5 py-2 flex items-center justify-between border-b border-gray-200/80 dark:border-gray-800/80 bg-gray-100/60 dark:bg-gray-800/40 select-none">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 tracking-tight">
            Frontmatter
          </span>

          {error ? (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-2.5 h-2.5" /> Syntax Error
            </span>
          ) : (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-gray-200/70 dark:bg-gray-700/60 text-gray-600 dark:text-gray-400">
              {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {!error && (
            <div className="flex items-center p-0.5 rounded bg-gray-200/60 dark:bg-gray-800 border border-gray-300/40 dark:border-gray-700/40 mr-1">
              <button
                type="button"
                onClick={() => setViewFormat('formatted')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  viewFormat === 'formatted'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Table view"
              >
                <TableIcon className="w-3 h-3" />
                <span className="hidden sm:inline">Table</span>
              </button>

              <button
                type="button"
                onClick={() => setViewFormat('raw')}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  viewFormat === 'raw'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-2xs'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Raw YAML view"
              >
                <Code2 className="w-3 h-3" />
                <span className="hidden sm:inline">YAML</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title={isCopied ? 'Copied YAML!' : 'Copy YAML'}
          >
            {isCopied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="p-1 rounded text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand frontmatter' : 'Collapse frontmatter'}
          >
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div>
          {error ? (
            <div className="p-3 text-xs space-y-2 bg-amber-500/5 dark:bg-amber-950/20">
              <div className="flex items-start gap-2 text-amber-700 dark:text-amber-400">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="font-mono break-all">{error}</div>
              </div>
              <pre className="p-2.5 rounded bg-white dark:bg-[#0d1117] border border-amber-200 dark:border-amber-900/60 font-mono text-[11px] overflow-x-auto text-gray-700 dark:text-gray-300 leading-relaxed">
                <code>{raw}</code>
              </pre>
            </div>
          ) : viewFormat === 'raw' ? (
            <pre className="p-3 bg-white dark:bg-[#0d1117] text-gray-800 dark:text-gray-200 font-mono text-xs overflow-x-auto leading-relaxed border-t border-gray-200/60 dark:border-gray-800/60">
              <code>{raw}</code>
            </pre>
          ) : (
            <div className="divide-y divide-gray-200/60 dark:divide-gray-800/60 bg-white/70 dark:bg-[#0d1117]/60">
              {entries.map(([key, val]) => (
                <div
                  key={key}
                  className="grid grid-cols-12 gap-2 px-3.5 py-2 hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors items-start"
                >
                  <div className="col-span-4 sm:col-span-3 font-mono font-medium text-xs text-gray-500 dark:text-gray-400 select-all break-all">
                    {key}
                  </div>
                  <div className="col-span-8 sm:col-span-9 flex items-center min-h-[22px]">
                    {renderValue(val)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
