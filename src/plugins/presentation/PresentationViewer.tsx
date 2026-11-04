import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { Group, Panel, Separator } from 'react-resizable-panels';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  LayoutGrid,
  FileDown,
  Palette,
  Crosshair,
  PenTool,
  Edit2,
  BookOpen,
} from 'lucide-react';
import type { ViewerProps } from '../../types/plugin';
import { useTheme } from '../../context/ThemeContext';
import { useEditorSettings } from '../../context/EditorSettingsContext';
import { parsePresentation } from './parser';
import { getTheme, PRESENTATION_THEMES } from './themes';
import { Slide } from './Slide';
import { SlideOverviewModal } from './SlideOverviewModal';
import { PrintSlides, exportPresentationToPdf } from './PrintSlides';
import { LaserPointer } from './LaserPointer';
import { SlideWhiteboard } from './SlideWhiteboard';
import { SlidePenToolbar } from './SlidePenToolbar';
import { MdpDocsModal } from './MdpDocsModal';
import type { PenStroke } from './SlidePenCanvas';
import type { AspectRatio, PresentationThemeId, SlideFontScale } from './types';
import type { PresentationViewMode } from './PresentationToolbar';

export interface SlidePenHistory {
  snapshots: PenStroke[][];
  index: number;
}

export const PresentationViewer: React.FC<ViewerProps> = ({ tab, onContentChange, onSave }) => {
  const { resolvedTheme } = useTheme();
  const { isWrapText } = useEditorSettings();

  const presentationContainerRef = useRef<HTMLDivElement>(null);
  const deckViewportRef = useRef<HTMLDivElement>(null);
  const preFullscreenViewModeRef = useRef<PresentationViewMode | null>(null);

  // Persistent in-memory drawings caches per slide ID across the deck session
  const drawingsCacheRef = useRef<Map<string, unknown>>(new Map());
  const penDrawingsCacheRef = useRef<Map<string, PenStroke[]>>(new Map());
  const penHistoryCacheRef = useRef<Map<string, SlidePenHistory>>(new Map());

  const rawText = typeof tab.content === 'string' ? tab.content : '';

  // Parse presentation content
  const parsed = useMemo(() => parsePresentation(rawText), [rawText]);
  const { frontmatter, slides, totalSlides } = parsed;

  // View state
  const [viewMode, setViewMode] = useState<PresentationViewMode>('split');
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [isOverviewOpen, setIsOverviewOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLaserActive, setIsLaserActive] = useState<boolean>(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState<boolean>(false);
  const [isPenActive, setIsPenActive] = useState<boolean>(false);
  const [isDocsOpen, setIsDocsOpen] = useState<boolean>(false);

  // Pen tool settings
  const [penColor, setPenColor] = useState<string>('#facc15');
  const [penWidth, setPenWidth] = useState<number>(6);
  const [penRevision, setPenRevision] = useState<number>(0);

  // Theme, Aspect Ratio & Font Scaling
  const [userThemeId, setUserThemeId] = useState<PresentationThemeId | null>(null);
  const [userAspectRatio, setUserAspectRatio] = useState<AspectRatio | null>(null);
  const [userFontScale, setUserFontScale] = useState<SlideFontScale | null>(null);

  const activeThemeId: PresentationThemeId =
    userThemeId ?? (frontmatter.theme && frontmatter.theme in PRESENTATION_THEMES ? frontmatter.theme : 'midnight');

  const activeAspectRatio: AspectRatio =
    userAspectRatio ?? frontmatter.aspectRatio ?? '16:9';

  const activeFontScale: SlideFontScale =
    userFontScale ?? frontmatter.fontScale ?? 'normal';

  const activeTheme = useMemo(() => getTheme(activeThemeId), [activeThemeId]);

  // Clamp currentSlideIndex if slides count changes
  useEffect(() => {
    if (currentSlideIndex >= totalSlides) {
      setCurrentSlideIndex(Math.max(0, totalSlides - 1));
    }
  }, [totalSlides, currentSlideIndex]);

  // Synchronize state with top AppHeader PresentationToolbar
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('viewmd:presentation-state-update', {
        detail: {
          viewMode,
          themeId: activeThemeId,
          aspectRatio: activeAspectRatio,
          fontScale: activeFontScale,
          currentSlideIndex,
          totalSlides,
          isFullscreen,
          isLaserActive,
          isWhiteboardOpen,
          isPenActive,
        },
      })
    );
  }, [
    viewMode,
    activeThemeId,
    activeAspectRatio,
    activeFontScale,
    currentSlideIndex,
    totalSlides,
    isFullscreen,
    isLaserActive,
    isWhiteboardOpen,
    isPenActive,
  ]);

  // Slide navigation
  const nextSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      if (index >= 0 && index < totalSlides) {
        setCurrentSlideIndex(index);
      }
    },
    [totalSlides]
  );

  // Fullscreen toggle handler
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        // If in edit mode, switch to deck mode so the presentation slides are displayed
        if (viewMode === 'edit') {
          preFullscreenViewModeRef.current = 'edit';
          flushSync(() => {
            setViewMode('deck');
          });
        }
        if (deckViewportRef.current) {
          await deckViewportRef.current.requestFullscreen();
        } else if (presentationContainerRef.current) {
          await presentationContainerRef.current.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('ViewMD: Fullscreen request failed:', err);
    }
  }, [viewMode]);

  // Listen to Fullscreen API change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);

      // If we switched to deck mode solely for fullscreen, revert to previous mode on exit
      if (!isNowFullscreen && preFullscreenViewModeRef.current) {
        setViewMode(preFullscreenViewModeRef.current);
        preFullscreenViewModeRef.current = null;
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Current slide & persistent slide pen undo/redo history
  const currentSlide = slides[currentSlideIndex] || slides[0];
  const currentSlideId = currentSlide ? currentSlide.id : '';

  // Get or initialize pen history for a slide
  const getSlidePenHistory = useCallback((slideId: string): SlidePenHistory => {
    let hist = penHistoryCacheRef.current.get(slideId);
    if (!hist) {
      hist = { snapshots: [[]], index: 0 };
      penHistoryCacheRef.current.set(slideId, hist);
    }
    return hist;
  }, []);

  // Compute current slide's strokes and undo/redo capabilities
  const currentSlideHist = getSlidePenHistory(currentSlideId);
  const currentStrokes = currentSlideHist.snapshots[currentSlideHist.index] || [];
  const canUndoPen = currentSlideHist.index > 0;
  const canRedoPen = currentSlideHist.index < currentSlideHist.snapshots.length - 1;
  const canClearPen = currentStrokes.length > 0;

  // Add a new stroke to the slide's history
  const handleAddStroke = useCallback(
    (slideId: string, newStroke: PenStroke) => {
      const hist = getSlidePenHistory(slideId);
      const curr = hist.snapshots[hist.index] || [];
      const nextSnapshots = hist.snapshots.slice(0, hist.index + 1);
      nextSnapshots.push([...curr, newStroke]);
      hist.snapshots = nextSnapshots;
      hist.index = nextSnapshots.length - 1;
      penDrawingsCacheRef.current.set(slideId, hist.snapshots[hist.index]);
      setPenRevision((r) => r + 1);
    },
    [getSlidePenHistory]
  );

  // Undo stroke on current slide
  const handleUndoPen = useCallback(() => {
    if (!currentSlideId) return;
    const hist = getSlidePenHistory(currentSlideId);
    if (hist.index > 0) {
      hist.index--;
      penDrawingsCacheRef.current.set(currentSlideId, hist.snapshots[hist.index]);
      setPenRevision((r) => r + 1);
    }
  }, [currentSlideId, getSlidePenHistory]);

  // Redo stroke on current slide
  const handleRedoPen = useCallback(() => {
    if (!currentSlideId) return;
    const hist = getSlidePenHistory(currentSlideId);
    if (hist.index < hist.snapshots.length - 1) {
      hist.index++;
      penDrawingsCacheRef.current.set(currentSlideId, hist.snapshots[hist.index]);
      setPenRevision((r) => r + 1);
    }
  }, [currentSlideId, getSlidePenHistory]);

  // Clear sketches on current slide (undoable)
  const handleClearPen = useCallback(() => {
    if (!currentSlideId) return;
    const hist = getSlidePenHistory(currentSlideId);
    const curr = hist.snapshots[hist.index] || [];
    if (curr.length === 0) return;
    const nextSnapshots = hist.snapshots.slice(0, hist.index + 1);
    nextSnapshots.push([]);
    hist.snapshots = nextSnapshots;
    hist.index = nextSnapshots.length - 1;
    penDrawingsCacheRef.current.set(currentSlideId, []);
    setPenRevision((r) => r + 1);
  }, [currentSlideId, getSlidePenHistory]);

  // Listen for actions from PresentationToolbar
  useEffect(() => {
    const handleAction = (e: Event) => {
      const customEvent = e as CustomEvent<{
        type: string;
        mode?: PresentationViewMode;
        theme?: PresentationThemeId;
        aspectRatio?: AspectRatio;
        fontScale?: SlideFontScale;
      }>;
      const { type, mode, theme, aspectRatio, fontScale } = customEvent.detail || {};

      switch (type) {
        case 'set-mode':
          if (mode) setViewMode(mode);
          break;
        case 'set-theme':
          if (theme) setUserThemeId(theme);
          break;
        case 'set-aspect-ratio':
          if (aspectRatio) setUserAspectRatio(aspectRatio);
          break;
        case 'set-font-scale':
          if (fontScale) setUserFontScale(fontScale);
          break;
        case 'next-slide':
          nextSlide();
          break;
        case 'prev-slide':
          prevSlide();
          break;
        case 'open-overview':
          setIsOverviewOpen(true);
          break;
        case 'toggle-fullscreen':
          toggleFullscreen();
          break;
        case 'export-pdf':
          exportPresentationToPdf();
          break;
        case 'toggle-laser':
          if (viewMode === 'edit') setViewMode('split');
          setIsLaserActive((prev) => !prev);
          break;
        case 'toggle-whiteboard':
          if (viewMode === 'edit') setViewMode('split');
          setIsWhiteboardOpen((prev) => !prev);
          break;
        case 'toggle-pen':
          if (viewMode === 'edit') setViewMode('split');
          setIsPenActive((prev) => !prev);
          break;
        case 'open-docs':
          setIsDocsOpen(true);
          break;
      }
    };

    window.addEventListener('viewmd:presentation-action', handleAction);
    return () => window.removeEventListener('viewmd:presentation-action', handleAction);
  }, [nextSlide, prevSlide, toggleFullscreen, viewMode]);

  // Global Keyboard shortcuts for Presentation navigation & tools
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow saving with Ctrl+S / Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave();
        return;
      }

      // If user is actively typing in an input, textarea, or CodeMirror editor, don't hijack slide keys
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.classList.contains('cm-content') ||
          activeEl.closest('.cm-editor'));

      if (isInputFocused && !isFullscreen) {
        return;
      }

      // Escape key handles modals/overlays in priority order
      if (e.key === 'Escape') {
        if (isWhiteboardOpen) {
          e.preventDefault();
          setIsWhiteboardOpen(false);
          return;
        }
        if (isDocsOpen) {
          e.preventDefault();
          setIsDocsOpen(false);
          return;
        }
        if (isOverviewOpen) {
          e.preventDefault();
          setIsOverviewOpen(false);
          return;
        }
        if (isPenActive) {
          e.preventDefault();
          setIsPenActive(false);
          return;
        }
      }

      // Help/Docs modal shortcut: '?'
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsDocsOpen((prev) => !prev);
        return;
      }

      // Undo / Redo for Slide Pen when Pen tool is active
      if (isPenActive) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
          e.preventDefault();
          handleUndoPen();
          return;
        }
        if (
          ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
        ) {
          e.preventDefault();
          handleRedoPen();
          return;
        }
      }

      // Slide Navigation
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'PageUp') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToSlide(totalSlides - 1);
      } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key.toLowerCase() === 'o' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsOverviewOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'l' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsLaserActive((prev) => !prev);
      } else if (e.key.toLowerCase() === 'w' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsWhiteboardOpen((prev) => !prev);
      } else if (e.key.toLowerCase() === 'p' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsPenActive((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    nextSlide,
    prevSlide,
    goToSlide,
    toggleFullscreen,
    onSave,
    totalSlides,
    isFullscreen,
    isWhiteboardOpen,
    isOverviewOpen,
    isDocsOpen,
    isPenActive,
    handleUndoPen,
    handleRedoPen,
  ]);

  // Auto-hiding HUD controls on mouse move (in deck mode or fullscreen)
  const [isHudVisible, setIsHudVisible] = useState(true);
  const hudTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseMove = useCallback(() => {
    setIsHudVisible(true);
    if (hudTimeoutRef.current) {
      clearTimeout(hudTimeoutRef.current);
    }
    hudTimeoutRef.current = setTimeout(() => {
      setIsHudVisible(false);
    }, 2800);
  }, []);

  // Render CodeMirror Editor
  const renderEditor = () => (
    <div className="h-full w-full overflow-hidden bg-white dark:bg-[#1e1e1e] flex flex-col">
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={rawText}
          height="100%"
          className="h-full text-sm font-mono"
          theme={resolvedTheme === 'dark' ? oneDark : 'light'}
          extensions={isWrapText ? [markdown(), EditorView.lineWrapping] : [markdown()]}
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

  // Render Slide Deck Viewport
  const renderDeckViewport = () => (
    <div
      ref={deckViewportRef}
      onMouseMove={handleMouseMove}
      className={`h-full w-full relative flex flex-col items-center justify-center overflow-hidden transition-colors select-none ${activeTheme.bgClass}`}
      style={activeTheme.containerStyle}
    >
      {/* Active Slide Canvas */}
      <div className="flex-1 w-full h-full flex items-center justify-center relative p-4 sm:p-8">
        {currentSlide && (
          <Slide
            key={currentSlide.id}
            slide={currentSlide}
            theme={activeTheme}
            aspectRatio={activeAspectRatio}
            fontScale={activeFontScale}
            isPenActive={isPenActive}
            penColor={penColor}
            penWidth={penWidth}
            strokes={currentStrokes}
            onAddStroke={(stroke) => handleAddStroke(currentSlide.id, stroke)}
            penDrawingsCache={penDrawingsCacheRef}
            penRevision={penRevision}
            isActive={true}
          />
        )}
      </div>

      {/* Laser Pointer Overlay */}
      <LaserPointer isActive={isLaserActive} containerRef={deckViewportRef} />

      {/* Floating Persistent Pen Toolbar (when Pen is Active) */}
      <SlidePenToolbar
        isActive={isPenActive}
        currentColor={penColor}
        onColorChange={setPenColor}
        currentWidth={penWidth}
        onWidthChange={setPenWidth}
        canUndo={canUndoPen}
        onUndo={handleUndoPen}
        canRedo={canRedoPen}
        onRedo={handleRedoPen}
        canClear={canClearPen}
        onClear={handleClearPen}
        onClose={() => setIsPenActive(false)}
      />

      {/* In-memory Whiteboard Annotation Canvas */}
      {currentSlide && (
        <SlideWhiteboard
          slideId={currentSlide.id}
          isOpen={isWhiteboardOpen}
          onClose={() => setIsWhiteboardOpen(false)}
          drawingsCache={drawingsCacheRef}
          isDark={activeTheme.isDark}
          onPrevSlide={prevSlide}
          onNextSlide={nextSlide}
          currentIndex={currentSlideIndex}
          totalSlides={totalSlides}
        />
      )}

      {/* Slide Progress Bar (Bottom) */}
      <div className="w-full h-1 bg-black/10 dark:bg-white/10 shrink-0 relative overflow-hidden">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${((currentSlideIndex + 1) / totalSlides) * 100}%`,
            backgroundColor: activeTheme.accentColor,
          }}
        />
      </div>

      {/* Floating Presenter HUD (Auto-hiding overlay) - Hidden during Whiteboard mode to eliminate toolbar overlap */}
      {!isWhiteboardOpen && (
        <div
          className={`absolute bottom-5 inset-x-0 mx-auto w-fit flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-white shadow-2xl transition-all duration-300 z-40 ${
            isHudVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={prevSlide}
            disabled={currentSlideIndex <= 0}
            title="Previous (← / Space)"
            className="p-1 rounded-full hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-2 text-xs font-mono font-semibold text-gray-200">
            {String(currentSlideIndex + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
          </span>

          <button
            type="button"
            onClick={nextSlide}
            disabled={currentSlideIndex >= totalSlides - 1}
            title="Next (→)"
            className="p-1 rounded-full hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          {/* Laser Pointer HUD Toggle Button */}
          <button
            type="button"
            onClick={() => setIsLaserActive((prev) => !prev)}
            title={isLaserActive ? 'Turn Off Laser Pointer (L)' : 'Laser Pointer (L)'}
            className={`p-1.5 rounded-full transition-all cursor-pointer ${
              isLaserActive
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/50 ring-2 ring-rose-400'
                : 'hover:bg-white/20 text-gray-300 hover:text-white'
            }`}
          >
            <Crosshair className="w-4 h-4" />
          </button>

          {/* Persistent Slide Pen Tool Button */}
          <button
            type="button"
            onClick={() => setIsPenActive((prev) => !prev)}
            title={isPenActive ? 'Turn Off Slide Pen (P)' : 'Slide Pen Annotation (P)'}
            className={`p-1.5 rounded-full transition-all cursor-pointer ${
              isPenActive
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/50 ring-2 ring-amber-300'
                : 'hover:bg-white/20 text-gray-300 hover:text-white'
            }`}
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Whiteboard HUD Toggle Button */}
          <button
            type="button"
            onClick={() => setIsWhiteboardOpen((prev) => !prev)}
            title={isWhiteboardOpen ? 'Close Whiteboard (W / Esc)' : 'Slide Whiteboard (W)'}
            className={`p-1.5 rounded-full transition-all cursor-pointer ${
              isWhiteboardOpen
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/50 ring-2 ring-emerald-400'
                : 'hover:bg-white/20 text-gray-300 hover:text-white'
            }`}
          >
            <PenTool className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-white/20 mx-1" />

          {/* Overview button */}
          <button
            type="button"
            onClick={() => setIsOverviewOpen(true)}
            title="Slide Overview (O / Esc)"
            className="p-1.5 rounded-full hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>

          {/* Theme quick cycle button */}
          <button
            type="button"
            onClick={() => {
              const themeKeys = Object.keys(PRESENTATION_THEMES) as PresentationThemeId[];
              const nextIdx = (themeKeys.indexOf(activeThemeId) + 1) % themeKeys.length;
              setUserThemeId(themeKeys[nextIdx]);
            }}
            title={`Cycle Theme (Current: ${activeTheme.name})`}
            className="p-1.5 rounded-full hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <Palette className="w-4 h-4" />
          </button>

          {/* Export PDF button */}
          <button
            type="button"
            onClick={exportPresentationToPdf}
            title="Export to PDF (Print)"
            className="p-1.5 rounded-full hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-rose-400" />
          </button>

          {/* MDP Syntax & Hotkeys Docs Modal */}
          <button
            type="button"
            onClick={() => setIsDocsOpen(true)}
            title="MDP Syntax & Hotkeys Guide (?)"
            className="p-1.5 rounded-full hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-blue-400" />
          </button>

          {/* Fullscreen toggle button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (Esc / F)' : 'Fullscreen (F)'}
            className="p-1.5 rounded-full hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div ref={presentationContainerRef} className="h-full w-full relative overflow-hidden">
      {/* Edit Mode Only */}
      {viewMode === 'edit' && <div className="h-full w-full">{renderEditor()}</div>}

      {/* Deck Mode Only */}
      {viewMode === 'deck' && <div className="h-full w-full">{renderDeckViewport()}</div>}

      {/* Split Mode (Default) */}
      {viewMode === 'split' && (
        <div className="h-full w-full">
          <Group orientation="horizontal" className="h-full w-full">
            <Panel defaultSize="45%" minSize="20%" className="h-full">
              {renderEditor()}
            </Panel>
            <Separator className="relative w-1 bg-gray-200 dark:bg-gray-800 hover:bg-blue-500 active:bg-blue-600 transition-colors cursor-col-resize z-20 after:absolute after:inset-y-0 after:-left-2 after:-right-2 after:content-['']" />
            <Panel defaultSize="55%" minSize="25%" className="h-full">
              {renderDeckViewport()}
            </Panel>
          </Group>
        </div>
      )}

      {/* Slide Overview Thumbnail Grid Modal */}
      <SlideOverviewModal
        slides={slides}
        currentIndex={currentSlideIndex}
        theme={activeTheme}
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        onSelectSlide={goToSlide}
      />

      {/* MDP Documentation & Hotkeys Modal */}
      <MdpDocsModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
        theme={activeTheme}
      />

      {/* Dedicated Hidden Print Slides for PDF Export */}
      <PrintSlides slides={slides} theme={activeTheme} />
    </div>
  );
};
