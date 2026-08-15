import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CriteriaDetail from './CriteriaDetail';
import type { CriteriaRGAA } from '../types';

const CRITERIA: CriteriaRGAA = {
  id: '1.1',
  title: 'Images : Alternatives textuelles',
  url: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
  theme: 'Images',
  level: 'A',
  tests: [
    {
      id: '1.1a',
      questions: ['Question 1 du test'],
    },
    {
      id: '1.1b',
      questions: ['Question 2 du test', 'Deuxième ligne'],
    },
  ],
};

const PREVIOUS: CriteriaRGAA = {
  id: '1.0',
  title: 'Images précédentes',
  url: 'https://exemple.fr',
  theme: 'Images',
  level: 'A',
};

const NEXT: CriteriaRGAA = {
  id: '1.2',
  title: 'Images suivantes',
  url: 'https://exemple.fr',
  theme: 'Images',
  level: 'AA',
};

function setup(overrides = {}) {
  const onStatusChange = vi.fn();
  const onCheckedTestsChange = vi.fn();
  const onNoteChange = vi.fn();
  const onPagesChange = vi.fn();
  const onGlossaryClick = vi.fn();
  const onNavigate = vi.fn();

  render(
    <CriteriaDetail
      criterion={CRITERIA}
      mode="classic"
      currentStatus="conforme"
      checkedTests={[]}
      note=""
      pages={[]}
      previous={PREVIOUS}
      next={NEXT}
      onStatusChange={onStatusChange}
      onCheckedTestsChange={onCheckedTestsChange}
      onNoteChange={onNoteChange}
      onPagesChange={onPagesChange}
      onGlossaryClick={onGlossaryClick}
      onNavigate={onNavigate}
      {...overrides}
    />,
  );

  return {
    onStatusChange,
    onCheckedTestsChange,
    onNoteChange,
    onPagesChange,
    onGlossaryClick,
    onNavigate,
  };
}

