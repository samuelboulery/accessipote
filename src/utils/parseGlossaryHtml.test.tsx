import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { parseGlossaryHtml } from './parseGlossaryHtml';

describe('parseGlossaryHtml', () => {
  const onGlossaryClick = vi.fn();
  const onCriteriaClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait parser un paragraphe HTML simple', () => {
    const result = parseGlossaryHtml('<p>Texte simple</p>', { onGlossaryClick });
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    expect(container.querySelector('p')).toBeInTheDocument();
    expect(container.textContent).toBe('Texte simple');
  });

  it('devrait transformer un lien interne (ancre) en bouton de glossaire', () => {
    const result = parseGlossaryHtml(
      '<p><a href="#alternative-textuelle">alternative textuelle</a></p>',
      { onGlossaryClick, onCriteriaClick }
    );
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button?.textContent).toBe('alternative textuelle');
    button?.click();
    expect(onGlossaryClick).toHaveBeenCalledWith('alternative-textuelle');
  });

  it('devrait transformer un lien critère (format X.X) en bouton critère', () => {
    const result = parseGlossaryHtml(
      '<p><a href="#1.1">critère 1.1</a></p>',
      { onGlossaryClick, onCriteriaClick }
    );
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    const button = container.querySelector('button');
    button?.click();
    expect(onCriteriaClick).toHaveBeenCalledWith('1.1');
  });

  it('devrait créer un lien externe avec target="_blank" pour les URLs http', () => {
    const result = parseGlossaryHtml(
      '<p><a href="https://example.com">lien externe</a></p>',
      { onGlossaryClick }
    );
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    const link = container.querySelector('a');
    expect(link).toBeInTheDocument();
    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('devrait ignorer les liens avec des protocoles non sécurisés (javascript:)', () => {
    const result = parseGlossaryHtml(
      '<p><a href="javascript:alert(1)">lien malveillant</a></p>',
      { onGlossaryClick }
    );
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    // DOMPurify nettoie le href mais peut conserver le texte — pas de bouton cliquable
    expect(container.querySelector('button')).toBeNull();
    // Si un <a> existe, il ne doit pas avoir de href javascript: (DOMPurify enlève l'attribut)
    const link = container.querySelector('a');
    if (link) {
      const href = link.getAttribute('href');
      expect(href === null || !href.includes('javascript:')).toBe(true);
    }
  });

  it('ne rend rien d’exécutable pour un <script> injecté', () => {
    const result = parseGlossaryHtml(
      '<p>Terme</p><script>window.__pwned = true;</script>',
      { onGlossaryClick }
    );
    const { container } = render(React.createElement(React.Fragment, null, ...result));

    expect(container.querySelector('script')).toBeNull();
    expect(container.textContent).toBe('Terme');
  });

  it('ne recopie ni onerror ni src depuis une image injectée', () => {
    const result = parseGlossaryHtml(
      '<p>Terme <img src="x" onerror="window.__pwned = true"></p>',
      { onGlossaryClick }
    );
    const { container } = render(React.createElement(React.Fragment, null, ...result));

    expect(container.querySelector('img')).toBeNull();
    expect(container.innerHTML).not.toContain('onerror');
  });

  it('ne recopie pas un gestionnaire d’événement porté par une balise autorisée', () => {
    const result = parseGlossaryHtml(
      '<p onclick="window.__pwned = true" onmouseover="window.__pwned = true">Terme</p>',
      { onGlossaryClick }
    );
    const { container } = render(React.createElement(React.Fragment, null, ...result));

    const paragraph = container.querySelector('p');
    expect(paragraph?.getAttribute('onclick')).toBeNull();
    expect(paragraph?.getAttribute('onmouseover')).toBeNull();
  });

  it('ne fabrique pas de lien pour un protocole que DOMPurify laisse passer (mailto:)', () => {
    const result = parseGlossaryHtml(
      '<p><a href="mailto:contact@exemple.fr">écrire</a></p>',
      { onGlossaryClick }
    );
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    // Seuls http(s) et les ancres donnent un élément cliquable. Le texte reste.
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
    expect(container.textContent).toBe('écrire');
  });

  it('ne fabrique pas de lien pour une ancre vide (href="#")', () => {
    const result = parseGlossaryHtml('<p><a href="#">retour</a></p>', { onGlossaryClick });
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('button')).toBeNull();
    expect(container.textContent).toBe('retour');
  });

  it('devrait gérer les éléments HTML imbriqués', () => {
    const result = parseGlossaryHtml(
      '<p><strong>texte en gras</strong> et <em>italique</em></p>',
      { onGlossaryClick }
    );
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    expect(container.querySelector('strong')).toBeInTheDocument();
    expect(container.querySelector('em')).toBeInTheDocument();
  });

  it('conserve le balisage de langue des termes anglais du glossaire', () => {
    const result = parseGlossaryHtml(
      '<p>Voir <span lang="en"><a href="https://www.w3.org/TR/wai-aria-1.1/#banner"><code>Banner (role)</code></a></span>.</p>',
      { onGlossaryClick, onCriteriaClick }
    );
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    const span = container.querySelector('span[lang="en"]');
    expect(span).toBeInTheDocument();
    expect(span?.textContent).toBe('Banner (role)');
  });

  it('devrait retourner un tableau vide pour du HTML vide', () => {
    const result = parseGlossaryHtml('', { onGlossaryClick });
    expect(result).toHaveLength(0);
  });

  it('devrait gérer les listes ul/li', () => {
    const result = parseGlossaryHtml(
      '<ul><li>élément 1</li><li>élément 2</li></ul>',
      { onGlossaryClick }
    );
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('devrait gérer onCriteriaClick absent pour un lien critère', () => {
    const result = parseGlossaryHtml(
      '<p><a href="#1.1">critère 1.1</a></p>',
      { onGlossaryClick }
    );
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    const button = container.querySelector('button');
    // Ne devrait pas crasher même sans onCriteriaClick
    expect(() => button?.click()).not.toThrow();
  });

  it('devrait gérer les liens RGAA vers des critères', () => {
    const result = parseGlossaryHtml(
      '<p><a href="https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#1.1">critère 1.1</a></p>',
      { onGlossaryClick, onCriteriaClick }
    );
    const { container } = render(React.createElement(React.Fragment, null, ...result));
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });
});
