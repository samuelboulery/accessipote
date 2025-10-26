import type { CriteriaRGAA, Test, References, CriteriaRawData } from '../types';
import { logError, logWarning } from './logger';

/**
 * Extrait le niveau de conformité WCAG depuis une référence
 * @param wcagRefs - Tableau de références WCAG (ex: "1.1.1 Non-text Content (A)")
 * @returns Le niveau d'accessibilité (A, AA, AAA) ou 'N/A' si non trouvé
 * @example
 * extractLevel(["1.1.1 Non-text Content (A)"]) // "A"
 * extractLevel(["1.4.3 Contrast (AA)"]) // "AA"
 */
function extractLevel(wcagRefs?: string[]): string {
  if (!wcagRefs || wcagRefs.length === 0) return 'N/A';
  
  const levelMatch = wcagRefs[0]?.match(/\(([A]{1,3})\)/);
  if (levelMatch) return levelMatch[1];
  
  return 'N/A';
}

/**
 * Transforme les tests d'un critère au format attendu par l'application
 * @param tests - Objet avec les tests indexés par ID
 * @returns Tableau de tests transformés avec id et questions
 * @example
 * transformTests({ "1": ["Question 1?"], "2": ["Question 2?"] })
 * // [{ id: "1", questions: ["Question 1?"] }, { id: "2", questions: ["Question 2?"] }]
 */
function transformTests(tests?: { [key: string]: string[] | undefined }): Test[] {
  if (!tests) return [];
  
  return Object.entries(tests)
    .filter(([_, questions]) => questions !== undefined)
    .map(([id, questions]) => ({
      id,
      questions: questions!,
    }));
}

/**
 * Transforme et agrège les références WCAG et techniques
 * @param references - Tableau d'objets contenant des références wcag ou techniques
 * @returns Objet avec les références agrégées ou undefined si aucune référence
 */
function transformReferences(references?: Array<{ wcag?: string[]; techniques?: string[] }>): References | undefined {
  if (!references || references.length === 0) return undefined;
  
  const wcag = references.flatMap(ref => ref.wcag || []);
  const techniques = references.flatMap(ref => ref.techniques || []);
  
  return { wcag: wcag.length > 0 ? wcag : undefined, techniques: techniques.length > 0 ? techniques : undefined };
}

/**
 * Transforme les données brutes du fichier criteria.json en format CriteriaRGAA[]
 * Gère la conversion de la structure imbriquée JSON en format aplati
 * Crée les IDs, URLs et extrait les niveaux WCAG
 * 
 * @param data - Données brutes du fichier criteria.json
 * @returns Tableau de critères RGAA prêts pour l'application
 * @throws Error si la structure des données est invalide
 */
export function transformCriteriaData(data: CriteriaRawData): CriteriaRGAA[] {
  try {
    const result: CriteriaRGAA[] = [];
    
    if (!data.topics || !Array.isArray(data.topics)) {
      throw new Error('Structure invalide: topics manquant ou non-array');
    }

    for (const topic of data.topics) {
      if (!topic.criteria || !Array.isArray(topic.criteria)) {
        logWarning(`Topic ${topic.topic} a des critères invalides, ignoré`);
        continue;
      }

      for (const criterion of topic.criteria) {
        const { number, title, tests, references, technicalNote, particularCases } = criterion.criterium;
        
        // Extraire le niveau depuis les références WCAG
        const level = extractLevel(references?.[0]?.wcag);
        
        // Générer l'ID au format "topic.number" (ex: "1.1")
        const id = `${topic.number}.${number}`;
        
        // Construire l'URL vers le référentiel officiel
        const url = `https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#${id}`;
        
        const transformedCriterion: CriteriaRGAA = {
          id,
          title,
          theme: topic.topic,
          level,
          url,
          tests: transformTests(tests),
          references: transformReferences(references),
          technicalNote: technicalNote,
          particularCases: particularCases as any,
        };
        
        result.push(transformedCriterion);
      }
    }
    
    return result;
  } catch (error) {
    logError('Erreur lors de la transformation des critères:', error);
    throw new Error('Échec de la transformation des données de critères');
  }
}

