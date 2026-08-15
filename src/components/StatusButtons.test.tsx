import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatusButtons from './StatusButtons';

function setup(overrides = {}) {
  const onStatusChange = vi.fn();
  const props = {
    criteriaId: '1.1',
    criteriaTitle: 'Image porteuse d\'information',
    mode: 'classic' as const,
    currentStatus: undefined,
    onStatusChange,
    ...overrides,
  };
  render(<StatusButtons {...props} />);
  return { onStatusChange };
}

describe('StatusButtons', () => {
  it('expose un groupe radio nommant le critère', () => {
    setup();
    expect(
      screen.getByRole('radiogroup', { name: /1\.1 — Image porteuse d'information/ }),
    ).toBeInTheDocument();
  });

  it('propose les trois statuts du mode classique', () => {
    setup();
    expect(screen.getByRole('radio', { name: 'Conforme' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Non conforme' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Non applicable' })).toBeInTheDocument();
  });

  it('propose les statuts du mode design system', () => {
    setup({ mode: 'design-system' });
    expect(screen.getByRole('radio', { name: 'Conforme par défaut' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'À mettre en place' })).toBeInTheDocument();
  });

  it('remonte le statut choisi', async () => {
    const user = userEvent.setup();
    const { onStatusChange } = setup();

    await user.click(screen.getByRole('radio', { name: 'Conforme' }));

    expect(onStatusChange).toHaveBeenCalledWith('1.1', 'conforme');
  });

  it('efface le statut au second clic sur celui qui est actif', async () => {
    const user = userEvent.setup();
    const { onStatusChange } = setup({ currentStatus: 'conforme' });

    await user.click(screen.getByRole('radio', { name: 'Conforme' }));

    expect(onStatusChange).toHaveBeenCalledWith('1.1', '');
  });

  it('coche le statut courant', () => {
    setup({ currentStatus: 'non-conforme' });

    expect(screen.getByRole('radio', { name: 'Non conforme' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Conforme' })).not.toBeChecked();
  });

  it('isole les groupes de deux critères différents', () => {
    const { container } = render(
      <>
        <StatusButtons
          criteriaId="1.1"
          criteriaTitle="A"
          mode="classic"
          currentStatus={undefined}
          onStatusChange={vi.fn()}
        />
        <StatusButtons
          criteriaId="1.2"
          criteriaTitle="B"
          mode="classic"
          currentStatus={undefined}
          onStatusChange={vi.fn()}
        />
      </>,
    );

    expect(container.querySelectorAll('input[name="status-1.1"]')).toHaveLength(3);
    expect(container.querySelectorAll('input[name="status-1.2"]')).toHaveLength(3);
  });

  it('empile les boutons en colonne en densité mobile', () => {
    setup({ density: 'mobile' });
    expect(screen.getByRole('radiogroup')).toHaveClass('flex-col');
  });
});
