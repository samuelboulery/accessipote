import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check localStorage first
    const storedTheme = localStorage.getItem('theme');

    let shouldBeDark = false;

    if (storedTheme === 'dark') {
      shouldBeDark = true;
    } else if (storedTheme === 'light') {
      shouldBeDark = false;
    } else {
      // Fall back to system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      shouldBeDark = prefersDark;
    }

    setIsDark(shouldBeDark);

    // Apply dark class to document element
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggle = () => {
    setIsDark(prev => {
      const newValue = !prev;

      // Persist to localStorage
      localStorage.setItem('theme', newValue ? 'dark' : 'light');

      // Apply dark class to document element
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

      return newValue;
    });
  };

  return { isDark, toggle };
}