describe('CriteriaDetail', () => {
  describe('Tests cochables', () => {
    it('affiche tous les tests avec leur nombre', () => {
      setup();
      expect(screen.getByText('Tests · 2')).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /Question 1 du test/ })).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /Question 2 du test/ })).toBeInTheDocument();
    });

    it('met à jour le compteur de tests cochés', async () => {
      const user = userEvent.setup();
      const { onCheckedTestsChange } = setup();

      const checkbox = screen.getAllByRole('checkbox')[0];
      await user.click(checkbox);

      expect(onCheckedTestsChange).toHaveBeenCalledWith('1.1', ['1.1a']);
    });

    it('affiche les tests déjà cochés', () => {
      setup({ checkedTests: ['1.1a'] });

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });

    it('remonte tous les ids cochés après décocher un test', async () => {
      const user = userEvent.setup();
      const { onCheckedTestsChange } = setup({ checkedTests: ['1.1a', '1.1b'] });

      const checkbox = screen.getAllByRole('checkbox')[0];
      await user.click(checkbox);

      expect(onCheckedTestsChange).toHaveBeenCalledWith('1.1', ['1.1b']);
    });

    it('affiche le compte rendu « n / N cochés »', () => {
      setup({ checkedTests: ['1.1b'] });

      expect(screen.getByText('1 / 2 cochés')).toBeInTheDocument();
    });
  });

  describe('Note d\'audit', () => {
    it('affiche la note actuelle dans le champ', () => {
      setup({ note: 'Conforme sur toutes les pages' });

      const textarea = screen.getByLabelText('Note d\'audit');
      expect(textarea).toHaveValue('Conforme sur toutes les pages');
    });

    it('remonte la note au blur du champ', async () => {
      const user = userEvent.setup();
      const { onNoteChange } = setup({ note: '' });

      const textarea = screen.getByLabelText('Note d\'audit');
      await user.type(textarea, 'Nouvelle note');
      await user.click(document.body);

      expect(onNoteChange).toHaveBeenCalledWith('1.1', 'Nouvelle note');
    });

    it('ne remonte pas la note si elle n\'a pas changé', async () => {
      const user = userEvent.setup();
      const { onNoteChange } = setup({ note: 'Même note' });

      const textarea = screen.getByLabelText('Note d\'audit');
      await user.click(textarea);
      await user.click(document.body);

      expect(onNoteChange).not.toHaveBeenCalled();
    });

    it('met à jour l\'affichage à la réception d\'une nouvelle note', async () => {
      const { rerender } = render(
        <CriteriaDetail
          criterion={CRITERIA}
          mode="classic"
          currentStatus="conforme"
          checkedTests={[]}
          note="Ancienne note"
          pages={[]}
          onStatusChange={vi.fn()}
          onCheckedTestsChange={vi.fn()}
          onNoteChange={vi.fn()}
          onPagesChange={vi.fn()}
          onGlossaryClick={vi.fn()}
          onNavigate={vi.fn()}
        />,
      );

      let textarea = screen.getByLabelText('Note d\'audit') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Ancienne note');

      rerender(
        <CriteriaDetail
          criterion={CRITERIA}
          mode="classic"
          currentStatus="conforme"
          checkedTests={[]}
          note="Nouvelle note"
          pages={[]}
          onStatusChange={vi.fn()}
          onCheckedTestsChange={vi.fn()}
          onNoteChange={vi.fn()}
          onPagesChange={vi.fn()}
          onGlossaryClick={vi.fn()}
          onNavigate={vi.fn()}
        />,
      );

      textarea = screen.getByLabelText('Note d\'audit') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Nouvelle note');
    });
  });

  describe('Pages concernées', () => {
    it('affiche toutes les pages avec un lien externe', () => {
      setup({
        pages: ['https://exemple.fr/page1', 'https://exemple.fr/page2'],
      });

      const links = screen.getAllByRole('link') as HTMLAnchorElement[];
      expect(links.some(link => link.href === 'https://exemple.fr/page1')).toBe(true);
      expect(links.some(link => link.href === 'https://exemple.fr/page2')).toBe(true);
    });

    it('ajoute une page via le bouton', async () => {
      const user = userEvent.setup();
      const { onPagesChange } = setup({ pages: [] });

      const input = screen.getByLabelText('Adresse de la page à ajouter');
      await user.type(input, 'https://exemple.fr/page1');
      await user.click(screen.getByRole('button', { name: 'Ajouter' }));

      expect(onPagesChange).toHaveBeenCalledWith('1.1', ['https://exemple.fr/page1']);
    });

    it('ajoute une page via la touche Entrée', async () => {
      const user = userEvent.setup();
      const { onPagesChange } = setup({ pages: [] });

      const input = screen.getByLabelText('Adresse de la page à ajouter');
      await user.type(input, 'https://exemple.fr/page1{Enter}');

      expect(onPagesChange).toHaveBeenCalledWith('1.1', ['https://exemple.fr/page1']);
    });

    it('refuse d\'ajouter une page vide', async () => {
      const user = userEvent.setup();
      const { onPagesChange } = setup({ pages: [] });

      await user.click(screen.getByRole('button', { name: 'Ajouter' }));

      expect(onPagesChange).not.toHaveBeenCalled();
    });

    it('refuse d\'ajouter un doublon de page', async () => {
      const user = userEvent.setup();
      const { onPagesChange } = setup({ pages: ['https://exemple.fr/page1'] });

      const input = screen.getByLabelText('Adresse de la page à ajouter');
      await user.type(input, 'https://exemple.fr/page1');
      await user.click(screen.getByRole('button', { name: 'Ajouter' }));

      expect(onPagesChange).not.toHaveBeenCalled();
    });

    it('vide le champ de saisie après ajout', async () => {
      const user = userEvent.setup();
      setup({ pages: [] });

      const input = screen.getByLabelText('Adresse de la page à ajouter') as HTMLInputElement;
      await user.type(input, 'https://exemple.fr/page1');
      await user.click(screen.getByRole('button', { name: 'Ajouter' }));

      expect(input.value).toBe('');
    });

    it('supprime une page avec aria-label', async () => {
      const user = userEvent.setup();
      const { onPagesChange } = setup({
        pages: ['https://exemple.fr/page1', 'https://exemple.fr/page2'],
      });

      await user.click(
        screen.getByRole('button', { name: 'Retirer la page https://exemple.fr/page1' }),
      );

      expect(onPagesChange).toHaveBeenCalledWith('1.1', ['https://exemple.fr/page2']);
    });

    it('supprime la seule page listée', async () => {
      const user = userEvent.setup();
      const { onPagesChange } = setup({ pages: ['https://exemple.fr/page1'] });

      await user.click(
        screen.getByRole('button', { name: 'Retirer la page https://exemple.fr/page1' }),
      );

      expect(onPagesChange).toHaveBeenCalledWith('1.1', []);
    });
  });

  describe('Navigation par flèches', () => {
    it('affiche le bouton précédent avec ID et titre du critère', () => {
      setup();

      const button = screen.getByRole('button', { name: /1.0.*Images précédentes/ });
      expect(button).toBeInTheDocument();
    });

    it('affiche le bouton suivant avec ID et titre du critère', () => {
      setup();

      const button = screen.getByRole('button', { name: /1.2.*Images suivantes/ });
      expect(button).toBeInTheDocument();
    });

    it('navigue au clic sur le bouton précédent', async () => {
      const user = userEvent.setup();
      const { onNavigate } = setup();

      await user.click(screen.getByRole('button', { name: /1.0.*Images précédentes/ }));

      expect(onNavigate).toHaveBeenCalledWith('1.0');
    });

    it('navigue au clic sur le bouton suivant', async () => {
      const user = userEvent.setup();
      const { onNavigate } = setup();

      await user.click(screen.getByRole('button', { name: /1.2.*Images suivantes/ }));

      expect(onNavigate).toHaveBeenCalledWith('1.2');
    });

    it('masque le bouton précédent quand on est au premier critère', () => {
      setup({ previous: undefined });

      expect(screen.queryByRole('button', { name: /1.0/ })).not.toBeInTheDocument();
    });

    it('masque le bouton suivant quand on est au dernier critère', () => {
      setup({ next: undefined });

      expect(screen.queryByRole('button', { name: /1.2/ })).not.toBeInTheDocument();
    });
  });

  describe('Raccourcis clavier', () => {
    it('navigue au critère suivant avec la touche J', async () => {
      const user = userEvent.setup();
      const { onNavigate } = setup();

      await user.keyboard('j');

      expect(onNavigate).toHaveBeenCalledWith('1.2');
    });

    it('navigue au critère précédent avec la touche K', async () => {
      const user = userEvent.setup();
      const { onNavigate } = setup();

      await user.keyboard('k');

      expect(onNavigate).toHaveBeenCalledWith('1.0');
    });

    it('définit le statut avec la touche 1, 2 ou 3', async () => {
      const user = userEvent.setup();
      const { onStatusChange } = setup({ currentStatus: undefined });

      await user.keyboard('1');

      expect(onStatusChange).toHaveBeenCalledWith('1.1', 'conforme');
    });

    it('efface le statut en appuyant deux fois sur la même touche', async () => {
      const user = userEvent.setup();
      const { onStatusChange } = setup({ currentStatus: 'conforme' });

      await user.keyboard('1');

      expect(onStatusChange).toHaveBeenCalledWith('1.1', '');
    });

    it('ignore J si le focus est dans un champ', async () => {
      const user = userEvent.setup();
      const { onNavigate } = setup({ note: '' });

      const textarea = screen.getByLabelText('Note d\'audit');
      await user.click(textarea);
      await user.keyboard('j');

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('ignore les raccourcis si Ctrl est appuyé', async () => {
      const { onNavigate } = setup();

      const event = new KeyboardEvent('keydown', {
        key: 'j',
        ctrlKey: true,
      });

      window.dispatchEvent(event);

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('ignore les raccourcis si Cmd est appuyé', async () => {
      const { onNavigate } = setup();

      const event = new KeyboardEvent('keydown', {
        key: 'j',
        metaKey: true,
      });

      window.dispatchEvent(event);

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('ignore les raccourcis si Alt est appuyé', async () => {
      const { onNavigate } = setup();

      const event = new KeyboardEvent('keydown', {
        key: 'j',
        altKey: true,
      });

      window.dispatchEvent(event);

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('ignore K si le focus est dans un input', async () => {
      const user = userEvent.setup();
      const { onNavigate } = setup();

      const input = screen.getByLabelText('Adresse de la page à ajouter');
      await user.click(input);
      await user.keyboard('k');

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('ignore 1 si le focus est dans une select', async () => {
      const user = userEvent.setup();
      const { onStatusChange } = setup({ currentStatus: undefined });

      const input = screen.getByLabelText('Adresse de la page à ajouter');
      await user.click(input);
      await user.keyboard('1');

      expect(onStatusChange).not.toHaveBeenCalled();
    });
  });

  describe('Affichage du texte d\'aide', () => {
    it('affiche les instructions de raccourcis', () => {
      setup();

      expect(screen.getByText('1 2 3 pour statuer · J / K pour naviguer')).toBeInTheDocument();
    });
  });

  describe('Couverture des cas limites', () => {
    it('gère un critère sans tests', () => {
      setup({ criterion: { ...CRITERIA, tests: undefined } });

      expect(screen.getByText('Tests · 0')).toBeInTheDocument();
      expect(screen.getByText('0 / 0 cochés')).toBeInTheDocument();
    });

    it('gère aucune page ajoutée', () => {
      setup({ pages: [] });

      expect(screen.queryByRole('button', { name: /Retirer la page/ })).not.toBeInTheDocument();
    });

    it('ignore un clic sur bouton précédent quand previous est undefined', async () => {
      const user = userEvent.setup();
      const { onNavigate } = setup({ previous: undefined });

      await user.keyboard('k');

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('ignore un clic sur bouton suivant quand next est undefined', async () => {
      const user = userEvent.setup();
      const { onNavigate } = setup({ next: undefined });

      await user.keyboard('j');

      expect(onNavigate).not.toHaveBeenCalled();
    });

    it('affiche le statut en mode design-system', () => {
      setup({ mode: 'design-system' });

      expect(screen.getByText(/1 2 3 pour statuer/)).toBeInTheDocument();
    });

    it('gère un changement d\'ID du critère en synchronisant la note', async () => {
      const { rerender } = render(
        <CriteriaDetail
          criterion={CRITERIA}
          mode="classic"
          currentStatus="conforme"
          checkedTests={[]}
          note="Note critère 1.1"
          pages={[]}
          onStatusChange={vi.fn()}
          onCheckedTestsChange={vi.fn()}
          onNoteChange={vi.fn()}
          onPagesChange={vi.fn()}
          onGlossaryClick={vi.fn()}
          onNavigate={vi.fn()}
        />,
      );

      let textarea = screen.getByLabelText('Note d\'audit') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Note critère 1.1');

      const newCriteria: CriteriaRGAA = {
        ...CRITERIA,
        id: '1.2',
        title: 'Autre critère',
      };

      rerender(
        <CriteriaDetail
          criterion={newCriteria}
          mode="classic"
          currentStatus="conforme"
          checkedTests={[]}
          note="Note critère 1.2"
          pages={[]}
          onStatusChange={vi.fn()}
          onCheckedTestsChange={vi.fn()}
          onNoteChange={vi.fn()}
          onPagesChange={vi.fn()}
          onGlossaryClick={vi.fn()}
          onNavigate={vi.fn()}
        />,
      );

      textarea = screen.getByLabelText('Note d\'audit') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Note critère 1.2');
    });
  });
});
