import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useToast from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should initialize with empty toasts', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual({});
  });

  it('should add a toast with default type info', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Test message');
    });

    const toasts = Object.values(result.current.toasts);
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe('Test message');
    expect(toasts[0].type).toBe('info');
  });

  it('should add a toast with specified type success', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Success message', 'success');
    });

    const toasts = Object.values(result.current.toasts);
    expect(toasts[0].type).toBe('success');
  });

  it('should add a toast with specified type error', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Error message', 'error');
    });

    const toasts = Object.values(result.current.toasts);
    expect(toasts[0].type).toBe('error');
  });

  it('should remove a toast by id when hideToast is called', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Message to hide');
    });

    const toastId = Object.keys(result.current.toasts)[0];
    expect(Object.keys(result.current.toasts)).toHaveLength(1);

    act(() => {
      result.current.hideToast(toastId);
    });

    expect(result.current.toasts).toEqual({});
  });

  it('should allow multiple toasts to coexist', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Message 1', 'success');
      result.current.showToast('Message 2', 'error');
      result.current.showToast('Message 3', 'info');
    });

    expect(Object.keys(result.current.toasts)).toHaveLength(3);
  });

  it('should auto-dismiss a toast after 3000ms', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Auto-dismiss message');
    });

    expect(Object.keys(result.current.toasts)).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.toasts).toEqual({});
  });

  it('should auto-dismiss only the targeted toast', () => {
    const { result } = renderHook(() => useToast());

    const ids: string[] = [];

    act(() => {
      result.current.showToast('Message 1');
      ids.push(Object.keys(result.current.toasts)[0]);
      result.current.showToast('Message 2');
      ids.push(Object.keys(result.current.toasts)[1]);
    });

    expect(Object.keys(result.current.toasts)).toHaveLength(2);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.toasts).toEqual({});
  });

  it('should generate unique ids for each toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Message 1');
      result.current.showToast('Message 2');
    });

    const ids = Object.keys(result.current.toasts);
    expect(ids[0]).not.toBe(ids[1]);
    expect(ids).toHaveLength(2);
  });

  it('should clear timer on hideToast to prevent memory leaks', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('Message');
    });

    const toastId = Object.keys(result.current.toasts)[0];

    act(() => {
      result.current.hideToast(toastId);
    });

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.toasts).toEqual({});
  });

  it('should not add toast with empty message', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('');
    });

    expect(result.current.toasts).toEqual({});
  });

  it('should not add toast with only whitespace message', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.showToast('   ');
    });

    expect(result.current.toasts).toEqual({});
  });
});
