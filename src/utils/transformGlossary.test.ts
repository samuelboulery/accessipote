import { describe, it, expect } from 'vitest';
import { titleToSlug, createGlossaryMap, findGlossaryTermBySlug, extractSlugFromAnchor } from './transformGlossary';
import type { GlossaryTerm } from '../types';

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

describe('createGlossaryMap', () => {
  const glossary: GlossaryTerm[] = [
    { title: 'Alternative textuelle', body: '<p>Définition 1</p>' },
    { title: 'Contraste', body: '<p>Définition 2</p>' },
    { title: 'Lien accessible', body: '<p>Définition 3</p>' },
  ];

  it('devrait créer un map à partir d\'un tableau de termes', () => {
    const map = createGlossaryMap(glossary);
    expect(map.size).toBe(3);
    expect(map.has('alternative-textuelle')).toBe(true);
    expect(map.has('contraste')).toBe(true);
    expect(map.has('lien-accessible')).toBe(true);
  });

  it('devrait retourner les bons termes via le slug', () => {
    const map = createGlossaryMap(glossary);
    expect(map.get('contraste')).toEqual({ title: 'Contraste', body: '<p>Définition 2</p>' });
  });

  it('devrait retourner un map vide pour un tableau vide', () => {
    const map = createGlossaryMap([]);
    expect(map.size).toBe(0);
  });
});

describe('findGlossaryTermBySlug', () => {
  const glossary: GlossaryTerm[] = [
    { title: 'Alternative textuelle', body: '<p>Définition</p>' },
  ];

  it('devrait trouver un terme par son slug', () => {
    const map = createGlossaryMap(glossary);
    const term = findGlossaryTermBySlug('alternative-textuelle', map);
    expect(term).toEqual({ title: 'Alternative textuelle', body: '<p>Définition</p>' });
  });

  it('devrait retourner undefined si le slug n\'existe pas', () => {
    const map = createGlossaryMap(glossary);
    const term = findGlossaryTermBySlug('inexistant', map);
    expect(term).toBeUndefined();
  });

  it('devrait retourner undefined pour un map vide', () => {
    const map = new Map<string, GlossaryTerm>();
    const term = findGlossaryTermBySlug('test', map);
    expect(term).toBeUndefined();
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
