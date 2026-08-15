import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BulkActions from './BulkActions';

function setup(overrides = {}) {
  const onApply = vi.fn();
  const onClearStatus = vi.fn();
  const onDeselectAll = vi.fn();

  render(
    <BulkActions
      selectedCount={12}
      mode="classic"
      onApply={onApply}
      onClearStatus={onClearStatus}
      onDeselectAll={onDeselectAll}
      {...overrides}
    />,
  );

  return { onApply, onClearStatus, onDeselectAll };
}

describe('BulkActions', () => {
  it('reste invisible tant que rien n\'est sélectionné', () => {
    setup({ selectedCount: 0 });
    expect(screen.queryByRole('region', { name: 'Actions groupées' })).not.toBeInTheDocument();
  });

  it('annonce le cardinal de la sélection', () => {
    setup();
    expect(screen.getByText('12 critères sélectionnés')).toBeInTheDocument();
  });

  it('accorde le cardinal au singulier', () => {
    setup({ selectedCount: 1 });
    expect(screen.getByText('1 critère sélectionné')).toBeInTheDocument();
  });

  it('propose les trois statuts du mode et l\'effacement', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Conforme' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Non conforme' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Non applicable' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Effacer le statut' })).toBeInTheDocument();
  });

  it('propose les statuts du mode design system', () => {
    setup({ mode: 'design-system' });
    expect(screen.getByRole('button', { name: 'Conforme par défaut' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'À mettre en place' })).toBeInTheDocument();
  });

  it('applique le statut choisi', async () => {
    const user = userEvent.setup();
    const { onApply } = setup();

    await user.click(screen.getByRole('button', { name: 'Non conforme' }));

    expect(onApply).toHaveBeenCalledWith('non-conforme');
  });

  it('efface le statut de la sélection', async () => {
    const user = userEvent.setup();
    const { onClearStatus } = setup();

    await user.click(screen.getByRole('button', { name: 'Effacer le statut' }));

    expect(onClearStatus).toHaveBeenCalled();
  });

  it('permet de tout désélectionner', async () => {
    const user = userEvent.setup();
    const { onDeselectAll } = setup();

    await user.click(screen.getByRole('button', { name: 'Tout désélectionner' }));

    expect(onDeselectAll).toHaveBeenCalled();
  });

  it('expose la barre comme une région nommée', () => {
    setup();
    expect(screen.getByRole('region', { name: 'Actions groupées' })).toBeInTheDocument();
  });

  it('double chaque statut d\'une icône, jamais la couleur seule', () => {
    setup();
    const conforme = screen.getByRole('button', { name: 'Conforme' });
    expect(conforme.querySelector('svg')).toBeInTheDocument();
  });
});
