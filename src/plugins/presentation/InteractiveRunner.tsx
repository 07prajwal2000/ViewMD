import React, { useEffect, useRef } from 'react';

export interface InteractiveRunnerProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  children?: React.ReactNode;
  isActive?: boolean;
  scripts?: string[];
  className?: string;
}

/**
 * Automatically sizes <canvas> elements within a container
 * if their width/height attributes are not explicitly provided.
 */
export function autoResizeCanvases(container: HTMLElement): void {
  const canvases = container.querySelectorAll<HTMLCanvasElement>('canvas');
  canvases.forEach((canvas) => {
    const hasAttrWidth = canvas.hasAttribute('width') && parseInt(canvas.getAttribute('width') || '0', 10) > 0;
    const hasAttrHeight = canvas.hasAttribute('height') && parseInt(canvas.getAttribute('height') || '0', 10) > 0;

    if (!hasAttrWidth || !hasAttrHeight) {
      const rect = canvas.getBoundingClientRect();
      const clientW = canvas.clientWidth || canvas.offsetWidth;
      const clientH = canvas.clientHeight || canvas.offsetHeight;
      const parentW = canvas.parentElement?.clientWidth || 800;

      const targetW = hasAttrWidth
        ? canvas.width
        : clientW > 0
          ? clientW
          : rect.width > 0
            ? Math.round(rect.width)
            : Math.min(parentW, 800);

      const targetH = hasAttrHeight
        ? canvas.height
        : clientH > 0
          ? clientH
          : rect.height > 0
            ? Math.round(rect.height)
            : 450;

      if (!hasAttrWidth) canvas.width = targetW;
      if (!hasAttrHeight) canvas.height = targetH;
    }
  });
}

/**
 * Hook that enables safe execution of interactive slide scripts.
 * Automatically tracks animation frames, intervals, timeouts, and event listeners,
 * cleaning them all up on unmount or when isActive becomes false.
 */
