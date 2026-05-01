'use client';

import { useEffect } from 'react';
import { RecorderState } from './useRecorder';

interface ShortcutHandlers {
  state: RecorderState;
  start: () => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  toggleDraw: () => void;
  onShowShortcuts?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't fire inside inputs/textareas
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) return;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Ctrl+Shift+R — Start or Stop recording
      if (ctrl && shift && e.key === 'R') {
        e.preventDefault();
        if (handlers.state === 'idle') handlers.start();
        else if (handlers.state === 'recording' || handlers.state === 'paused') handlers.stop();
        return;
      }

      // Ctrl+Shift+P — Pause / Resume
      if (ctrl && shift && e.key === 'P') {
        e.preventDefault();
        if (handlers.state === 'recording') handlers.pause();
        else if (handlers.state === 'paused') handlers.resume();
        return;
      }

      // Ctrl+Shift+D — Toggle Draw mode
      if (ctrl && shift && e.key === 'D') {
        e.preventDefault();
        if (handlers.state === 'recording' || handlers.state === 'paused') {
          handlers.toggleDraw();
        }
        return;
      }

      // Escape — Cancel recording
      if (e.key === 'Escape') {
        if (handlers.state === 'recording' || handlers.state === 'paused') {
          e.preventDefault();
          handlers.cancel();
        }
      }

      // ? — Show keyboard shortcuts help
      if (e.key === '?' && !ctrl) {
        e.preventDefault();
        handlers.onShowShortcuts?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlers]);
}

export const SHORTCUTS = [
  { keys: 'Ctrl+Shift+R', action: 'Start / Stop recording' },
  { keys: 'Ctrl+Shift+P', action: 'Pause / Resume recording' },
  { keys: 'Ctrl+Shift+D', action: 'Toggle draw overlay' },
  { keys: 'Escape',       action: 'Cancel recording (discard)' },
];
