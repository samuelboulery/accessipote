import { describe, it, expect, vi, afterEach } from 'vitest';

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it('logError appelle console.error en mode DEV', async () => {
    vi.stubEnv('DEV', true);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Re-importer pour appliquer le stub d'env
    const { logError } = await import('./logger?t=' + Date.now());
    logError('test error');

    expect(errorSpy).toHaveBeenCalledWith('test error');
  });

  it('logWarning appelle console.warn en mode DEV', async () => {
    vi.stubEnv('DEV', true);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { logWarning } = await import('./logger?t=' + Date.now() + '1');
    logWarning('test warning');

    expect(warnSpy).toHaveBeenCalledWith('test warning');
  });

  it('logInfo appelle console.log en mode DEV', async () => {
    vi.stubEnv('DEV', true);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const { logInfo } = await import('./logger?t=' + Date.now() + '2');
    logInfo('test info');

    expect(logSpy).toHaveBeenCalledWith('test info');
  });

  it('logError avec plusieurs arguments', async () => {
    vi.stubEnv('DEV', true);
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { logError } = await import('./logger?t=' + Date.now() + '3');
    logError('msg', { detail: 'data' }, 42);

    expect(errorSpy).toHaveBeenCalled();
  });
});
