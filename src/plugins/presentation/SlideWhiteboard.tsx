import React, { useRef } from 'react';
import { Tldraw, getSnapshot, loadSnapshot, type Editor } from 'tldraw';
import 'tldraw/tldraw.css';
import { X, Trash2, PenTool, ChevronLeft, ChevronRight } from 'lucide-react';

export interface SlideWhiteboardProps {
  slideId: string;
  isOpen: boolean;
  onClose: () => void;
  drawingsCache: React.MutableRefObject<Map<string, unknown>>;
  isDark?: boolean;
  onPrevSlide?: () => void;
  onNextSlide?: () => void;
  currentIndex?: number;
  totalSlides?: number;
}

export const SlideWhiteboard: React.FC<SlideWhiteboardProps> = ({
  slideId,
  isOpen,
  onClose,
  drawingsCache,
  isDark = true,
  onPrevSlide,
  onNextSlide,
  currentIndex,
  totalSlides,
}) => {
  const editorRef = useRef<Editor | null>(null);

  if (!isOpen) return null;

  const handleMount = (editor: Editor) => {
    editorRef.current = editor;

    // Restore cached drawings for this slide if available
    const cached = drawingsCache.current.get(slideId);
    if (cached) {
      try {
        loadSnapshot(editor.store, cached as Parameters<typeof loadSnapshot>[1]);
      } catch (err) {
        console.warn('ViewMD: Failed to restore slide drawing snapshot:', err);
      }
    }

    // Auto-save changes to the in-memory cache
    const unsubscribe = editor.store.listen(() => {
      try {
        const snapshot = getSnapshot(editor.store);
        drawingsCache.current.set(slideId, snapshot);
      } catch (err) {
        console.warn('ViewMD: Failed to capture drawing snapshot:', err);
      }
    });

    return () => {
      unsubscribe();
      editorRef.current = null;
    };
  };

  const handleClear = () => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      const allShapeIds = Array.from(editor.getCurrentPageShapeIds());
      if (allShapeIds.length > 0) {
        editor.deleteShapes(allShapeIds);
        drawingsCache.current.set(slideId, getSnapshot(editor.store));
      }
    } catch (err) {
      console.warn('ViewMD: Failed to clear whiteboard canvas:', err);
    }
  };

  return (
    <div className="absolute inset-0 z-40 w-full h-full flex flex-col bg-slate-900/40 backdrop-blur-xs select-none">
      {/* Top Floating Whiteboard Header Controls */}
      <div className="absolute top-4 inset-x-0 mx-auto w-fit z-50 flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-md border border-white/20 text-white shadow-2xl pointer-events-auto">
        <div className="flex items-center gap-2 pr-2.5 border-r border-white/15">
          <PenTool className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold tracking-wide text-gray-200">
            Slide Whiteboard
          </span>
        </div>

        {/* Slide navigation in Whiteboard mode */}
        {onPrevSlide && onNextSlide && currentIndex !== undefined && totalSlides !== undefined && (
          <div className="flex items-center gap-1 pr-2.5 border-r border-white/15">
            <button
              type="button"
              onClick={onPrevSlide}
              disabled={currentIndex <= 0}
              title="Previous Slide"
              className="p-1 rounded-md hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1">
              {currentIndex + 1} / {totalSlides}
            </span>
            <button
              type="button"
              onClick={onNextSlide}
              disabled={currentIndex >= totalSlides - 1}
              title="Next Slide"
              className="p-1 rounded-md hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleClear}
          title="Clear all drawings on this slide"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-rose-300 hover:text-white hover:bg-rose-500/20 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          title="Close Whiteboard (Esc / W)"
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          <span>Close (W)</span>
        </button>
      </div>

      {/* Scoped CSS to remove watermark and bottom-left navigation UI */}
      <style>{`
        .tl-watermark_SEE-LICENSE,
        [data-testid*="tl-watermark"],
        .tlui-help-menu,
        .tlui-navigation-panel,
        .tlui-debug-panel {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
      `}</style>

      {/* Embedded Tldraw Canvas */}
      <div className="flex-1 w-full h-full relative">
        <Tldraw
          key={slideId}
          onMount={handleMount}
          colorScheme={isDark ? 'dark' : 'light'}
          autoFocus={true}
          components={{
            NavigationPanel: null,
            HelpMenu: null,
            MainMenu: null,
            PageMenu: null,
          }}
        />
      </div>
    </div>
  );
};
