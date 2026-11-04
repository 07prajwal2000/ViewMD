import React, { useEffect, useRef } from 'react';

export interface LaserPointerProps {
  isActive: boolean;
  containerRef: React.RefObject<HTMLElement | null>;
}

interface Point {
  x: number;
  y: number;
  time: number;
}

const TRAIL_DURATION = 650; // Trail fades over 650ms
const INACTIVE_FADEOUT_START = 1000; // Auto-hide begins after 1s
const INACTIVE_FADEOUT_DURATION = 300; // Fades to 0 over 300ms

export const LaserPointer: React.FC<LaserPointerProps> = ({ isActive, containerRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<Point[]>([]);
  const lastMoveRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      pointsRef.current = [];
      lastMoveRef.current = null;
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to match container's physical pixel size
    const resizeCanvas = () => {
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const now = performance.now();

      // Only track if pointer is inside bounds
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        lastMoveRef.current = { x, y, time: now };
        pointsRef.current.push({ x, y, time: now });
      }
    };

    const handlePointerLeave = () => {
      lastMoveRef.current = null;
    };

    container.addEventListener('pointermove', handlePointerMove);
    container.addEventListener('pointerleave', handlePointerLeave);

    // Animation render loop
    const render = (now: number) => {
      const rect = container.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      // 1. Prune old trail points
      const cutoff = now - TRAIL_DURATION;
      while (pointsRef.current.length > 0 && pointsRef.current[0].time < cutoff) {
        pointsRef.current.shift();
      }

      const points = pointsRef.current;

      // 2. Draw fading laser trail
      if (points.length > 1) {
        for (let i = 1; i < points.length; i++) {
          const p1 = points[i - 1];
          const p2 = points[i];
          const age = now - p2.time;
          const progress = Math.max(0, Math.min(1, 1 - age / TRAIL_DURATION));

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);

          ctx.strokeStyle = `rgba(255, 45, 85, ${progress * 0.85})`;
          ctx.lineWidth = 3.5 * progress + 0.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.shadowColor = '#ff2d55';
          ctx.shadowBlur = 10 * progress;
          ctx.stroke();
        }
      }

      // 3. Draw glowing laser dot at current position
      const last = lastMoveRef.current;
      if (last) {
        const timeSinceMove = now - last.time;
        let dotAlpha = 1;

        if (timeSinceMove > INACTIVE_FADEOUT_START) {
          const fadeProgress = (timeSinceMove - INACTIVE_FADEOUT_START) / INACTIVE_FADEOUT_DURATION;
          dotAlpha = Math.max(0, 1 - fadeProgress);
        }

        if (dotAlpha > 0) {
          // Outer halo
          ctx.save();
          ctx.shadowColor = '#ff0055';
          ctx.shadowBlur = 18;

          ctx.beginPath();
          ctx.arc(last.x, last.y, 6.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 30, 80, ${dotAlpha * 0.95})`;
          ctx.fill();

          // Intense core dot
          ctx.beginPath();
          ctx.arc(last.x, last.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${dotAlpha})`;
          ctx.fill();

          ctx.restore();
        }
      }

      rafIdRef.current = requestAnimationFrame(render);
    };

    rafIdRef.current = requestAnimationFrame(render);

    return () => {
      container.removeEventListener('pointermove', handlePointerMove);
      container.removeEventListener('pointerleave', handlePointerLeave);
      resizeObserver.disconnect();
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isActive, containerRef]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-50 w-full h-full"
    />
  );
};
