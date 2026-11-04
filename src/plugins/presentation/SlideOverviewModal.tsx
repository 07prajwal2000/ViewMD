import React, { useState, useMemo, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import type { ParsedSlide, PresentationTheme } from './types';

interface SlideOverviewModalProps {
  slides: ParsedSlide[];
  currentIndex: number;
  theme: PresentationTheme;
  isOpen: boolean;
  onClose: () => void;
  onSelectSlide: (index: number) => void;
}

export const SlideOverviewModal: React.FC<SlideOverviewModalProps> = ({
  slides,
  currentIndex,
  theme,
  isOpen,
  onClose,
  onSelectSlide,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredSlides = useMemo(() => {
    if (!filterQuery.trim()) return slides;
    const q = filterQuery.toLowerCase();
    return slides.filter(
      (s) =>
        s.rawMarkdown.toLowerCase().includes(q) ||
        (s.notes && s.notes.toLowerCase().includes(q))
    );
  }, [slides, filterQuery]);

  if (!isOpen) return null;

  // Extract a clean title or preview text from slide markdown
  const getSlideTitle = (slide: ParsedSlide): string => {
    const lines = slide.cleanedMarkdown.split('\n');
    for (const line of lines) {
      const match = line.match(/^#{1,4}\s+(.+)$/);
      if (match) return match[1].replace(/[*_`]/g, '');
    }
    const firstNonEmpty = lines.find((l) => l.trim().length > 0 && !l.trim().startsWith('<'));
    return firstNonEmpty ? firstNonEmpty.slice(0, 40) : `Slide ${slide.index + 1}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-md transition-opacity p-6 sm:p-10 select-none animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="flex flex-col w-full max-w-6xl mx-auto h-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white tracking-tight">Slide Overview</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 text-gray-300 font-medium">
              {slides.length} {slides.length === 1 ? 'slide' : 'slides'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Filter slides..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                autoFocus
                className="w-full bg-white/10 text-white placeholder-gray-400 text-sm pl-9 pr-3 py-1.5 rounded-lg border border-white/10 focus:outline-hidden focus:border-blue-400"
              />
            </div>

            <button
              onClick={onClose}
              title="Close (Esc)"
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Grid Container */}
        <div className="flex-1 overflow-y-auto py-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 auto-rows-max content-start pr-2">
          {filteredSlides.map((slide) => {
            const isSelected = slide.index === currentIndex;
            const title = getSlideTitle(slide);

            return (
              <button
                key={slide.id}
                onClick={() => {
                  onSelectSlide(slide.index);
                  onClose();
                }}
                className={`flex flex-col text-left group rounded-xl p-3 border transition-all cursor-pointer relative overflow-hidden h-fit self-start ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/50'
                    : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                }`}
              >
                {/* 16:9 Thumbnail Box */}
                <div
                  className="w-full aspect-video rounded-lg p-3 text-xs overflow-hidden flex flex-col justify-between transition-colors shadow-inner relative"
                  style={{
                    backgroundColor: theme.isDark ? '#0f172a' : '#f8fafc',
                    color: theme.isDark ? '#cbd5e1' : '#334155',
                  }}
                >
                  <div className="line-clamp-3 font-semibold text-xs leading-snug">
                    {title}
                  </div>

                  <div className="flex items-center justify-between text-[10px] opacity-60 pt-2 border-t border-black/10 dark:border-white/10">
                    <span>{slide.directives.layout ?? 'default'}</span>
                    <span>#{slide.index + 1}</span>
                  </div>
                </div>

                {/* Footer details */}
                <div className="flex items-center justify-between mt-2.5 px-0.5">
                  <span className="text-xs font-semibold text-gray-200 group-hover:text-white truncate max-w-[80%]">
                    {title}
                  </span>
                  <span className="text-[11px] font-mono text-gray-400">
                    {String(slide.index + 1).padStart(2, '0')}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
