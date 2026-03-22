import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { parseInlineCode } from './parseInlineCode';

describe('parseInlineCode', () => {
  it('devrait retourner un span pour du texte sans backticks', () => {
    const result = parseInlineCode('texte simple');
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    expect(container.querySelector('span')).toBeInTheDocument();
    expect(container.textContent).toBe('texte simple');
  });

  it('devrait transformer le code entre backticks en élément <code>', () => {
    const result = parseInlineCode('Utilise la balise `<img>` pour les images');
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    const code = container.querySelector('code');
    expect(code).toBeInTheDocument();
    expect(code?.textContent).toBe('<img>');
  });

  it('devrait conserver le texte avant et après le code', () => {
    const result = parseInlineCode('Avant `code` après');
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    expect(container.textContent).toBe('Avant code après');
  });

  it('devrait gérer plusieurs blocs de code', () => {
    const result = parseInlineCode('`foo` et `bar`');
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    const codes = container.querySelectorAll('code');
    expect(codes).toHaveLength(2);
    expect(codes[0].textContent).toBe('foo');
    expect(codes[1].textContent).toBe('bar');
  });

  it('devrait appliquer la classe CSS par défaut au code', () => {
    const result = parseInlineCode('`test`');
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    const code = container.querySelector('code');
    expect(code?.className).toContain('px-1.5');
    expect(code?.className).toContain('font-mono');
  });

  it('devrait appliquer une classe CSS personnalisée', () => {
    const result = parseInlineCode('`test`', 'custom-class');
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    const code = container.querySelector('code');
    expect(code?.className).toBe('custom-class');
  });

  it('devrait gérer une chaîne vide', () => {
    const result = parseInlineCode('');
    expect(result).toHaveLength(1);
  });

  it('devrait gérer du texte sans backtick', () => {
    const result = parseInlineCode('pas de code ici');
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    expect(container.querySelector('code')).toBeNull();
  });
});
