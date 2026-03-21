import { renderHook, act, waitFor } from '@testing-library/react';
import { useDarkMode } from './useDarkMode';

describe('useDarkMode', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    // Reset media query mock
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should initialize with system preference when localStorage is empty', () => {
    // Mock system preference: dark mode enabled
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => {
        if (query === '(prefers-color-scheme: dark)') {
          return {
            matches: true,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          };
        }
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      }),
    });

    const { result } = renderHook(() => useDarkMode());

    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should initialize with light mode when system preference is light', () => {
    // Mock system preference: light mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { result } = renderHook(() => useDarkMode());

    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should prioritize localStorage over system preference', () => {
    // Mock system preference: dark mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => {
        if (query === '(prefers-color-scheme: dark)') {
          return {
            matches: true,
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
          };
        }
        return {
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        };
      }),
    });

    // Set localStorage to 'light' (overriding system preference)
    localStorage.setItem('theme', 'light');

    const { result } = renderHook(() => useDarkMode());

    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should toggle dark mode and persist to localStorage', async () => {
    const { result } = renderHook(() => useDarkMode());

    // Initially light (system preference)
    expect(result.current.isDark).toBe(false);
    expect(localStorage.getItem('theme')).toBeNull();

    // Toggle to dark
    act(() => {
      result.current.toggle();
    });

    await waitFor(() => {
      expect(result.current.isDark).toBe(true);
    });
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Toggle back to light
    act(() => {
      result.current.toggle();
    });

    await waitFor(() => {
      expect(result.current.isDark).toBe(false);
    });
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should apply dark class on document element when isDark is true', async () => {
    const { result } = renderHook(() => useDarkMode());

    act(() => {
      result.current.toggle();
    });

    await waitFor(() => {
      expect(result.current.isDark).toBe(true);
    });
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('should remove dark class from document element when isDark is false', async () => {
    // Initialize with dark mode
    localStorage.setItem('theme', 'dark');
    document.documentElement.classList.add('dark');

    const { result } = renderHook(() => useDarkMode());

    expect(result.current.isDark).toBe(true);

    act(() => {
      result.current.toggle();
    });

    await waitFor(() => {
      expect(result.current.isDark).toBe(false);
    });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should handle invalid localStorage value gracefully', () => {
    localStorage.setItem('theme', 'invalid-value');

    const { result } = renderHook(() => useDarkMode());

    // Should default to system preference on invalid value
    expect(typeof result.current.isDark).toBe('boolean');
    expect(typeof result.current.toggle).toBe('function');
  });
});
