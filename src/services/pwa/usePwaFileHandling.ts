import { useEffect } from 'react';
import { useTabs } from '../../context/TabsContext';
import type { FileEntry } from '../../types/fileSystem';

interface LaunchParamsWithFiles {
  targetURL?: string;
  files?: FileSystemHandle[];
}

interface LaunchQueueInterface {
  setConsumer(consumer: (launchParams: LaunchParamsWithFiles) => void | Promise<void>): void;
}

export function usePwaFileHandling() {
  const { openFile, openFileFromDisk } = useTabs();

  useEffect(() => {
    // 1. Register Service Worker for offline capabilities & PWA installation
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('./sw.js')
          .then((reg) => {
            console.log('[PWA] Service Worker registered with scope:', reg.scope);
          })
          .catch((err) => {
            console.warn('[PWA] Service Worker registration failed:', err);
          });
      });
    }

    // 2. Register W3C File Handling API consumer (Chromium PWA file associations for .md)
    const win = window as unknown as { launchQueue?: LaunchQueueInterface };
    if ('launchQueue' in window && win.launchQueue && typeof win.launchQueue.setConsumer === 'function') {
      win.launchQueue.setConsumer(async (launchParams) => {
        if (!launchParams.files || launchParams.files.length === 0) return;

        for (const handle of launchParams.files) {
          if (handle.kind === 'file') {
            const fileHandle = handle as FileSystemFileHandle;
            const entry: FileEntry = {
              id: fileHandle.name,
              name: fileHandle.name,
              path: fileHandle.name,
              kind: 'file',
              handle: fileHandle,
              fileHandle,
            };
            try {
              await openFile(entry);
            } catch (err) {
              console.error('[PWA] Failed to open launched file handle:', err);
            }
          }
        }
      });
    }

    // 3. Global shortcut Ctrl+O / Cmd+O to open file(s)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        openFileFromDisk();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openFile, openFileFromDisk]);

  return { openFileFromDisk };
}
