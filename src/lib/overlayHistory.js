import { useCallback, useEffect, useRef } from 'react';

// Overlay keys are stored as a comma-separated stack in the URL hash:
//   #overlay=import,drive
// Each opened overlay pushes its key as a new history entry, so the Android
// hardware back button pops the topmost overlay (closing it) instead of
// leaving the whole workspace.

function parseStack() {
  const h = window.location.hash.replace(/^#/, '');
  const m = /^overlay=([^#]*)$/.exec(h);
  return m ? m[1].split(',').filter(Boolean) : [];
}

function includesKey(key) {
  return parseStack().includes(key);
}

function writeStack(stack, push) {
  const hash = stack.length ? `#overlay=${stack.join(',')}` : '';
  const url = hash || (window.location.pathname + window.location.search);
  if (push) window.history.pushState({ overlay: true }, '', url);
  else window.history.replaceState(null, '', url);
}

export function useOverlayBack(key, open, onClose) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const pushedRef = useRef(false);

  // Push our key once when the overlay opens; clean it up when it closes.
  useEffect(() => {
    if (open && !pushedRef.current) {
      writeStack([...parseStack(), key], true);
      pushedRef.current = true;
    }
    if (!open && pushedRef.current) {
      pushedRef.current = false;
      const stack = parseStack();
      if (stack[stack.length - 1] === key) {
        window.history.back();
      } else if (stack.includes(key)) {
        writeStack(stack.filter((k) => k !== key), false);
      }
    }
  }, [open, key]);

  // React to the back button: if our key left the stack, close.
  useEffect(() => {
    const handler = () => {
      if (pushedRef.current && !includesKey(key)) {
        pushedRef.current = false;
        onCloseRef.current();
      }
    };
    window.addEventListener('popstate', handler);
    window.addEventListener('hashchange', handler);
    return () => {
      window.removeEventListener('popstate', handler);
      window.removeEventListener('hashchange', handler);
    };
  }, [key]);

  // Programmatic close: pop our history entry (the resulting popstate closes).
  const close = useCallback(() => {
    const stack = parseStack();
    if (stack[stack.length - 1] === key) {
      window.history.back();
    } else {
      if (pushedRef.current) pushedRef.current = false;
      if (stack.includes(key)) writeStack(stack.filter((k) => k !== key), false);
      onCloseRef.current();
    }
  }, [key]);

  return { close };
}