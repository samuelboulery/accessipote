import { describe, it, expect } from 'vitest';
import { isAllowed, parseRobots } from './robots.ts';

describe('parseRobots', () => {
  it('ne retient que le groupe qui s’adresse à tout le monde', () => {
    const rules = parseRobots(`
      User-agent: Googlebot
      Disallow: /prive-google

      User-agent: *
      Disallow: /admin
      Allow: /admin/public
    `);

    expect(rules.disallow).toEqual(['/admin']);
    expect(rules.allow).toEqual(['/admin/public']);
  });

  it('ignore les commentaires et les lignes vides', () => {
    const rules = parseRobots('# rien à voir\nUser-agent: *\nDisallow: /tmp # temporaire\n');
    expect(rules.disallow).toEqual(['/tmp']);
  });

  it('rend des règles vides quand le fichier ne dit rien', () => {
    expect(parseRobots('')).toEqual({ allow: [], disallow: [] });
  });
});

describe('isAllowed', () => {
  const rules = parseRobots('User-agent: *\nDisallow: /admin\nAllow: /admin/public\nDisallow: /*.pdf$');

  it('laisse passer ce qu’aucune règle n’interdit', () => {
    expect(isAllowed(rules, '/contact')).toBe(true);
  });

  it('bloque un chemin interdit et sa descendance', () => {
    expect(isAllowed(rules, '/admin')).toBe(false);
    expect(isAllowed(rules, '/admin/utilisateurs')).toBe(false);
  });

  it('fait gagner la règle la plus précise', () => {
    expect(isAllowed(rules, '/admin/public/aide')).toBe(true);
  });

  it('comprend l’étoile et la fin de chaîne', () => {
    expect(isAllowed(rules, '/docs/rapport.pdf')).toBe(false);
    expect(isAllowed(rules, '/docs/rapport.pdf.html')).toBe(true);
  });

  it('laisse tout passer sans règle', () => {
    expect(isAllowed({ allow: [], disallow: [] }, '/admin')).toBe(true);
  });
});
