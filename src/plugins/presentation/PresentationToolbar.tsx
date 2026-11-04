import React, { useState, useEffect, useRef } from 'react';
import {
  Edit3,
  Columns,
  Play,
  Save,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  FileDown,
  Palette,
  Tv,
  FileText,
  Crosshair,
  PenTool,
  Edit2,
  BookOpen,
  Sliders,
  X,
} from 'lucide-react';
import type { ViewerHeaderActionProps } from '../../types/plugin';
import type { AspectRatio, PresentationThemeId, SlideFontScale } from './types';
import { useTabs } from '../../context/TabsContext';

export type PresentationViewMode = 'edit' | 'split' | 'deck';

export interface PresentationToolbarProps extends ViewerHeaderActionProps {
  viewMode?: PresentationViewMode;
  onViewModeChange?: (mode: PresentationViewMode) => void;
  themeId?: PresentationThemeId;
  onThemeChange?: (theme: PresentationThemeId) => void;
  aspectRatio?: AspectRatio;
  onAspectRatioChange?: (ratio: AspectRatio) => void;
  currentSlideIndex?: number;
  totalSlides?: number;
  onPrevSlide?: () => void;
  onNextSlide?: () => void;
  onOpenOverview?: () => void;
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
  onExportPdf?: () => void;
}

const THEME_OPTIONS: { id: PresentationThemeId; name: string; color: string }[] = [
  { id: 'midnight', name: 'Midnight', color: '#38bdf8' },
  { id: 'tokyo-night', name: 'Tokyo Night', color: '#f43f5e' },
  { id: 'mocha', name: 'Mocha', color: '#cba6f7' },
  { id: 'paper', name: 'Paper', color: '#d97706' },
  { id: 'daylight', name: 'Daylight', color: '#2563eb' },
  { id: 'obsidian', name: 'Obsidian', color: '#a3e635' },
];

const FONT_SCALE_OPTIONS: { id: SlideFontScale; label: string }[] = [
  { id: 'normal', label: '100%' },
  { id: 'compact', label: '80% (Compact)' },
  { id: 'mini', label: '65% (Mini)' },
  { id: 'large', label: '120% (Large)' },
];

