import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewAuditForm from './NewAuditForm';
import type { NewAuditInput } from '../hooks/useAudits';

const THEMES = [
  'Images',
  'Cadres',
  'Couleurs',
  'Multimédia',
  'Tableaux',
  'Liens',
  'Scripts',
  'Éléments obligatoires',
  'Structuration de l\'information',
  'Présentation de l\'information',
  'Formulaires',
  'Navigation',
  'Consultation',
];

const CRITERIA_COUNT_BY_THEME: Record<string, number> = {
  'Images': 8,
  'Cadres': 6,
  'Couleurs': 3,
  'Multimédia': 4,
  'Tableaux': 5,
  'Liens': 7,
  'Scripts': 8,
  'Éléments obligatoires': 2,
  'Structuration de l\'information': 9,
  'Présentation de l\'information': 6,
  'Formulaires': 11,
  'Navigation': 8,
  'Consultation': 6,
};

const TOTAL_CRITERIA = Object.values(CRITERIA_COUNT_BY_THEME).reduce((sum, count) => sum + count, 0);

function setup(overrides = {}) {
  const onCancel = vi.fn();
  const onSubmit = vi.fn();
  render(
    <NewAuditForm
      themes={THEMES}
      criteriaCountByTheme={CRITERIA_COUNT_BY_THEME}
      onCancel={onCancel}
      onSubmit={onSubmit}
      {...overrides}
    />,
  );
  return { onCancel, onSubmit };
}

