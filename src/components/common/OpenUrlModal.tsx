import React, { useState } from 'react';
import { Globe, X, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { useTabs } from '../../context/TabsContext';

interface OpenUrlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpenUrlModal: React.FC<OpenUrlModalProps> = ({ isOpen, onClose }) => {
  const { loadFromUrl } = useTabs();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetUrl = url.trim();
    if (!targetUrl) return;

    setIsLoading(true);
    setError(null);

    const success = await loadFromUrl(targetUrl);
    setIsLoading(false);

    if (success) {
      onClose();
      setUrl('');
    } else {
      setError('Failed to load file. Ensure the URL is valid, accessible, and supports CORS.');
    }
  };

  const handleQuickLoad = async (sampleUrl: string) => {
    setUrl(sampleUrl);
    setIsLoading(true);
    setError(null);

    const success = await loadFromUrl(sampleUrl);
    setIsLoading(false);

    if (success) {
      onClose();
      setUrl('');
    } else {
      setError(`Failed to load ${sampleUrl}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100 font-semibold text-sm">
            <Globe className="w-4 h-4 text-blue-500" />
            <span>Open Markdown from URL</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Load any raw Markdown (<code className="text-blue-500 font-mono">.md</code>) or interactive Presentation slide deck (<code className="text-indigo-500 font-mono">.mdp</code>, <code className="text-indigo-500 font-mono">.deck</code>) directly into memory from a public URL.
          </p>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="url-input" className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Document URL
            </label>
            <div className="relative flex items-center">
              <input
                id="url-input"
                type="text"
                autoFocus
                placeholder="https://raw.githubusercontent.com/.../README.md or /sample-deck.mdp"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isLoading}
                className="w-full text-xs px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 focus:outline-hidden focus:border-blue-500 dark:focus:border-blue-500 text-gray-900 dark:text-gray-100"
              />
            </div>
            {error && (
              <span className="text-[11px] text-rose-500 mt-1">{error}</span>
            )}
          </div>

          {/* Quick presets */}
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Quick Samples
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleQuickLoad('/presentation.mdp')}
                disabled={isLoading}
                className="px-2.5 py-1 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-md border border-indigo-200/60 dark:border-indigo-800/60 transition-colors cursor-pointer"
              >
                Showcase Deck (.mdp)
              </button>
              <button
                type="button"
                onClick={() => handleQuickLoad('/sample-deck.mdp')}
                disabled={isLoading}
                className="px-2.5 py-1 text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-md border border-blue-200/60 dark:border-blue-800/60 transition-colors cursor-pointer"
              >
                Sample Presentation
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-gray-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-3.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <span>Open Document</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
