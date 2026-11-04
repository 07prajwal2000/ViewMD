import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ParsedSlide, PresentationTheme } from './types';
import { SlideContent } from './SlideContent';

interface PrintSlidesProps {
  slides: ParsedSlide[];
  theme: PresentationTheme;
  title?: string;
}

export const PrintSlides: React.FC<PrintSlidesProps> = ({ slides, theme }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <>
      <style>{`
        @media print {
          @page {
            size: 16in 9in;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 100% !important;
            overflow: visible !important;
            background: ${theme.isDark ? '#0a0f1d' : '#ffffff'} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          /* Hide main application root so only the print portal is printed */
          #root {
            display: none !important;
          }
          #mdp-print-portal {
            display: block !important;
            visibility: visible !important;
            position: static !important;
            width: 16in !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .mdp-print-page {
            width: 16in !important;
            height: 9in !important;
            min-width: 16in !important;
            min-height: 9in !important;
            max-width: 16in !important;
            max-height: 9in !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            display: flex !important;
            position: relative !important;
            overflow: hidden !important;
          }
        }
      `}</style>

      <div id="mdp-print-portal" className="hidden print:block">
        {slides.map((slide, index) => (
          <div
            key={slide.id || index}
            className={`mdp-print-page ${theme.bgClass} ${theme.textClass} flex flex-col justify-center items-center relative p-16`}
            style={{
              ...theme.containerStyle,
              backgroundColor: theme.isDark ? '#0a0f1d' : '#ffffff',
            }}
          >
            {/* Background media */}
            {slide.backgroundMedia && (
              <div
                className="absolute inset-0 bg-cover bg-center pointer-events-none"
                style={{
                  backgroundImage: `url(${slide.backgroundMedia.src})`,
                  opacity: slide.backgroundMedia.opacity,
                }}
              />
            )}

            {/* Content & Split */}
            {slide.splitMedia ? (
              <div
                className={`relative z-10 w-full h-full flex items-center gap-16 px-16 py-10 ${
                  slide.splitMedia.position === 'right' ? 'flex-row' : 'flex-row-reverse'
                }`}
              >
                <div className="w-[58%] h-full flex flex-col justify-center overflow-hidden">
                  <SlideContent slide={slide} theme={theme} />
                </div>
                <div className="w-[42%] flex items-center justify-center overflow-hidden">
                  <img
                    src={slide.splitMedia.src}
                    alt={slide.splitMedia.alt}
                    className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl"
                    style={{ opacity: slide.splitMedia.opacity ?? 1 }}
                  />
                </div>
              </div>
            ) : (
              <div className="relative z-10 w-full max-w-7xl mx-auto h-full flex flex-col justify-center px-16 py-12">
                <SlideContent slide={slide} theme={theme} />
              </div>
            )}

            {/* Print Page Number (Bottom Right only, no bottom-left watermark) */}
            <div className="absolute bottom-6 right-16 flex justify-end items-center text-sm opacity-50 font-mono">
              <span>
                {index + 1} / {slides.length}
              </span>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(content, document.body);
};

export const exportPresentationToPdf = () => {
  setTimeout(() => {
    window.print();
  }, 100);
};
