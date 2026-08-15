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
export function parseInlineCode(text: string, className = 'rounded-ctrl bg-sunk px-1 py-1 font-mono text-meta'): ReactNode[] {
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