describe('NewAuditForm', () => {
  it('affiche le bouton Retour et le titre', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Retour' })).toBeInTheDocument();
    expect(screen.getByText('Nouvel audit')).toBeInTheDocument();
  });

  it('appelle onCancel au clic sur le bouton Retour', async () => {
    const user = userEvent.setup();
    const { onCancel } = setup();

    await user.click(screen.getByRole('button', { name: 'Retour' }));

    expect(onCancel).toHaveBeenCalled();
  });

  it('affiche un champ de saisie pour le nom de l\'audit', () => {
    setup();
    expect(screen.getByLabelText('Nom de l\'audit')).toBeInTheDocument();
  });

  it('désactive le bouton de soumission tant que le nom est vide', () => {
    setup();
    const submitButton = screen.getByRole('button', { name: /Créer l'audit/ });
    expect(submitButton).toBeDisabled();
  });

  it('active le bouton de soumission quand un nom non vide est saisi', async () => {
    const user = userEvent.setup();
    setup();

    const nameInput = screen.getByLabelText('Nom de l\'audit');
    await user.type(nameInput, 'Mon nouvel audit');

    const submitButton = screen.getByRole('button', { name: /Créer l'audit/ });
    expect(submitButton).not.toBeDisabled();
  });

  it('affiche l\'erreur à la sortie du champ (blur), pas à la soumission', async () => {
    const user = userEvent.setup();
    setup();

    const nameInput = screen.getByLabelText('Nom de l\'audit');
    await user.click(nameInput);
    await user.keyboard('{Escape}');
    await user.tab();

    expect(screen.getByText('Le nom de l\'audit est requis.')).toBeInTheDocument();
  });

  it('lie le champ de nom au message d\'erreur via aria-describedby', async () => {
    const user = userEvent.setup();
    setup();

    const nameInput = screen.getByLabelText('Nom de l\'audit') as HTMLInputElement;
    await user.click(nameInput);
    await user.tab();

    expect(nameInput).toHaveAttribute('aria-describedby', 'audit-name-error');
  });

  it('lie le champ de nom au message d\'aide quand il n\'y a pas d\'erreur', () => {
    setup();
    const nameInput = screen.getByLabelText('Nom de l\'audit') as HTMLInputElement;
    expect(nameInput).toHaveAttribute('aria-describedby', 'audit-name-help');
  });

  it('marque le champ comme invalide lors d\'une erreur de validation', async () => {
    const user = userEvent.setup();
    setup();

    const nameInput = screen.getByLabelText('Nom de l\'audit') as HTMLInputElement;
    await user.click(nameInput);
    await user.tab();

    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
  });

  it('affiche le message d\'aide du nom dans un élément avec rôle alert', async () => {
    const user = userEvent.setup();
    setup();

    const nameInput = screen.getByLabelText('Nom de l\'audit');
    await user.click(nameInput);
    await user.tab();

    const errorElement = screen.getByRole('alert');
    expect(errorElement).toHaveTextContent('Le nom de l\'audit est requis.');
  });

  it('affiche le champ périmètre marqué comme optionnel', () => {
    setup();
    const scopeLabel = screen.getByText('Périmètre');
    expect(scopeLabel.parentElement).toHaveTextContent('— optionnel');
  });

  it('affiche le champ périmètre de type url', () => {
    setup();
    const scopeInput = screen.getByPlaceholderText('https://www.exemple.fr');
    expect(scopeInput).toHaveAttribute('type', 'url');
  });

  it('affiche un fieldset/legend pour le mode de vérification', () => {
    setup();
    const legend = screen.getByText('Mode de vérification');
    expect(legend.tagName).toBe('LEGEND');
    const fieldset = legend.closest('fieldset');
    expect(fieldset).toBeInTheDocument();
  });

  it('affiche les deux options de mode: Classique et Design system', () => {
    setup();
    expect(screen.getByLabelText(/Classique/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Design system/)).toBeInTheDocument();
  });

  it('sélectionne le mode classique par défaut', () => {
    setup();
    const classicInput = screen.getByRole('radio', { name: /Classique/ });
    expect(classicInput).toBeChecked();
  });

  it('permet de sélectionner le mode design system', async () => {
    const user = userEvent.setup();
    setup();

    const designSystemInput = screen.getByRole('radio', { name: /Design system/ });
    await user.click(designSystemInput);

    expect(designSystemInput).toBeChecked();
  });

  it('affiche un fieldset/legend pour les thèmes à auditer', () => {
    setup();
    const legend = screen.getByText('Thèmes à auditer');
    expect(legend.tagName).toBe('LEGEND');
    const fieldset = legend.closest('fieldset');
    expect(fieldset).toBeInTheDocument();
  });

  it('affiche une case à cocher par thème', () => {
    setup();
    for (const theme of THEMES) {
      expect(screen.getByLabelText(new RegExp(theme))).toBeInTheDocument();
    }
  });

  it('affiche le compteur « n / 13 · N critères » quand aucun thème n\'est coché', () => {
    setup();
    expect(screen.getByText(`13 / 13 · ${TOTAL_CRITERIA} critères`)).toBeInTheDocument();
  });

  it('met à jour le compteur quand des thèmes sont sélectionnés', async () => {
    const user = userEvent.setup();
    setup();

    // Sélectionner 2 thèmes
    await user.click(screen.getByLabelText(/Images/));
    await user.click(screen.getByLabelText(/Cadres/));

    const expectedCriteria = CRITERIA_COUNT_BY_THEME['Images'] + CRITERIA_COUNT_BY_THEME['Cadres'];
    expect(screen.getByText(`2 / 13 · ${expectedCriteria} critères`)).toBeInTheDocument();
  });

  it('permet de cocher une case à thème', async () => {
    const user = userEvent.setup();
    setup();

    const imagesCheckbox = screen.getByRole('checkbox', { name: /Images/ });
    await user.click(imagesCheckbox);

    expect(imagesCheckbox).toBeChecked();
  });

  it('affiche une coche visuelle quand un thème est sélectionné', async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByLabelText(/Images/));

    // Chercher la coche (Check icon) en tant que child du label Images
    const imagesLabel = screen.getByLabelText(/Images/).closest('label');
    const checkIcon = imagesLabel?.querySelector('[aria-hidden="true"]');
    expect(checkIcon).toBeInTheDocument();
  });

  it('note que « aucun thème coché signifie tous les thèmes »', () => {
    setup();
    expect(screen.getByText(/Aucun thème coché signifie/)).toBeInTheDocument();
  });

  it('appelle onSubmit avec le nom trimé en absence d\'erreur', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();

    const nameInput = screen.getByLabelText('Nom de l\'audit');
    await user.type(nameInput, '  Mon audit  ');

    const submitButton = screen.getByRole('button', { name: /Créer l'audit/ });
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Mon audit',
      }),
    );
  });

  it('passe le mode sélectionné à onSubmit', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();

    await user.click(screen.getByRole('radio', { name: /Design system/ }));

    const nameInput = screen.getByLabelText('Nom de l\'audit');
    await user.type(nameInput, 'Mon audit');

    const submitButton = screen.getByRole('button', { name: /Créer l'audit/ });
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'design-system',
      }),
    );
  });

  it('passe les thèmes sélectionnés à onSubmit', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();

    await user.click(screen.getByLabelText(/Images/));
    await user.click(screen.getByLabelText(/Cadres/));

    const nameInput = screen.getByLabelText('Nom de l\'audit');
    await user.type(nameInput, 'Mon audit');

    const submitButton = screen.getByRole('button', { name: /Créer l'audit/ });
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        themes: expect.arrayContaining(['Images', 'Cadres']),
      }),
    );
  });

  it('passe un tableau vide de thèmes à onSubmit quand aucun n\'est sélectionné', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();

    const nameInput = screen.getByLabelText('Nom de l\'audit');
    await user.type(nameInput, 'Mon audit');

    const submitButton = screen.getByRole('button', { name: /Créer l'audit/ });
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        themes: [],
      }),
    );
  });

  it('passe le périmètre trimé en undefined quand vide', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();

    const nameInput = screen.getByLabelText('Nom de l\'audit');
    await user.type(nameInput, 'Mon audit');

    const submitButton = screen.getByRole('button', { name: /Créer l'audit/ });
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: undefined,
      }),
    );
  });

  it('passe le périmètre trimé à onSubmit', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();

    const nameInput = screen.getByLabelText('Nom de l\'audit');
    await user.type(nameInput, 'Mon audit');

    const scopeInput = screen.getByPlaceholderText('https://www.exemple.fr');
    await user.type(scopeInput, '  https://www.example.com  ');

    const submitButton = screen.getByRole('button', { name: /Créer l'audit/ });
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        scope: 'https://www.example.com',
      }),
    );
  });

  it('ne soumet pas le formulaire si le nom est vide', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();

    const submitButton = screen.getByRole('button', { name: /Créer l'audit/ });
    await user.click(submitButton);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('transmet une charge utile complète à onSubmit', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();

    const nameInput = screen.getByLabelText('Nom de l\'audit');
    await user.type(nameInput, 'Mon audit');

    const scopeInput = screen.getByPlaceholderText('https://www.exemple.fr');
    await user.type(scopeInput, 'https://example.com');

    await user.click(screen.getByRole('radio', { name: /Design system/ }));
    await user.click(screen.getByLabelText(/Images/));

    const submitButton = screen.getByRole('button', { name: /Créer l'audit/ });
    await user.click(submitButton);

    const expectedInput: NewAuditInput = {
      name: 'Mon audit',
      scope: 'https://example.com',
      mode: 'design-system',
      themes: ['Images'],
    };
    expect(onSubmit).toHaveBeenCalledWith(expectedInput);
  });
});
