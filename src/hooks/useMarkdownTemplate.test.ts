import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useMarkdownTemplate } from './useMarkdownTemplate';
import { DEFAULT_TEMPLATES } from '../utils/markdownTemplate';
import { EXPORT_TEMPLATES_STORAGE_KEY } from '../constants';

describe('useMarkdownTemplate', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('rend le gabarit par défaut du mode quand rien n’est stocké', () => {
    const { result } = renderHook(() => useMarkdownTemplate('classic'));
    expect(result.current.template).toBe(DEFAULT_TEMPLATES.classic);

    const ds = renderHook(() => useMarkdownTemplate('design-system'));
    expect(ds.result.current.template).toBe(DEFAULT_TEMPLATES['design-system']);
  });

  it('persiste le gabarit et le relit au montage suivant', () => {
    const { result } = renderHook(() => useMarkdownTemplate('classic'));
    act(() => result.current.setTemplate('# {{nomAudit}}'));
    expect(result.current.template).toBe('# {{nomAudit}}');

    const remount = renderHook(() => useMarkdownTemplate('classic'));
    expect(remount.result.current.template).toBe('# {{nomAudit}}');
  });

  it('garde un gabarit par mode', () => {
    const classic = renderHook(() => useMarkdownTemplate('classic'));
    act(() => classic.result.current.setTemplate('classique'));

    const ds = renderHook(() => useMarkdownTemplate('design-system'));
    expect(ds.result.current.template).toBe(DEFAULT_TEMPLATES['design-system']);

    act(() => ds.result.current.setTemplate('design system'));
    expect(renderHook(() => useMarkdownTemplate('classic')).result.current.template).toBe('classique');
  });

  it('revient au défaut après réinitialisation, et oublie l’entrée stockée', () => {
    const { result } = renderHook(() => useMarkdownTemplate('classic'));
    act(() => result.current.setTemplate('# perso'));
    act(() => result.current.reset());

    expect(result.current.template).toBe(DEFAULT_TEMPLATES.classic);
    expect(window.localStorage.getItem(EXPORT_TEMPLATES_STORAGE_KEY)).not.toContain('# perso');
  });

  it('retombe sur le défaut devant un JSON corrompu', () => {
    window.localStorage.setItem(EXPORT_TEMPLATES_STORAGE_KEY, '{ pas du json');
    const { result } = renderHook(() => useMarkdownTemplate('classic'));
    expect(result.current.template).toBe(DEFAULT_TEMPLATES.classic);
  });

  it('retombe sur le défaut devant une entrée du mauvais type', () => {
    window.localStorage.setItem(EXPORT_TEMPLATES_STORAGE_KEY, JSON.stringify({ classic: 42 }));
    expect(renderHook(() => useMarkdownTemplate('classic')).result.current.template).toBe(
      DEFAULT_TEMPLATES.classic,
    );
  });

  it('retombe sur le défaut devant un gabarit invalide', () => {
    window.localStorage.setItem(
      EXPORT_TEMPLATES_STORAGE_KEY,
      JSON.stringify({ classic: '{{#critères}}jamais fermé' }),
    );
    expect(renderHook(() => useMarkdownTemplate('classic')).result.current.template).toBe(
      DEFAULT_TEMPLATES.classic,
    );
  });

  it('ne touche ni à la progression v1 ni au magasin d’audits', () => {
    window.localStorage.setItem('rgaa-progress', 'intact');
    window.localStorage.setItem('rgaa-audits', 'intact');

    const { result } = renderHook(() => useMarkdownTemplate('classic'));
    act(() => result.current.setTemplate('# perso'));
    act(() => result.current.reset());

    expect(window.localStorage.getItem('rgaa-progress')).toBe('intact');
    expect(window.localStorage.getItem('rgaa-audits')).toBe('intact');
  });

  it('ne casse pas si l’écriture échoue', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useMarkdownTemplate('classic'));
    expect(() => act(() => result.current.setTemplate('# perso'))).not.toThrow();
    expect(result.current.template).toBe('# perso');

    setItem.mockRestore();
  });
});