export function useInteractiveRunner(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive = true,
  scripts?: string[]
): void {
  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    // Auto-resize any canvases before executing scripts
    autoResizeCanvases(container);

    const animationFrameIds = new Set<number>();
    const intervalIds = new Set<number>();
    const timeoutIds = new Set<number>();
    const cleanupCallbacks: Array<() => void> = [];
    const trackedListeners: Array<{
      target: EventTarget;
      type: string;
      listener: EventListenerOrEventListenerObject;
      options?: boolean | AddEventListenerOptions;
    }> = [];

    // Scoped requestAnimationFrame
    const scopedRAF = (callback: FrameRequestCallback): number => {
      const id = window.requestAnimationFrame((time) => {
        animationFrameIds.delete(id);
        callback(time);
      });
      animationFrameIds.add(id);
      return id;
    };

    const scopedCAF = (id: number): void => {
      animationFrameIds.delete(id);
      window.cancelAnimationFrame(id);
    };

    // Scoped setInterval
    const scopedSetInterval = (
      handler: TimerHandler,
      timeout?: number,
      ...args: unknown[]
    ): number => {
      const id = window.setInterval(handler, timeout, ...args);
      intervalIds.add(id);
      return id;
    };

    const scopedClearInterval = (id: number | undefined): void => {
      if (id !== undefined) {
        intervalIds.delete(id);
        window.clearInterval(id);
      }
    };

    // Scoped setTimeout
    const scopedSetTimeout = (
      handler: TimerHandler,
      timeout?: number,
      ...args: unknown[]
    ): number => {
      const id = window.setTimeout((...cbArgs: unknown[]) => {
        timeoutIds.delete(id);
        if (typeof handler === 'function') {
          handler(...cbArgs);
        }
      }, timeout, ...args);
      timeoutIds.add(id);
      return id;
    };

    const scopedClearTimeout = (id: number | undefined): void => {
      if (id !== undefined) {
        timeoutIds.delete(id);
        window.clearTimeout(id);
      }
    };

    // Scoped addEventListener
    const scopedAddEventListener = (
      targetOrType: EventTarget | string,
      typeOrListener: string | EventListenerOrEventListenerObject,
      listenerOrOptions?: EventListenerOrEventListenerObject | boolean | AddEventListenerOptions,
      options?: boolean | AddEventListenerOptions
    ): void => {
      let target: EventTarget;
      let type: string;
      let listener: EventListenerOrEventListenerObject;
      let opts: boolean | AddEventListenerOptions | undefined;

      if (typeof targetOrType === 'string') {
        target = container;
        type = targetOrType;
        listener = typeOrListener as EventListenerOrEventListenerObject;
        opts = listenerOrOptions as boolean | AddEventListenerOptions | undefined;
      } else {
        target = targetOrType;
        type = typeOrListener as string;
        listener = listenerOrOptions as EventListenerOrEventListenerObject;
        opts = options;
      }

      target.addEventListener(type, listener, opts);
      trackedListeners.push({ target, type, listener, options: opts });
    };

    // Wrap container's addEventListener during script execution
    const origContainerAddEventListener = container.addEventListener.bind(container);
    container.addEventListener = (
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: boolean | AddEventListenerOptions
    ) => {
      scopedAddEventListener(container, type, listener, options);
    };

    // Create scoped document proxy to prioritize slide container lookups
    const scopedDocument = new Proxy(document, {
      get(target, prop, receiver) {
        if (prop === 'getElementById') {
          return (id: string) => {
            const escaped = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id;
            return container.querySelector(`#${escaped}`) || target.getElementById(id);
          };
        }
        if (prop === 'querySelector') {
          return (sel: string) => container.querySelector(sel) || target.querySelector(sel);
        }
        if (prop === 'querySelectorAll') {
          return (sel: string) => container.querySelectorAll(sel);
        }
        if (prop === 'addEventListener') {
          return (
            type: string,
            listener: EventListenerOrEventListenerObject,
            options?: boolean | AddEventListenerOptions
          ) => {
            scopedAddEventListener(document, type, listener, options);
          };
        }
        const val = Reflect.get(target, prop, receiver);
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return val;
      },
    });

    const onCleanup = (fn: () => void): void => {
      if (typeof fn === 'function') {
        cleanupCallbacks.push(fn);
      }
    };

    // Collect script sources: explicitly passed scripts + any inline script tags
    const codesToRun: string[] = [];
    if (scripts && scripts.length > 0) {
      scripts.forEach((s) => {
        if (s && s.trim()) codesToRun.push(s.trim());
      });
    }

    const scriptElements = Array.from(container.querySelectorAll<HTMLScriptElement>('script'));
    scriptElements.forEach((scriptEl) => {
      const type = scriptEl.getAttribute('type');
      const isExecutable =
        !type ||
        type === 'text/javascript' ||
        type === 'application/javascript' ||
        type === 'module';

      if (!isExecutable) return;
      const code = scriptEl.textContent || '';
      if (code.trim() && !codesToRun.includes(code.trim())) {
        codesToRun.push(code.trim());
      }
    });

    let initTimer: ReturnType<typeof setTimeout> | null = null;

    const executeAll = () => {
      autoResizeCanvases(container);
      const defaultCanvas = container.querySelector<HTMLCanvasElement>('canvas');
      const defaultCtx = defaultCanvas ? defaultCanvas.getContext('2d') : null;

      codesToRun.forEach((code) => {
        try {
          const runner = new Function(
            'container',
            'document',
            'window',
            'requestAnimationFrame',
            'cancelAnimationFrame',
            'setInterval',
            'clearInterval',
            'setTimeout',
            'clearTimeout',
            'addEventListener',
            'defaultCanvas',
            'defaultCtx',
            'onCleanup',
            'autoResizeCanvases',
            `"use strict";\n${code}`
          );

          const result = runner.call(
            container,
            container,
            scopedDocument,
            window,
            scopedRAF,
            scopedCAF,
            scopedSetInterval,
            scopedClearInterval,
            scopedSetTimeout,
            scopedClearTimeout,
            scopedAddEventListener,
            defaultCanvas,
            defaultCtx,
            onCleanup,
            () => autoResizeCanvases(container)
          );

          if (typeof result === 'function') {
            cleanupCallbacks.push(result);
          }
        } catch (err) {
          console.error('[InteractiveRunner] Error executing slide script:', err);
        }
      });
    };

    // Run after a short tick to ensure DOM nodes (<canvas>, <button>) are mounted and measured
    initTimer = setTimeout(executeAll, 30);

    // Cleanup when unmounting or when isActive toggles to false
    return () => {
      if (initTimer) clearTimeout(initTimer);
      // 1. Cancel active animation frames
      animationFrameIds.forEach((id) => window.cancelAnimationFrame(id));
      animationFrameIds.clear();

      // 2. Clear intervals
      intervalIds.forEach((id) => window.clearInterval(id));
      intervalIds.clear();

      // 3. Clear timeouts
      timeoutIds.forEach((id) => window.clearTimeout(id));
      timeoutIds.clear();

      // 4. Detach event listeners
      for (const { target, type, listener, options } of trackedListeners) {
        try {
          target.removeEventListener(type, listener, options);
        } catch {
          // Ignore listener removal failure
        }
      }
      trackedListeners.length = 0;

      // 5. Run user cleanup callbacks
      for (const cb of cleanupCallbacks) {
        try {
          cb();
        } catch (err) {
          console.error('[InteractiveRunner] Error during slide cleanup:', err);
        }
      }
      cleanupCallbacks.length = 0;

      // 6. Restore container addEventListener
      container.addEventListener = origContainerAddEventListener;
    };
  }, [containerRef, isActive, JSON.stringify(scripts)]);
}

/**
 * InteractiveRunner Component: wraps children in a container or targets an external ref.
 */
export const InteractiveRunner: React.FC<InteractiveRunnerProps> = ({
  containerRef,
  children,
  isActive = true,
  scripts,
  className,
}) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const targetRef = containerRef || internalRef;

  useInteractiveRunner(targetRef, isActive, scripts);

  if (children) {
    return (
      <div ref={internalRef} className={className ?? 'contents'}>
        {children}
      </div>
    );
  }

  return null;
};
