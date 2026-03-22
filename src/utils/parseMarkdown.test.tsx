import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { parseMarkdownLinks } from './parseMarkdown';

describe('parseMarkdownLinks', () => {
  const onGlossaryClick = vi.fn();
  const onCriteriaClick = vi.fn();

  const defaultOptions = {
    onGlossaryClick,
    onCriteriaClick,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait retourner le texte brut s\'il n\'y a pas de liens', () => {
    const result = parseMarkdownLinks('texte sans liens', defaultOptions);
    expect(result).toEqual(['texte sans liens']);
  });

  it('devrait transformer un lien de glossaire en bouton', () => {
    const result = parseMarkdownLinks('Voir [alternative textuelle](#alternative-textuelle)', defaultOptions);
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button?.textContent).toBe('alternative textuelle');
  });

  it('devrait appeler onGlossaryClick avec le slug correct', () => {
    const result = parseMarkdownLinks('[contraste](#contraste)', defaultOptions);
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    container.querySelector('button')?.click();
    expect(onGlossaryClick).toHaveBeenCalledWith('contraste');
  });

  it('devrait transformer un lien vers un critère en bouton critère', () => {
    const result = parseMarkdownLinks('Critère [1.1](#1.1)', defaultOptions);
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    container.querySelector('button')?.click();
    expect(onCriteriaClick).toHaveBeenCalledWith('1.1');
  });

  it('devrait appeler onGlossaryClick si onCriteriaClick n\'est pas fourni pour un lien critère', () => {
    const options = { onGlossaryClick };
    const result = parseMarkdownLinks('[1.1](#1.1)', options);
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    // Avec onCriteriaClick absent, le lien critère va vers le glossaire
    container.querySelector('button')?.click();
    expect(onGlossaryClick).toHaveBeenCalled();
  });

  it('devrait conserver le texte autour des liens', () => {
    const result = parseMarkdownLinks('Avant [lien](#slug) après', defaultOptions);
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    expect(container.textContent).toBe('Avant lien après');
  });

  it('devrait gérer plusieurs liens', () => {
    const result = parseMarkdownLinks('[lien1](#slug1) et [lien2](#slug2)', defaultOptions);
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(2);
  });

  it('devrait gérer un lien sans ancre valide', () => {
    const result = parseMarkdownLinks('[lien](#)', defaultOptions);
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('devrait gérer les critères avec format XX.XX', () => {
    const result = parseMarkdownLinks('[12.10](#12.10)', defaultOptions);
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    container.querySelector('button')?.click();
    expect(onCriteriaClick).toHaveBeenCalledWith('12.10');
  });
});
