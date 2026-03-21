import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useKeyboardShortcuts } from './useKeyboardShortcuts';

function fireKeydown(key: string, extra: Partial<KeyboardEventInit> = {}) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...extra }));
}

describe('useKeyboardShortcuts', () => {
  const searchInputRef = { current: { focus: vi.fn() } as unknown as HTMLInputElement };
  const exportMarkdownButtonRef = { current: { click: vi.fn() } as unknown as HTMLButtonElement };
  const onGlossaryToggle = vi.fn();

  const defaultOptions = { searchInputRef, exportMarkdownButtonRef, onGlossaryToggle };

  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure activeElement is not an input
    Object.defineProperty(document, 'activeElement', {
      value: document.body,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retourne la liste des raccourcis définis', () => {
    const { result } = renderHook(() => useKeyboardShortcuts(defaultOptions));
    expect(result.current.shortcuts.length).toBeGreaterThan(0);
    expect(result.current.shortcuts[0]).toHaveProperty('keys');
    expect(result.current.shortcuts[0]).toHaveProperty('description');
    expect(result.current.shortcuts[0]).toHaveProperty('category');
  });

  it('retourne isHelpModalOpen à false par défaut', () => {
    const { result } = renderHook(() => useKeyboardShortcuts(defaultOptions));
    expect(result.current.isHelpModalOpen).toBe(false);
  });

  it('Ctrl+F donne le focus au champ de recherche', () => {
    renderHook(() => useKeyboardShortcuts(defaultOptions));
    act(() => { fireKeydown('f', { ctrlKey: true }); });
    expect(searchInputRef.current.focus).toHaveBeenCalledTimes(1);
  });

  it('Meta+F (Cmd) donne le focus au champ de recherche', () => {
    renderHook(() => useKeyboardShortcuts(defaultOptions));
    act(() => { fireKeydown('f', { metaKey: true }); });
    expect(searchInputRef.current.focus).toHaveBeenCalledTimes(1);
  });

  it('Ctrl+E déclenche le clic sur le bouton export Markdown', () => {
    renderHook(() => useKeyboardShortcuts(defaultOptions));
    act(() => { fireKeydown('e', { ctrlKey: true }); });
    expect(exportMarkdownButtonRef.current.click).toHaveBeenCalledTimes(1);
  });

  it('Meta+E déclenche le clic sur le bouton export Markdown', () => {
    renderHook(() => useKeyboardShortcuts(defaultOptions));
    act(() => { fireKeydown('e', { metaKey: true }); });
    expect(exportMarkdownButtonRef.current.click).toHaveBeenCalledTimes(1);
  });

  it('G toggle le glossaire', () => {
    renderHook(() => useKeyboardShortcuts(defaultOptions));
    act(() => { fireKeydown('g'); });
    expect(onGlossaryToggle).toHaveBeenCalledTimes(1);
  });

  it('? ouvre la modale d\'aide', () => {
    const { result } = renderHook(() => useKeyboardShortcuts(defaultOptions));
    act(() => { fireKeydown('?'); });
    expect(result.current.isHelpModalOpen).toBe(true);
  });

  it('Escape ferme la modale d\'aide si elle est ouverte', () => {
    const { result } = renderHook(() => useKeyboardShortcuts(defaultOptions));
    act(() => { fireKeydown('?'); });
    expect(result.current.isHelpModalOpen).toBe(true);
    act(() => { fireKeydown('Escape'); });
    expect(result.current.isHelpModalOpen).toBe(false);
  });

  it('closeHelpModal ferme la modale', () => {
    const { result } = renderHook(() => useKeyboardShortcuts(defaultOptions));
    act(() => { fireKeydown('?'); });
    expect(result.current.isHelpModalOpen).toBe(true);
    act(() => { result.current.closeHelpModal(); });
    expect(result.current.isHelpModalOpen).toBe(false);
  });

  it('n\'active pas les raccourcis si le focus est dans un input', () => {
    const input = document.createElement('input');
    Object.defineProperty(document, 'activeElement', { value: input, configurable: true });

    renderHook(() => useKeyboardShortcuts(defaultOptions));
    act(() => {
      fireKeydown('g');
      fireKeydown('?');
      fireKeydown('f', { ctrlKey: true });
      fireKeydown('e', { ctrlKey: true });
    });

    expect(onGlossaryToggle).not.toHaveBeenCalled();
    expect(searchInputRef.current.focus).not.toHaveBeenCalled();
    expect(exportMarkdownButtonRef.current.click).not.toHaveBeenCalled();
  });

  it('n\'active pas les raccourcis si le focus est dans un textarea', () => {
    const textarea = document.createElement('textarea');
    Object.defineProperty(document, 'activeElement', { value: textarea, configurable: true });

    renderHook(() => useKeyboardShortcuts(defaultOptions));
    act(() => { fireKeydown('g'); });
    expect(onGlossaryToggle).not.toHaveBeenCalled();
  });

  it('n\'active pas les raccourcis si le focus est dans un select', () => {
    const select = document.createElement('select');
    Object.defineProperty(document, 'activeElement', { value: select, configurable: true });

    renderHook(() => useKeyboardShortcuts(defaultOptions));
    act(() => { fireKeydown('g'); });
    expect(onGlossaryToggle).not.toHaveBeenCalled();
  });

  it('Escape ferme quand même la modale même si le focus est dans un input', () => {
    const input = document.createElement('input');
    Object.defineProperty(document, 'activeElement', { value: input, configurable: true });

    const { result } = renderHook(() => useKeyboardShortcuts(defaultOptions));
    // Ouvrir manuellement via closeHelpModal inverse — simuler état ouvert
    act(() => {
      Object.defineProperty(document, 'activeElement', { value: document.body, configurable: true });
      fireKeydown('?');
    });
    expect(result.current.isHelpModalOpen).toBe(true);

    // Remettre focus dans input
    Object.defineProperty(document, 'activeElement', { value: input, configurable: true });
    act(() => { fireKeydown('Escape'); });
    expect(result.current.isHelpModalOpen).toBe(false);
  });

  it('supprime le listener keydown à la destruction du hook', () => {
    const spy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useKeyboardShortcuts(defaultOptions));
    unmount();
    expect(spy).toHaveBeenCalledWith('keydown', expect.any(Function), expect.objectContaining({ capture: true }));
  });
});
