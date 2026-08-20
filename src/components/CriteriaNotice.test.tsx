import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlertTriangle } from 'lucide-react';
import CriteriaNotice from './CriteriaNotice';
import type { RichTextBlock } from '../types';

function setup(blocks: RichTextBlock[]) {
  const onGlossaryClick = vi.fn();
  const { container } = render(
    <CriteriaNotice
      title="Cas particuliers"
      icon={AlertTriangle}
      blocks={blocks}
      onGlossaryClick={onGlossaryClick}
    />,
  );
  return { onGlossaryClick, container };
}

describe('CriteriaNotice', () => {
  it("ne rend rien quand il n'y a aucun bloc", () => {
    const { container } = setup([]);

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('Cas particuliers')).not.toBeInTheDocument();
  });

  it('affiche le titre de la section quand il y a un bloc', () => {
    setup(['Font exception à ce critère les contenus non personnalisables.']);

    expect(
      screen.getByRole('heading', { name: /Cas particuliers/ }),
    ).toBeInTheDocument();
  });

  it('rend une chaîne en paragraphe', () => {
    setup(['Font exception à ce critère les contenus non personnalisables.']);

    expect(
      screen.getByText(/Font exception à ce critère/),
    ).toBeInTheDocument();
  });

  it('rend un bloc { ul } en liste, jamais en [object Object]', () => {
    const { container } = setup([
      { ul: ['- Les sous-titres incrustés dans une vidéo ;', '- Les textes en image ;'] },
    ]);

    const items = container.querySelectorAll('ul li');
    expect(items).toHaveLength(2);
    expect(container.textContent).not.toContain('[object Object]');
  });

  it('retire le tiret de tête des entrées de liste', () => {
    const { container } = setup([{ ul: ['- Les textes en image ;'] }]);

    const item = container.querySelector('ul li');
    expect(item?.textContent).toBe('Les textes en image ;');
  });

  it('mêle paragraphes et listes dans leur ordre de déclaration', () => {
    const { container } = setup([
      'Font exception à ce critère :',
      { ul: ['- Les textes en image ;'] },
      'Note complémentaire.',
    ]);

    expect(container.querySelectorAll('p')).toHaveLength(2);
    expect(container.querySelectorAll('ul li')).toHaveLength(1);
  });

  it('rend le code entre accents graves dans une balise code', () => {
    const { container } = setup(['Le texte au sein d’une balise `<canvas>`.']);

    const code = container.querySelector('code');
    expect(code?.textContent).toBe('<canvas>');
  });

  it('rend le code entre accents graves dans une entrée de liste', () => {
    const { container } = setup([{ ul: ['- Le texte au sein d’une balise `<canvas>`.'] }]);

    expect(container.querySelector('ul li code')?.textContent).toBe('<canvas>');
  });

  it('ouvre le glossaire au clic sur un lien markdown', async () => {
    const user = userEvent.setup();
    const { onGlossaryClick } = setup([
      "Lorsqu'une image est associée à une [légende](#legende-d-image), le critère change.",
    ]);

    await user.click(screen.getByRole('button', { name: /légende/ }));

    expect(onGlossaryClick).toHaveBeenCalledWith('legende-d-image');
  });

  it('ouvre le glossaire au clic sur un lien situé dans une liste', async () => {
    const user = userEvent.setup();
    const { onGlossaryClick } = setup([
      { ul: ['- Les [CAPTCHA](#captcha) ;'] },
    ]);

    await user.click(screen.getByRole('button', { name: /CAPTCHA/ }));

    expect(onGlossaryClick).toHaveBeenCalledWith('captcha');
  });
});