export const PresentationToolbar: React.FC<PresentationToolbarProps> = ({
  tab,
  onSave,
  viewMode: propViewMode,
  onViewModeChange,
  themeId: propThemeId,
  onThemeChange,
  aspectRatio: propAspectRatio,
  onAspectRatioChange,
  currentSlideIndex: propCurrentSlideIndex,
  totalSlides: propTotalSlides,
  onPrevSlide,
  onNextSlide,
  onOpenOverview,
  onToggleFullscreen,
  isFullscreen: propIsFullscreen,
  onExportPdf,
}) => {
  const isMarkdownSource =
    tab.name.toLowerCase().endsWith('.md') || tab.name.toLowerCase().endsWith('.markdown');
  const { setTabPluginId } = useTabs();

  // State synced with active PresentationViewer via custom events
  const [internalState, setInternalState] = useState<{
    viewMode: PresentationViewMode;
    themeId: PresentationThemeId;
    aspectRatio: AspectRatio;
    fontScale: SlideFontScale;
    currentSlideIndex: number;
    totalSlides: number;
    isFullscreen: boolean;
    isLaserActive: boolean;
    isWhiteboardOpen: boolean;
    isPenActive: boolean;
  }>({
    viewMode: 'split',
    themeId: 'midnight',
    aspectRatio: '16:9',
    fontScale: 'normal',
    currentSlideIndex: 0,
    totalSlides: 1,
    isFullscreen: false,
    isLaserActive: false,
    isWhiteboardOpen: false,
    isPenActive: false,
  });

  // Consolidated Tools dropdown menu state
  const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    if (isToolsOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isToolsOpen]);

  useEffect(() => {
    const handleStateUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<typeof internalState>>;
      if (customEvent.detail) {
        setInternalState((prev) => ({ ...prev, ...customEvent.detail }));
      }
    };

    window.addEventListener('viewmd:presentation-state-update', handleStateUpdate);
    return () => window.removeEventListener('viewmd:presentation-state-update', handleStateUpdate);
  }, []);

  const viewMode = propViewMode ?? internalState.viewMode;
  const themeId = propThemeId ?? internalState.themeId;
  const aspectRatio = propAspectRatio ?? internalState.aspectRatio;
  const fontScale = internalState.fontScale;
  const currentSlideIndex = propCurrentSlideIndex ?? internalState.currentSlideIndex;
  const totalSlides = propTotalSlides ?? internalState.totalSlides;
  const isFullscreen = propIsFullscreen ?? internalState.isFullscreen;

  const handleModeChange = (mode: PresentationViewMode) => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      window.dispatchEvent(new CustomEvent('viewmd:presentation-action', { detail: { type: 'set-mode', mode } }));
    }
  };

  const handleThemeChange = (newTheme: PresentationThemeId) => {
    if (onThemeChange) {
      onThemeChange(newTheme);
    } else {
      window.dispatchEvent(new CustomEvent('viewmd:presentation-action', { detail: { type: 'set-theme', theme: newTheme } }));
    }
  };

  const handleAspectRatioChange = (newRatio: AspectRatio) => {
    if (onAspectRatioChange) {
      onAspectRatioChange(newRatio);
    } else {
      window.dispatchEvent(new CustomEvent('viewmd:presentation-action', { detail: { type: 'set-aspect-ratio', aspectRatio: newRatio } }));
    }
  };

  const handleFontScaleChange = (scale: SlideFontScale) => {
    window.dispatchEvent(new CustomEvent('viewmd:presentation-action', { detail: { type: 'set-font-scale', fontScale: scale } }));
  };

  const handlePrevSlide = () => {
    if (onPrevSlide) {
      onPrevSlide();
    } else {
      window.dispatchEvent(new CustomEvent('viewmd:presentation-action', { detail: { type: 'prev-slide' } }));
    }
  };

  const handleNextSlide = () => {
    if (onNextSlide) {
      onNextSlide();
    } else {
      window.dispatchEvent(new CustomEvent('viewmd:presentation-action', { detail: { type: 'next-slide' } }));
    }
  };

  const handleOpenOverview = () => {
    if (onOpenOverview) {
      onOpenOverview();
    } else {
      window.dispatchEvent(new CustomEvent('viewmd:presentation-action', { detail: { type: 'open-overview' } }));
    }
  };

  const handleToggleFullscreen = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
    } else {
      window.dispatchEvent(new CustomEvent('viewmd:presentation-action', { detail: { type: 'toggle-fullscreen' } }));
    }
  };

  const handleExportPdf = () => {
    if (onExportPdf) {
      onExportPdf();
    } else {
      window.dispatchEvent(new CustomEvent('viewmd:presentation-action', { detail: { type: 'export-pdf' } }));
    }
  };

  const handleToggleLaser = () => {
    window.dispatchEvent(new CustomEvent('viewmd:presentation-action', { detail: { type: 'toggle-laser' } }));
  };

  const handleTogglePen = () => {
    window.dispatchEvent(new CustomEvent('viewmd:presentation-action', { detail: { type: 'toggle-pen' } }));
  };

  const handleToggleWhiteboard = () => {
    window.dispatchEvent(new CustomEvent('viewmd:presentation-action', { detail: { type: 'toggle-whiteboard' } }));
  };

  const handleOpenDocs = () => {
    window.dispatchEvent(new CustomEvent('viewmd:presentation-action', { detail: { type: 'open-docs' } }));
  };

  const isAnyToolActive =
    internalState.isLaserActive || internalState.isPenActive || internalState.isWhiteboardOpen;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 select-none shrink-0">
      {/* 3-Switch Segment Control */}
      <div className="flex items-center bg-gray-200/70 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs shrink-0">
        <button
          type="button"
          onClick={() => handleModeChange('edit')}
          title="Editor Only"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
            viewMode === 'edit'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Edit</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('split')}
          title="Split View (Editor & Slide Preview)"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
            viewMode === 'split'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Split</span>
        </button>

        <button
          type="button"
          onClick={() => handleModeChange('deck')}
          title="Slide Deck Mode"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
            viewMode === 'deck'
              ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Deck</span>
        </button>
      </div>

      {/* Slide Navigation & Stepper - Strictly single-line (shrink-0 whitespace-nowrap) */}
      <div className="flex items-center gap-1 bg-gray-200/50 dark:bg-gray-800/80 px-2 py-0.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs shrink-0 whitespace-nowrap">
        <button
          type="button"
          onClick={handlePrevSlide}
          disabled={currentSlideIndex <= 0}
          title="Previous Slide (← / Space)"
          className="p-1 rounded-md hover:bg-gray-300/60 dark:hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
        </button>

        <span className="px-1.5 font-mono font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap shrink-0">
          {currentSlideIndex + 1} / {totalSlides}
        </span>

        <button
          type="button"
          onClick={handleNextSlide}
          disabled={currentSlideIndex >= totalSlides - 1}
          title="Next Slide (→)"
          className="p-1 rounded-md hover:bg-gray-300/60 dark:hover:bg-gray-700 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer shrink-0"
        >
          <ChevronRight className="w-3.5 h-3.5 text-gray-700 dark:text-gray-300" />
        </button>

        <div className="w-px h-3.5 bg-gray-300 dark:bg-gray-700 mx-1 shrink-0" />

        {/* Overview button */}
        <button
          type="button"
          onClick={handleOpenOverview}
          title="All Slides Grid Overview (O / Esc)"
          className="p-1 rounded-md hover:bg-gray-300/60 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer shrink-0"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Theme Selector */}
      <div className="relative flex items-center shrink-0">
        <label htmlFor="mdp-theme-select" className="sr-only">Presentation Theme</label>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-200/50 dark:bg-gray-800/80 text-xs text-gray-700 dark:text-gray-300">
          <Palette className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <select
            id="mdp-theme-select"
            value={themeId}
            onChange={(e) => handleThemeChange(e.target.value as PresentationThemeId)}
            className="bg-transparent text-xs font-medium cursor-pointer focus:outline-hidden"
          >
            {THEME_OPTIONS.map((t) => (
              <option key={t.id} value={t.id} className="dark:bg-gray-800">
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Consolidated Tools Menu (Laser, Pen, Whiteboard, Text Density, Aspect Ratio, Docs) */}
      <div className="relative shrink-0" ref={toolsMenuRef}>
        <button
          type="button"
          onClick={() => setIsToolsOpen((prev) => !prev)}
          title="Presentation Tools & Display Settings"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium transition-colors cursor-pointer shrink-0 ${
            isToolsOpen || isAnyToolActive
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 shadow-2xs'
              : 'border-gray-300 dark:border-gray-700 bg-gray-200/50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-blue-500" />
          <span>Tools</span>
          {isAnyToolActive && (
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          )}
          <ChevronDown className="w-3 h-3 text-gray-400" />
        </button>

        {isToolsOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-64 rounded-xl bg-white dark:bg-[#161b22] border border-gray-200 dark:border-gray-700 shadow-xl py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
            {/* Annotation Tools Section */}
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Interactive Annotations
            </div>

            <button
              type="button"
              onClick={() => {
                handleToggleLaser();
                setIsToolsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-700 dark:text-gray-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-rose-500" />
                <span>Laser Pointer</span>
              </div>
              <div className="flex items-center gap-1.5">
                {internalState.isLaserActive && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/10 text-rose-500 font-semibold">Active</span>
                )}
                <kbd className="px-1 py-0.5 font-mono text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-400 rounded border border-gray-200 dark:border-gray-700">L</kbd>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                handleTogglePen();
                setIsToolsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-700 dark:text-gray-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Slide Pen</span>
              </div>
              <div className="flex items-center gap-1.5">
                {internalState.isPenActive && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-500 font-semibold">Active</span>
                )}
                <kbd className="px-1 py-0.5 font-mono text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-400 rounded border border-gray-200 dark:border-gray-700">P</kbd>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                handleToggleWhiteboard();
                setIsToolsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-700 dark:text-gray-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <PenTool className="w-3.5 h-3.5 text-emerald-500" />
                <span>Slide Whiteboard</span>
              </div>
              <div className="flex items-center gap-1.5">
                {internalState.isWhiteboardOpen && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-500 font-semibold">Open</span>
                )}
                <kbd className="px-1 py-0.5 font-mono text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-400 rounded border border-gray-200 dark:border-gray-700">W</kbd>
              </div>
            </button>

            <div className="my-1.5 border-t border-gray-200 dark:border-gray-800" />

            {/* Display & Layout Settings */}
            <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Display & Layout
            </div>

            <div className="px-3 py-1.5 flex items-center justify-between text-gray-700 dark:text-gray-200">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-gray-400" />
                <span>Text Density</span>
              </div>
              <select
                value={fontScale}
                onChange={(e) => handleFontScaleChange(e.target.value as SlideFontScale)}
                className="bg-gray-100 dark:bg-gray-800 text-[11px] font-medium rounded px-1.5 py-0.5 border border-gray-300 dark:border-gray-700 focus:outline-hidden"
              >
                {FONT_SCALE_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="px-3 py-1.5 flex items-center justify-between text-gray-700 dark:text-gray-200">
              <div className="flex items-center gap-2">
                <Tv className="w-3.5 h-3.5 text-gray-400" />
                <span>Aspect Ratio</span>
              </div>
              <select
                value={aspectRatio}
                onChange={(e) => handleAspectRatioChange(e.target.value as AspectRatio)}
                className="bg-gray-100 dark:bg-gray-800 text-[11px] font-medium rounded px-1.5 py-0.5 border border-gray-300 dark:border-gray-700 focus:outline-hidden"
              >
                <option value="16:9">16:9</option>
                <option value="4:3">4:3</option>
                <option value="16:10">16:10</option>
              </select>
            </div>

            <div className="my-1.5 border-t border-gray-200 dark:border-gray-800" />

            {/* Documentation & Help */}
            <button
              type="button"
              onClick={() => {
                handleOpenDocs();
                setIsToolsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-gray-700 dark:text-gray-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                <span>MDP Guide & Hotkeys</span>
              </div>
              <kbd className="px-1 py-0.5 font-mono text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-400 rounded border border-gray-200 dark:border-gray-700">?</kbd>
            </button>
          </div>
        )}
      </div>

      {/* Active Tool Instant Toggle Badges (visible right on toolbar for one-click dismiss) */}
      {internalState.isPenActive && (
        <button
          type="button"
          onClick={handleTogglePen}
          title="Turn off Slide Pen (P)"
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 text-black text-xs font-semibold shadow-xs cursor-pointer shrink-0 animate-in fade-in"
        >
          <Edit2 className="w-3 h-3" />
          <span>Pen</span>
          <X className="w-3 h-3 ml-0.5 opacity-70" />
        </button>
      )}

      {internalState.isLaserActive && (
        <button
          type="button"
          onClick={handleToggleLaser}
          title="Turn off Laser Pointer (L)"
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500 text-white text-xs font-semibold shadow-xs cursor-pointer shrink-0 animate-in fade-in"
        >
          <Crosshair className="w-3 h-3" />
          <span>Laser</span>
          <X className="w-3 h-3 ml-0.5 opacity-70" />
        </button>
      )}

      {internalState.isWhiteboardOpen && (
        <button
          type="button"
          onClick={handleToggleWhiteboard}
          title="Close Whiteboard (W)"
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold shadow-xs cursor-pointer shrink-0 animate-in fade-in"
        >
          <PenTool className="w-3 h-3" />
          <span>Board</span>
          <X className="w-3 h-3 ml-0.5 opacity-70" />
        </button>
      )}

      {/* PDF Export Button */}
      <button
        type="button"
        onClick={handleExportPdf}
        title="Export Slide Deck to PDF (Print)"
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-200/50 dark:bg-gray-800/80 text-xs text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 cursor-pointer shrink-0"
      >
        <FileDown className="w-3.5 h-3.5 text-red-500" />
        <span className="hidden sm:inline">PDF</span>
      </button>

      {/* Present / Fullscreen Button */}
      <button
        type="button"
        onClick={handleToggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen (Esc / F)' : 'Present Fullscreen (F)'}
        className="flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer shrink-0"
      >
        {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        <span>{isFullscreen ? 'Exit' : 'Present'}</span>
      </button>

      {/* Switch back to regular Markdown Document if source is .md */}
      {isMarkdownSource && (
        <button
          type="button"
          onClick={() => setTabPluginId(tab.id, 'markdown')}
          title="Switch back to Markdown document view"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-200/50 dark:bg-gray-800/80 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors shrink-0"
        >
          <FileText className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden xl:inline">Doc View</span>
        </button>
      )}

      {/* Save Button */}
      <button
        type="button"
        onClick={onSave}
        disabled={!tab.isDirty}
        title={tab.isDirty ? 'Save to disk (Ctrl+S)' : 'All changes saved to disk'}
        className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg font-medium transition-all shrink-0 ${
          tab.isDirty
            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer'
            : 'bg-transparent text-gray-400 dark:text-gray-500 cursor-default opacity-60'
        }`}
      >
        <Save className="w-3.5 h-3.5" />
        <span>{tab.isDirty ? 'Save' : 'Saved'}</span>
      </button>
    </div>
  );
};
