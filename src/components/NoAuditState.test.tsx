import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NoAuditState from './NoAuditState';

function setup(overrides: Partial<React.ComponentProps<typeof NoAuditState>> = {}) {
  const onGoHome = vi.fn();
  const onCreateAudit = vi.fn();

  const { container } = render(
    <NoAuditState
      target="audit"
      hasAudits={false}
      onGoHome={onGoHome}
      onCreateAudit={onCreateAudit}
      {...overrides}
    />,
  );

  return { onGoHome, onCreateAudit, container };
}

describe('NoAuditState', () => {
  // Proposer « choisir un audit » à qui n'en a aucun est une impasse ; proposer
  // d'en créer un à qui en a douze ignore son travail. Les deux cas se
  // distinguent, sur les deux écrans.
  describe('Aucun audit n\'existe', () => {
    it('invite à créer un premier audit depuis la vue Audit', async () => {
      const user = userEvent.setup();
      const { onCreateAudit, onGoHome } = setup({ target: 'audit', hasAudits: false });

      expect(screen.getByRole('heading', { name: /Rien à évaluer/ })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Démarrer un premier audit/ }));

      expect(onCreateAudit).toHaveBeenCalledOnce();
      expect(onGoHome).not.toHaveBeenCalled();
    });

    it('invite à créer un premier audit depuis la vue Synthèse', async () => {
      const user = userEvent.setup();
      const { onCreateAudit } = setup({ target: 'summary', hasAudits: false });

      expect(screen.getByRole('heading', { name: /Pas encore de synthèse/ })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Démarrer un premier audit/ }));

      expect(onCreateAudit).toHaveBeenCalledOnce();
    });
  });

  describe('Des audits existent', () => {
    it('renvoie à l\'accueil depuis la vue Audit', async () => {
      const user = userEvent.setup();
      const { onGoHome, onCreateAudit } = setup({ target: 'audit', hasAudits: true });

      expect(screen.getByRole('heading', { name: /Aucun audit ouvert/ })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Choisir un audit/ }));

      expect(onGoHome).toHaveBeenCalledOnce();
      expect(onCreateAudit).not.toHaveBeenCalled();
    });

    it('renvoie à l\'accueil depuis la vue Synthèse', async () => {
      const user = userEvent.setup();
      const { onGoHome } = setup({ target: 'summary', hasAudits: true });

      expect(screen.getByRole('heading', { name: /Aucun audit ouvert/ })).toBeInTheDocument();
      expect(screen.getByText(/taux de conformité/i)).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /Choisir un audit/ }));

      expect(onGoHome).toHaveBeenCalledOnce();
    });
  });

  describe('Accessibilité', () => {
    it('n\'expose qu\'un seul bouton', () => {
      setup();

      expect(screen.getAllByRole('button')).toHaveLength(1);
    });
  });
});
