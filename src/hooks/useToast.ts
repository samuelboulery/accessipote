import { useState, useCallback, useEffect, useRef } from 'react';
import type { ToastMessage, ToastType } from '../types';
import { TOAST_AUTO_DISMISS_MS } from '../constants';

interface UseToastReturn {
  toasts: Record<string, ToastMessage>;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: (id: string) => void;
}

export default function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Record<string, ToastMessage>>({});
  const timersRef = useRef<Record<string, NodeJS.Timeout>>({});

  const hideToast = useCallback((id: string) => {
    // Clear the timer if it exists
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }

    // Remove the toast from state using immutable pattern
    setToasts(prevToasts => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _, ...rest } = prevToasts;
      return rest;
    });
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    // Validate message is not empty or only whitespace
    if (!message || message.trim() === '') {
      return;
    }

    const id = crypto.randomUUID();

    // Add toast to state using immutable pattern
    setToasts(prevToasts => ({
      ...prevToasts,
      [id]: {
        id,
        message,
        type,
      },
    }));

    // Set auto-dismiss timer
    const timer = setTimeout(() => {
      hideToast(id);
    }, TOAST_AUTO_DISMISS_MS);

    timersRef.current[id] = timer;
  }, [hideToast]);

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      Object.values(timers).forEach(timer => {
        clearTimeout(timer);
      });
    };
  }, []);

  return {
    toasts,
    showToast,
    hideToast,
  };
}
