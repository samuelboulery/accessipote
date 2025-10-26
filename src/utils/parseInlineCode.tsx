import type { ReactNode } from 'react';

/**
 * Parse le texte contenant des blocs de code inline (backticks)
 * et les convertit en éléments React stylés
 * 
 * @param text - Le texte contenant du code inline entre backticks
 * @param className - Classes CSS pour le code (par défaut pour texte normal)
 * @returns Tableau d'éléments React
 * 
 * @example
 * parseInlineCode("Utilise la balise `<img>` pour les images")
 * // Retourne: ["Utilise la balise ", <code>img</code>, " pour les images"]
 */
export function parseInlineCode(text: string, className = 'px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono text-gray-800'): ReactNode[] {
  return text.split(/`([^`]+)`/g).map((part, index) => {
    // Les parties impaires sont du code
    if (index % 2 === 1) {
      return (
        <code key={index} className={className}>
          {part}
        </code>
      );
    }
    // Les parties paires sont du texte normal
    return <span key={index}>{part}</span>;
  });
}

