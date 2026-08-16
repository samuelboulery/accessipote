import { describe, it, expect } from 'vitest';
import { titleToSlug, extractSlugFromAnchor } from './transformGlossary';

describe('titleToSlug', () => {
  it('devrait convertir un titre simple en slug', () => {
    expect(titleToSlug('Alternative textuelle')).toBe('alternative-textuelle');
  });

  it('devrait supprimer les accents', () => {
    expect(titleToSlug('Élement')).toBe('element');
    expect(titleToSlug('référence')).toBe('reference');
  });

  it('devrait gérer les apostrophes typographiques', () => {
    expect(titleToSlug("Zone (d'une image réactive)")).toBe('zone-d-une-image-reactive');
  });

  it('devrait gérer les apostrophes courbes', () => {
    expect(titleToSlug('d\u2019information')).toBe('d-information');
  });

  it('devrait remplacer les espaces par des tirets', () => {
    expect(titleToSlug('lien accessible')).toBe('lien-accessible');
  });

  it('devrait supprimer les caractères spéciaux', () => {
    expect(titleToSlug('test (parenthèses) & autres')).toBe('test-parentheses-autres');
  });

  it('devrait supprimer les tirets en début et fin', () => {
    expect(titleToSlug('  test  ')).toBe('test');
  });

  it('devrait remplacer les tirets multiples par un seul', () => {
    expect(titleToSlug('test  double  espace')).toBe('test-double-espace');
  });

  it('devrait gérer une chaîne vide', () => {
    expect(titleToSlug('')).toBe('');
  });

  it('devrait mettre en minuscules', () => {
    expect(titleToSlug('MAJUSCULES')).toBe('majuscules');
  });
});

describe('extractSlugFromAnchor', () => {
  it('devrait enlever le # au début', () => {
    expect(extractSlugFromAnchor('#alternative-textuelle')).toBe('alternative-textuelle');
  });

  it('devrait retourner le slug tel quel s\'il n\'y a pas de #', () => {
    expect(extractSlugFromAnchor('alternative-textuelle')).toBe('alternative-textuelle');
  });

  it('devrait retourner une chaîne vide si anchor est vide', () => {
    expect(extractSlugFromAnchor('')).toBe('');
  });

  it('devrait retourner une chaîne vide si anchor est undefined', () => {
    expect(extractSlugFromAnchor(undefined)).toBe('');
  });
});
