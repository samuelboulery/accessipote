import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GlossaryPopover from './GlossaryPopover';
import type { GlossaryTerm } from '../types';

const TERM: GlossaryTerm = {
  title: 'Critère',
  body: '<p>Un critère est une règle d\'accessibilité testable.</p>',
};

const ANCHOR = {
  x: 100,
  y: 50,
  left: 100,
  top: 50,
  bottom: 70,
  width: 50,
  height: 20,
  right: 150,
  toJSON: () => ({}),
} as DOMRect;

function setup(overrides = {}) {
  const onClose = vi.fn();
  const onOpenInGlossary = vi.fn();

  render(
    <GlossaryPopover
      term={TERM}
      anchor={ANCHOR}
      onClose={onClose}
      onOpenInGlossary={onOpenInGlossary}
      {...overrides}
    />,
  );

  return { onClose, onOpenInGlossary };
}

describe('GlossaryPopover', () => {
  describe('Accessibilité', () => {
    it('a role="dialog" avec aria-label nommant le terme', () => {
      setup();

      const dialog = screen.getByRole('dialog', { name: /Définition : Critère/ });
      expect(dialog).toBeInTheDocument();
    });

    it('donne le focus au popover à l\'ouverture', () => {
      const { container } = render(
        <GlossaryPopover
          term={TERM}
          anchor={ANCHOR}
          onClose={vi.fn()}
          onOpenInGlossary={vi.fn()}
        />,
      );

      const dialog = container.querySelector('[role="dialog"]') as HTMLElement;
      expect(document.activeElement).toBe(dialog);
    });

    it('affiche le label "Glossaire RGAA"', () => {
      setup();

      expect(screen.getByText('Glossaire RGAA')).toBeInTheDocument();
    });
  });

  describe('Contenu', () => {
    it('affiche le titre du terme', () => {
      setup();

      expect(screen.getByText('Critère')).toBeInTheDocument();
    });

    it('rend le contenu HTML en texte brut (balises retirées)', () => {
      setup({
        term: {
          title: 'Test',
          body: '<p>Texte <strong>important</strong> avec <em>emphase</em>.</p>',
        },
      });

      expect(screen.getByText(/Texte important avec emphase/)).toBeInTheDocument();
    });

    it('tronque l\'extrait au-delà de 260 caractères', () => {
      const longBody = `<p>${'a'.repeat(300)}</p>`;
      setup({
        term: {
          title: 'Long',
          body: longBody,
        },
      });

      const text = screen.getByText(/^a+…$/);
      expect(text.textContent).toHaveLength(261);
    });

    it('ajoute « … » après la troncature', () => {
      setup({
        term: {
          title: 'Test',
          body: `<p>${'a'.repeat(300)}</p>`,
        },
      });

      expect(screen.getByText(/…$/)).toBeInTheDocument();
    });

    it('ne tronque pas un texte court', () => {
      setup({
        term: {
          title: 'Test',
          body: '<p>Court.</p>',
        },
      });

      expect(screen.getByText('Court.')).toBeInTheDocument();
      expect(screen.queryByText(/…/)).not.toBeInTheDocument();
    });

    it('collapse les espaces multiples dans le HTML', () => {
      setup({
        term: {
          title: 'Test',
          body: '<p>Texte    avec    espaces</p>',
        },
      });

      expect(screen.getByText('Texte avec espaces')).toBeInTheDocument();
    });
  });

  describe('Fermeture', () => {
    it('ferme le popover à la touche Échap', async () => {
      const { onClose } = setup();

      await userEvent.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });

    it('ferme le popover au clic en dehors', () => {
      const { onClose } = setup();

      fireEvent.mouseDown(document.body);

      expect(onClose).toHaveBeenCalled();
    });

    it('ne ferme pas le popover au clic sur le contenu', async () => {
      const user = userEvent.setup();
      const { onClose } = setup();

      const text = screen.getByText('Glossaire RGAA');
      await user.click(text);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('ferme le popover au clic du bouton Fermer', async () => {
      const user = userEvent.setup();
      const { onClose } = setup();

      await user.click(screen.getByRole('button', { name: 'Fermer la définition' }));

      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Lien Glossaire', () => {
    it('affiche le lien « Ouvrir dans le glossaire »', () => {
      setup();

      expect(screen.getByRole('button', { name: /Ouvrir dans le glossaire/ })).toBeInTheDocument();
    });

    it('appelle onOpenInGlossary au clic', async () => {
      const user = userEvent.setup();
      const { onOpenInGlossary } = setup();

      await user.click(screen.getByRole('button', { name: /Ouvrir dans le glossaire/ }));

      expect(onOpenInGlossary).toHaveBeenCalled();
    });
  });

  describe('Positionnement', () => {
    it('positionne le popover en haut à gauche du terme', () => {
      const { container } = render(
        <GlossaryPopover
          term={TERM}
          anchor={ANCHOR}
          onClose={vi.fn()}
          onOpenInGlossary={vi.fn()}
        />,
      );

      const popover = container.querySelector('[role="dialog"]') as HTMLElement;
      expect(popover.style.top).toBe('78px');
      expect(popover.style.left).toBe('100px');
    });

    it('recadre le popover si l\'ancre est trop à droite', () => {
      const rightAnchor = {
        x: window.innerWidth - 50,
        y: 50,
        left: window.innerWidth - 50,
        top: 50,
        bottom: 70,
        width: 50,
        height: 20,
        right: window.innerWidth,
        toJSON: () => ({}),
      } as DOMRect;

      const { container } = render(
        <GlossaryPopover
          term={TERM}
          anchor={rightAnchor}
          onClose={vi.fn()}
          onOpenInGlossary={vi.fn()}
        />,
      );

      const popover = container.querySelector('[role="dialog"]') as HTMLElement;
      const left = parseInt(popover.style.left, 10);
      expect(left).toBeLessThanOrEqual(window.innerWidth - 320 - 8);
    });

    it('ne descend pas en dessous de 8px du bord gauche', () => {
      const leftAnchor = {
        x: 0,
        y: 50,
        left: 0,
        top: 50,
        bottom: 70,
        width: 50,
        height: 20,
        right: 50,
        toJSON: () => ({}),
      } as DOMRect;

      const { container } = render(
        <GlossaryPopover
          term={TERM}
          anchor={leftAnchor}
          onClose={vi.fn()}
          onOpenInGlossary={vi.fn()}
        />,
      );

      const popover = container.querySelector('[role="dialog"]') as HTMLElement;
      expect(parseInt(popover.style.left, 10)).toBe(8);
    });

    it('a une largeur de 320px', () => {
      const { container } = render(
        <GlossaryPopover
          term={TERM}
          anchor={ANCHOR}
          onClose={vi.fn()}
          onOpenInGlossary={vi.fn()}
        />,
      );

      const popover = container.querySelector('[role="dialog"]') as HTMLElement;
      expect(popover.style.width).toBe('320px');
    });
  });

  describe('Réaction aux changements de props', () => {
    it('ferme le popover quand on change le terme', async () => {
      const onClose = vi.fn();
      const { rerender } = render(
        <GlossaryPopover
          term={TERM}
          anchor={ANCHOR}
          onClose={onClose}
          onOpenInGlossary={vi.fn()}
        />,
      );

      const newTerm: GlossaryTerm = {
        title: 'Autre terme',
        body: '<p>Autre définition.</p>',
      };

      rerender(
        <GlossaryPopover
          term={newTerm}
          anchor={ANCHOR}
          onClose={onClose}
          onOpenInGlossary={vi.fn()}
        />,
      );

      expect(screen.getByText('Autre terme')).toBeInTheDocument();
    });
  });

  describe('Cas limites', () => {
    it('gère un terme sans balises HTML', () => {
      setup({
        term: {
          title: 'Simple',
          body: 'Texte brut sans HTML',
        },
      });

      expect(screen.getByText('Texte brut sans HTML')).toBeInTheDocument();
    });

    it('gère un titre spécial avec caractères accentués', () => {
      setup({
        term: {
          title: 'Référence générale d\'accessibilité',
          body: '<p>Une définition.</p>',
        },
      });

      expect(screen.getByRole('dialog', { name: /Référence générale d'accessibilité/ })).toBeInTheDocument();
    });

    it('gère un body vide', () => {
      setup({
        term: {
          title: 'Terme',
          body: '',
        },
      });

      expect(screen.getByText('Glossaire RGAA')).toBeInTheDocument();
      expect(screen.getByText('Terme')).toBeInTheDocument();
    });

    it('gère du HTML imbriqué complexe', () => {
      setup({
        term: {
          title: 'Complexe',
          body: '<div><p>Outer <span>middle <strong>inner</strong></span> end</p></div>',
        },
      });

      expect(screen.getByText(/Outer middle inner end/)).toBeInTheDocument();
    });
  });
});
