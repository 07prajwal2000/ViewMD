import React, { useEffect, useRef, useCallback } from 'react';

export interface PenPoint {
  x: number;
  y: number;
}

export interface PenStroke {
  color: string;
  width: number;
  points: PenPoint[];
}

export interface SlidePenCanvasProps {
  slideId: string;
  isActive: boolean;
  penColor?: string;
  penWidth?: number;
  strokes?: PenStroke[];
  onAddStroke?: (stroke: PenStroke) => void;
  penDrawingsCache?: React.MutableRefObject<Map<string, PenStroke[]>>;
  penRevision?: number;
  onStrokeAdded?: () => void;
}

export const PEN_COLORS = [
  { id: 'yellow', label: 'Yellow', color: '#facc15' },
  { id: 'red', label: 'Neon Red', color: '#f43f5e' },
  { id: 'cyan', label: 'Cyan', color: '#38bdf8' },
  { id: 'green', label: 'Green', color: '#4ade80' },
  { id: 'white', label: 'White', color: '#ffffff' },
];

export const PEN_WIDTHS = [
  { id: 'thin', label: 'Thin', width: 4 },
  { id: 'medium', label: 'Medium', width: 8 },
  { id: 'thick', label: 'Thick', width: 14 },
];

export const SlidePenCanvas: React.FC<SlidePenCanvasProps> = ({
  slideId,
  isActive,
  penColor = '#facc15',
  penWidth = 6,
  strokes,
  onAddStroke,
  penDrawingsCache,
  penRevision = 0,
  onStrokeAdded,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<PenPoint[]>([]);

  // Redraw all strokes for the current slide from strokes prop or cache
  const redrawAllStrokes = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const activeStrokes = strokes ?? (penDrawingsCache ? penDrawingsCache.current.get(slideId) || [] : []);
    activeStrokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;

      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = stroke.color;
      ctx.shadowBlur = Math.min(8, stroke.width);

      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
      ctx.restore();
    });
  }, [slideId, strokes, penDrawingsCache]);

  // Redraw whenever slideId, strokes, or penRevision changes
  useEffect(() => {
    redrawAllStrokes();
  }, [slideId, strokes, penRevision, redrawAllStrokes]);

  // Convert browser pointer event coordinates to 1920x1080 virtual canvas coordinates
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>): PenPoint => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    const pt = getCanvasCoords(e);
    currentStrokeRef.current = [pt];

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = penColor;
    ctx.shadowBlur = Math.min(8, penWidth);

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, penWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = penColor;
    ctx.fill();
    ctx.restore();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isActive || !isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt = getCanvasCoords(e);
    const pts = currentStrokeRef.current;
    if (pts.length === 0) return;

    const prevPt = pts[pts.length - 1];
    pts.push(pt);

    ctx.save();
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = penColor;
    ctx.shadowBlur = Math.min(8, penWidth);

    ctx.beginPath();
    ctx.moveTo(prevPt.x, prevPt.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    ctx.restore();
  };

  const finishStroke = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    const pts = currentStrokeRef.current;
    if (pts.length > 0) {
      const newStroke: PenStroke = {
        color: penColor,
        width: penWidth,
        points: [...pts],
      };
      currentStrokeRef.current = [];

      if (onAddStroke) {
        onAddStroke(newStroke);
      } else if (penDrawingsCache) {
        const existing = penDrawingsCache.current.get(slideId) || [];
        penDrawingsCache.current.set(slideId, [...existing, newStroke]);
      }
      onStrokeAdded?.();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    finishStroke();
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
    finishStroke();
  };

  return (
    <canvas
      ref={canvasRef}
      width={1920}
      height={1080}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className={`absolute inset-0 z-30 w-full h-full touch-none select-none ${
        isActive ? 'pointer-events-auto cursor-crosshair' : 'pointer-events-none'
      }`}
    />
  );
};
