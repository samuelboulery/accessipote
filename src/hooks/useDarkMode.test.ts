import { renderHook, act } from '@testing-library/react';
import { useDarkMode } from './useDarkMode';

/** Pilote `prefers-color-scheme` et retient les auditeurs posés par le hook. */
function mockSystemDark(prefersDark: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: (_: string, handler: (event: MediaQueryListEvent) => void) =>
        listeners.add(handler),
      removeEventListener: (_: string, handler: (event: MediaQueryListEvent) => void) =>
        listeners.delete(handler),
      dispatchEvent: vi.fn(),
    })),
  });

  return {
    /** Simule un changement de préférence côté navigateur. */
    emit(matches: boolean) {
      for (const handler of listeners) handler({ matches } as MediaQueryListEvent);
    },
    get listenerCount() {
      return listeners.size;
    },
  };
}

describe('useDarkMode', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    mockSystemDark(false);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('démarre en mode système quand rien n\'est stocké', () => {
    mockSystemDark(true);
    const { result } = renderHook(() => useDarkMode());

    expect(result.current.mode).toBe('system');
    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('suit la préférence claire du navigateur en mode système', () => {
    mockSystemDark(false);
    const { result } = renderHook(() => useDarkMode());

    expect(result.current.mode).toBe('system');
    expect(result.current.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('reprend un choix explicite stocké', () => {
    localStorage.setItem('theme', 'dark');
    mockSystemDark(false);
    const { result } = renderHook(() => useDarkMode());

    expect(result.current.mode).toBe('dark');
    expect(result.current.isDark).toBe(true);
  });

  it('ignore une valeur stockée illisible et retombe sur le système', () => {
    localStorage.setItem('theme', 'n-importe-quoi');
    const { result } = renderHook(() => useDarkMode());

    expect(result.current.mode).toBe('system');
  });

  it('cycle clair, sombre, système', () => {
    localStorage.setItem('theme', 'light');
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.mode).toBe('light');

    act(() => result.current.cycle());
    expect(result.current.mode).toBe('dark');

    act(() => result.current.cycle());
    expect(result.current.mode).toBe('system');

    act(() => result.current.cycle());
    expect(result.current.mode).toBe('light');
  });

  it('efface la clé stockée en mode système plutôt que d\'y écrire « system »', () => {
    localStorage.setItem('theme', 'dark');
    const { result } = renderHook(() => useDarkMode());

    act(() => result.current.setThemeMode('system'));

    // L'absence de choix EST le suivi du navigateur : rien à stocker.
    expect(localStorage.getItem('theme')).toBeNull();
    expect(result.current.mode).toBe('system');
  });

  it('persiste un choix explicite', () => {
    const { result } = renderHook(() => useDarkMode());

    act(() => result.current.setThemeMode('dark'));
    expect(localStorage.getItem('theme')).toBe('dark');

    act(() => result.current.setThemeMode('light'));
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('réagit à un changement de préférence du navigateur en mode système', () => {
    const media = mockSystemDark(false);
    const { result } = renderHook(() => useDarkMode());
    expect(result.current.isDark).toBe(false);

    act(() => media.emit(true));

    expect(result.current.isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('ignore la préférence du navigateur quand un choix explicite est posé', () => {
    const media = mockSystemDark(false);
    const { result } = renderHook(() => useDarkMode());

    act(() => result.current.setThemeMode('light'));
    act(() => media.emit(true));

    expect(result.current.isDark).toBe(false);
  });

  it('retire son auditeur au démontage', () => {
    const media = mockSystemDark(false);
    const { unmount } = renderHook(() => useDarkMode());
    expect(media.listenerCount).toBe(1);

    unmount();

    expect(media.listenerCount).toBe(0);
  });

  it('applique la classe dark sur documentElement', () => {
    const { result } = renderHook(() => useDarkMode());

    act(() => result.current.setThemeMode('dark'));
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    act(() => result.current.setThemeMode('light'));
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
