import React, { useState, useEffect, useRef } from 'react';
import type { AspectRatio, ParsedSlide, PresentationTheme, SlideFontScale } from './types';
import { SlideContent } from './SlideContent';
import { InteractiveRunner } from './InteractiveRunner';
import { SlidePenCanvas, type PenStroke } from './SlidePenCanvas';

export const ASPECT_RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number }> = {
  '16:9': { width: 1920, height: 1080 },
  '4:3': { width: 1440, height: 1080 },
  '16:10': { width: 1920, height: 1200 },
};

// Module-level cached scale so consecutive slide renders start at the exact right scale
let cachedGlobalScale = 0;

export interface SlideProps {
  slide: ParsedSlide;
  theme: PresentationTheme;
  aspectRatio?: AspectRatio;
  isActive?: boolean;
  scale?: number;
  fontScale?: SlideFontScale;
  isPenActive?: boolean;
  penColor?: string;
  penWidth?: number;
  penDrawingsCache?: React.MutableRefObject<Map<string, PenStroke[]>>;
  strokes?: PenStroke[];
  onAddStroke?: (stroke: PenStroke) => void;
  penRevision?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Slide: React.FC<SlideProps> = ({
  slide,
  theme,
  aspectRatio = '16:9',
  isActive = true,
  scale,
  fontScale,
  isPenActive = false,
  penColor,
  penWidth,
  penDrawingsCache,
  strokes,
  onAddStroke,
  penRevision = 0,
  className = '',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const virtualCanvasRef = useRef<HTMLDivElement>(null);

  const virtualDims = ASPECT_RATIO_DIMENSIONS[aspectRatio] || ASPECT_RATIO_DIMENSIONS['16:9'];
  const { width: virtualWidth, height: virtualHeight } = virtualDims;

  // Initialize autoScale with cached scale or approximate window scale to prevent unscaled flash
  const [autoScale, setAutoScale] = useState<number>(() => {
    if (scale !== undefined) return scale;
    if (cachedGlobalScale > 0) return cachedGlobalScale;
    if (typeof window !== 'undefined') {
      return Math.min(
        (window.innerWidth * 0.9) / virtualWidth,
        (window.innerHeight * 0.85) / virtualHeight
      );
    }
    return 0.5;
  });

  const [isReady, setIsReady] = useState<boolean>(() => scale !== undefined || cachedGlobalScale > 0);

  // Responsive scaling with ResizeObserver when fixed scale is not provided
  useEffect(() => {
    if (scale !== undefined) {
      setIsReady(true);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      const { clientWidth, clientHeight } = container;
      if (clientWidth > 0 && clientHeight > 0) {
        const computedScale = Math.min(
          clientWidth / virtualWidth,
          clientHeight / virtualHeight
        );
        cachedGlobalScale = computedScale;
        setAutoScale(computedScale);
        setIsReady(true);
      }
    };

    updateScale();

    const observer = new ResizeObserver(() => {
      updateScale();
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [scale, virtualWidth, virtualHeight]);

  const effectiveScale = scale !== undefined ? scale : autoScale;
  const effectiveFontScale = fontScale ?? slide.directives.fontScale;

  // Background media resolution (from parsed backgroundMedia or directives)
  const bgMedia =
    slide.backgroundMedia ||
    (slide.directives?.bgImage
      ? {
          src: slide.directives.bgImage,
          alt: 'Slide background',
          opacity: slide.directives.bgOpacity ?? 0.3,
        }
      : undefined);

  // Layout resolution
  const layout = slide.directives?.layout ?? 'default';
  const splitMedia = slide.splitMedia;

  const renderContent = () => {
    // 1. Split Layout (with splitMedia)
    if (splitMedia) {
      const isRight = splitMedia.position === 'right';

      const contentCol = (
        <div
          key="content-col"
          className="w-[58%] h-full flex flex-col justify-center overflow-y-auto pr-8"
        >
          <SlideContent
            slide={slide}
            theme={theme}
            fontScale={effectiveFontScale}
          />
        </div>
      );

      const mediaCol = (
        <div
          key="media-col"
          className="w-[42%] h-full flex items-center justify-center overflow-hidden"
        >
          <img
            src={splitMedia.src}
            alt={splitMedia.alt}
            referrerPolicy="no-referrer"
            crossOrigin="anonymous"
            loading="eager"
            className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
            style={{ opacity: splitMedia.opacity ?? 1 }}
          />
        </div>
      );

      return (
        <div className="relative z-10 w-full h-full flex items-center justify-between gap-16 px-24 py-16">
          {isRight ? [contentCol, mediaCol] : [mediaCol, contentCol]}
        </div>
      );
    }

    // 2. Centered Layout
    if (layout === 'center') {
      return (
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center px-24 py-16 max-w-6xl mx-auto overflow-y-auto">
          <SlideContent
            slide={slide}
            theme={theme}
            fontScale={effectiveFontScale}
          />
        </div>
      );
    }

    // 3. Fullscreen Background Layout
    if (layout === 'fullscreen-bg') {
      return (
        <div className="relative z-10 w-full h-full flex flex-col justify-end px-24 py-20 max-w-7xl mx-auto overflow-y-auto">
          <SlideContent
            slide={slide}
            theme={theme}
            fontScale={effectiveFontScale}
          />
        </div>
      );
    }

    // 4. Default Keynote Layout
    return (
      <div className="relative z-10 w-full h-full flex flex-col justify-center px-24 py-16 max-w-7xl mx-auto overflow-y-auto">
        <SlideContent
          slide={slide}
          theme={theme}
          fontScale={effectiveFontScale}
        />
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden flex items-center justify-center select-none ${className}`}
      style={style}
    >
      {/* Fixed Resolution Virtual Canvas with Responsive Scaling */}
      <div
        ref={virtualCanvasRef}
        className={`virtual-slide absolute top-1/2 left-1/2 overflow-hidden flex flex-col transition-opacity duration-200 ease-out ${
          isReady ? 'opacity-100' : 'opacity-0'
        } ${theme.bgClass} ${theme.textClass} ${slide.directives?.className || ''}`}
        style={{
          width: `${virtualWidth}px`,
          height: `${virtualHeight}px`,
          transform: `translate(-50%, -50%) scale(${effectiveScale})`,
          transformOrigin: 'center center',
          transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms ease-out',
          ...theme.containerStyle,
          ...theme.slideStyle,
          ...(slide.directives?.bgColor ? { backgroundColor: slide.directives.bgColor } : {}),
        }}
      >
        {/* Full-bleed background media if present */}
        {bgMedia && (
          <div
            className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none select-none"
            style={{
              backgroundImage: `url("${bgMedia.src}")`,
              opacity: bgMedia.opacity,
            }}
          />
        )}

        {/* Slide Content */}
        {renderContent()}

        {/* Persistent In-Memory Slide Pen Drawing Canvas */}
        {(penDrawingsCache || strokes !== undefined || onAddStroke !== undefined) && (
          <SlidePenCanvas
            slideId={slide.id}
            isActive={isPenActive}
            penColor={penColor}
            penWidth={penWidth}
            strokes={strokes}
            onAddStroke={onAddStroke}
            penDrawingsCache={penDrawingsCache}
            penRevision={penRevision}
          />
        )}

        {/* Mount interactive script runner only when the slide is active */}
        {isActive && (
          <InteractiveRunner
            containerRef={virtualCanvasRef}
            isActive={isActive}
            scripts={slide.scripts}
          />
        )}
      </div>
    </div>
  );
};
