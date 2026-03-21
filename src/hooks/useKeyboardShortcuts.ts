import { useEffect, useRef, useState, useCallback } from 'react';
import type { KeyboardShortcut } from '../types';

interface UseKeyboardShortcutsOptions {
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  exportMarkdownButtonRef: React.RefObject<HTMLButtonElement | null>;
  onGlossaryToggle: () => void;
}

interface UseKeyboardShortcutsReturn {
  shortcuts: KeyboardShortcut[];
  isHelpModalOpen: boolean;
  closeHelpModal: () => void;
}

const SHORTCUTS: KeyboardShortcut[] = [
  {
    keys: ['Ctrl', 'F'],
    description: 'Aller au champ de recherche',
    category: 'navigation',
    action: 'focusSearch',
  },
  {
    keys: ['Ctrl', 'E'],
    description: 'Copier en Markdown',
    category: 'export',
    action: 'exportMarkdown',
  },
  {
    keys: ['G'],
    description: 'Ouvrir / fermer le glossaire',
    category: 'navigation',
    action: 'toggleGlossary',
  },
  {
    keys: ['Escape'],
    description: 'Fermer le panneau ou la modale active',
    category: 'navigation',
    action: 'close',
  },
  {
    keys: ['?'],
    description: 'Afficher les raccourcis clavier',
    category: 'help',
    action: 'showHelp',
  },
];

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if ((el as HTMLElement).contentEditable === 'true') return true;
  return false;
}

export function useKeyboardShortcuts({
  searchInputRef,
  exportMarkdownButtonRef,
  onGlossaryToggle,
}: UseKeyboardShortcutsOptions): UseKeyboardShortcutsReturn {
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const isHelpModalOpenRef = useRef(false);
  isHelpModalOpenRef.current = isHelpModalOpen;

  const closeHelpModal = useCallback(() => {
    setIsHelpModalOpen(false);
  }, []);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      // Escape closes modal regardless of focus
      if (e.key === 'Escape') {
        if (isHelpModalOpenRef.current) {
          e.stopImmediatePropagation();
          setIsHelpModalOpen(false);
        }
        return;
      }

      // All other shortcuts are blocked when focus is in a form element
      if (isInputFocused()) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        exportMarkdownButtonRef.current?.click();
        return;
      }

      if (e.key === 'g' || e.key === 'G') {
        onGlossaryToggle();
        return;
      }

      if (e.key === '?') {
        setIsHelpModalOpen(true);
        return;
      }
    };

    window.addEventListener('keydown', handleKeydown, { capture: true });
    return () => {
      window.removeEventListener('keydown', handleKeydown, { capture: true });
    };
  }, [onGlossaryToggle, searchInputRef, exportMarkdownButtonRef]);

  return { shortcuts: SHORTCUTS, isHelpModalOpen, closeHelpModal };
}
