import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Cleanup après chaque test
afterEach(() => {
  cleanup();
});

// Mock de window.matchMedia qui n'est pas implémenté dans jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock de ResizeObserver qui n'est pas implémenté dans jsdom
// @ts-expect-error - Mocking ResizeObserver for jsdom environment
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// @ts-expect-error - Assigning mock to window.ResizeObserver
window.ResizeObserver = MockResizeObserver;
