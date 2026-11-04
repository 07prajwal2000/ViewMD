import React from 'react';
import { Edit2, Trash2, X, Undo2, Redo2 } from 'lucide-react';
import { PEN_COLORS, PEN_WIDTHS } from './SlidePenCanvas';

export interface SlidePenToolbarProps {
  isActive: boolean;
  currentColor: string;
  onColorChange: (color: string) => void;
  currentWidth: number;
  onWidthChange: (width: number) => void;
  canUndo?: boolean;
  onUndo?: () => void;
  canRedo?: boolean;
  onRedo?: () => void;
  canClear?: boolean;
  onClear: () => void;
  onClose: () => void;
}

export const SlidePenToolbar: React.FC<SlidePenToolbarProps> = ({
  isActive,
  currentColor,
  onColorChange,
  currentWidth,
  onWidthChange,
  canUndo = false,
  onUndo,
  canRedo = false,
  onRedo,
  canClear = false,
  onClear,
  onClose,
}) => {
  if (!isActive) return null;

  return (
    <div className="absolute top-5 inset-x-0 mx-auto w-fit z-50 flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/85 backdrop-blur-md border border-white/20 text-white shadow-2xl pointer-events-auto transition-all animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center gap-1.5 pr-2.5 border-r border-white/20">
        <Edit2 className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs font-semibold tracking-wide text-gray-200 hidden sm:inline">
          Pen Tool (P)
        </span>
      </div>

      {/* Color Selectors */}
      <div className="flex items-center gap-1.5 px-1">
        {PEN_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onColorChange(c.color)}
            title={c.label}
            className={`w-5 h-5 rounded-full transition-transform cursor-pointer ${
              currentColor === c.color ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-black' : 'hover:scale-110 opacity-70 hover:opacity-100'
            }`}
            style={{ backgroundColor: c.color }}
          />
        ))}
      </div>

      <div className="w-px h-3.5 bg-white/20 mx-1" />

      {/* Stroke Width Selector */}
      <div className="flex items-center gap-1 bg-white/10 p-0.5 rounded-lg text-xs">
        {PEN_WIDTHS.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onWidthChange(w.width)}
            title={`${w.label} Brush (${w.width}px)`}
            className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
              currentWidth === w.width
                ? 'bg-amber-500 text-black font-bold'
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {w.label}
          </button>
        ))}
      </div>

      <div className="w-px h-3.5 bg-white/20 mx-1" />

      {/* Undo button */}
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo last stroke (Ctrl+Z)"
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        <Undo2 className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Undo</span>
      </button>

      {/* Redo button */}
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo stroke (Ctrl+Y / Ctrl+Shift+Z)"
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        <Redo2 className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Redo</span>
      </button>

      {/* Clear button */}
      <button
        type="button"
        onClick={onClear}
        disabled={!canClear}
        title="Clear sketches on this slide"
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-rose-300 hover:text-white hover:bg-rose-500/20 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Clear</span>
      </button>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        title="Exit Pen mode (P / Esc)"
        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
      >
        <X className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Done</span>
      </button>
    </div>
  );
};
