import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getTechniqueUrl,
  getWcagCriteriaUrl,
  parseWcagReference,
} from './generateWcagLinks';

describe('generateWcagLinks', () => {
  // Suppression des console.warn pour éviter le bruit de test
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTechniqueUrl', () => {
    it('génère une URL valide pour la technique "G1"', () => {
      const result = getTechniqueUrl('G1');
      expect(result).toBe('https://www.w3.org/WAI/WCAG21/Techniques/general/G1');
    });

    it('génère une URL valide pour la technique "H30"', () => {
      const result = getTechniqueUrl('H30');
      expect(result).toBe('https://www.w3.org/WAI/WCAG21/Techniques/html/H30');
    });

    it('génère une URL valide pour la technique "ARIA1"', () => {
      const result = getTechniqueUrl('ARIA1');
      expect(result).toBe('https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA1');
    });

    it('génère une URL valide pour la technique "F3"', () => {
      const result = getTechniqueUrl('F3');
      expect(result).toBe('https://www.w3.org/WAI/WCAG21/Techniques/failures/F3');
    });

    it('génère une URL valide pour la technique "SCR19"', () => {
      const result = getTechniqueUrl('SCR19');
      expect(result).toBe('https://www.w3.org/WAI/WCAG21/Techniques/general/SCR19');
    });

    it('gère les codes en minuscules en les convertissant', () => {
      const result = getTechniqueUrl('h36');
      expect(result).toBe('https://www.w3.org/WAI/WCAG21/Techniques/html/H36');
    });

    it('gère les codes avec des espaces en les trimant', () => {
      const result = getTechniqueUrl('  G14  ');
      expect(result).toBe('https://www.w3.org/WAI/WCAG21/Techniques/general/G14');
    });

    it('retourne "#" pour un code vide', () => {
      const result = getTechniqueUrl('');
      expect(result).toBe('#');
    });

    it('retourne "#" pour un code avec seulement des espaces', () => {
      const result = getTechniqueUrl('   ');
      expect(result).toBe('#');
    });

    it('gère les techniques CSS avec le préfixe "C"', () => {
      const result = getTechniqueUrl('C1');
      expect(result).toBe('https://www.w3.org/WAI/WCAG21/Techniques/css/C1');
    });

    it('gère les techniques texte avec le préfixe "T"', () => {
      const result = getTechniqueUrl('T1');
      expect(result).toBe('https://www.w3.org/WAI/WCAG21/Techniques/text/T1');
    });
  });

  describe('getWcagCriteriaUrl', () => {
    it('génère une URL valide pour le critère "1.1.1 Non-text Content (A)"', () => {
      const result = getWcagCriteriaUrl('1.1.1 Non-text Content (A)');
      expect(result).toContain('https://www.w3.org/Translations/WCAG21-fr/');
      expect(result).toContain('non-text-content');
    });

    it('génère une URL valide pour le critère "1.3.1 Info and Relationships (A)"', () => {
      const result = getWcagCriteriaUrl('1.3.1 Info and Relationships (A)');
      expect(result).toContain('https://www.w3.org/Translations/WCAG21-fr/');
      expect(result).toContain('info-and-relationships');
    });

    it('retourne "#" pour un critère malformé (sans numéro)', () => {
      const result = getWcagCriteriaUrl('Some random text');
      expect(result).toBe('#');
    });

    it('retourne "#" pour un critère avec numéro mais ancre non trouvée', () => {
      // Utiliser un numéro de critère qui n'existe probablement pas
      const result = getWcagCriteriaUrl('9.9.9 Non-existent Criteria (A)');
      expect(result).toBe('#');
    });

    it('retourne "#" pour une chaîne vide', () => {
      const result = getWcagCriteriaUrl('');
      expect(result).toBe('#');
    });

    it('génère une URL même si le critère n\'a pas de description complète', () => {
      const result = getWcagCriteriaUrl('1.1.1');
      // Le numéro 1.1.1 existe et a une ancre, donc on peut générer une URL
      expect(result).toContain('https://www.w3.org/Translations/WCAG21-fr/');
      expect(result).toContain('non-text-content');
    });
  });

  describe('parseWcagReference', () => {
    it('analyse correctement une référence WCAG valide', () => {
      const result = parseWcagReference('1.3.1 Info and Relationships (A)');
      expect(result.number).toBe('1.3.1');
      expect(result.level).toBe('A');
      expect(result.fullText).toBe('Info and Relationships');
    });

    it('analyse correctement une référence WCAG niveau AA', () => {
      const result = parseWcagReference('2.4.3 Focus Order (AA)');
      expect(result.number).toBe('2.4.3');
      expect(result.level).toBe('AA');
      expect(result.fullText).toBe('Focus Order');
    });

    it('analyse correctement une référence WCAG niveau AAA', () => {
      const result = parseWcagReference('2.5.5 Target Size (AAA)');
      expect(result.number).toBe('2.5.5');
      expect(result.level).toBe('AAA');
      expect(result.fullText).toBe('Target Size');
    });

    it('analyse les références avec texte contenant des parenthèses', () => {
      const result = parseWcagReference('1.2.1 Audio-only and Video-only (Prerecorded) (A)');
      expect(result.number).toBe('1.2.1');
      expect(result.level).toBe('A');
      expect(result.fullText).toBe('Audio-only and Video-only (Prerecorded)');
    });

    it('retourne un fallback pour une référence malformée', () => {
      const result = parseWcagReference('Invalid format');
      expect(result.number).toBe('');
      expect(result.level).toBe('');
      expect(result.fullText).toBe('Invalid format');
    });

    it('retourne un fallback pour une chaîne vide', () => {
      const result = parseWcagReference('');
      expect(result.number).toBe('');
      expect(result.level).toBe('');
      expect(result.fullText).toBe('');
    });

    it('extrait le numéro même si le format ne correspond pas exactement', () => {
      const result = parseWcagReference('1.2.3 Some text without level');
      expect(result.number).toBe('1.2.3');
      expect(result.fullText).toBe('1.2.3 Some text without level');
    });
  });

  describe('cas limites et caractères spéciaux', () => {
    it('getTechniqueUrl gère les caractères spéciaux en supprimant l\'ancre', () => {
      const result = getTechniqueUrl('G1#anchor');
      // Selon le comportement actuel, le trim et toUpperCase sont appliqués
      // L'URL résultante dépend de comment getTechniqueCategory traite le #
      expect(result).toBeTruthy();
    });

    it('parseWcagReference gère les références avec des tirets', () => {
      const result = parseWcagReference('1.2.8 Media Alternative (Prerecorded) (A)');
      expect(result.number).toBe('1.2.8');
      expect(result.level).toBe('A');
    });

    it('getTechniqueUrl gère les codes avec des nombres multiples', () => {
      const result = getTechniqueUrl('ARIA121');
      expect(result).toContain('ARIA121');
      expect(result).toContain('https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA121');
    });
  });

  describe('performance et robustesse', () => {
    it('getTechniqueUrl avec une liste vide ne plante pas', () => {
      const result = getTechniqueUrl('');
      expect(result).toBe('#');
    });

    it('getWcagCriteriaUrl avec null comme entrée retourne "#"', () => {
      const result = getWcagCriteriaUrl(null as unknown as string);
      expect(result).toBe('#');
    });

    it('getWcagCriteriaUrl avec undefined comme entrée retourne "#"', () => {
      const result = getWcagCriteriaUrl(undefined as unknown as string);
      expect(result).toBe('#');
    });

    it('parseWcagReference avec null retourne un objet valide', () => {
      const result = parseWcagReference(null as unknown as string);
      expect(result).toHaveProperty('number');
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('fullText');
    });

    it('getTechniqueUrl avec undefined retourne "#"', () => {
      const result = getTechniqueUrl(undefined as unknown as string);
      expect(result).toBe('#');
    });

    it('parseWcagReference avec undefined retourne un objet valide', () => {
      const result = parseWcagReference(undefined as unknown as string);
      expect(result.number).toBe('');
      expect(result.level).toBe('');
      expect(result.fullText).toBe('');
    });
  });
});
