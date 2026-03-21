import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { transformCriteriaData } from './transformCriteria';
import type { CriteriaRawData } from '../types';
import * as logger from './logger';

// Mock the logger module
vi.mock('./logger', () => ({
  logError: vi.fn(),
  logWarning: vi.fn(),
  logInfo: vi.fn(),
}));

describe('transformCriteriaData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('WCAG level extraction', () => {
    it('should extract A level from wcag reference string', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Test criterion',
                  references: [
                    {
                      wcag: ['1.1.1 Non-text Content (A)'],
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);
      expect(result[0]?.level).toBe('A');
    });

    it('should return N/A when wcag reference has no level pattern', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Test criterion',
                  references: [
                    {
                      wcag: ['1.1.1 Non-text Content'],
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);
      expect(result[0]?.level).toBe('N/A');
    });
  });

  describe('basic transformation', () => {
    it('should transform a single criterion correctly', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Test criterion',
                  tests: {
                    '1': ['Question 1?'],
                  },
                  references: [
                    {
                      wcag: ['1.1.1 Non-text Content (A)'],
                      techniques: ['G94'],
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('1.1');
      expect(result[0]?.title).toBe('Test criterion');
      expect(result[0]?.theme).toBe('Images');
      expect(result[0]?.level).toBe('A');
      expect(result[0]?.url).toBe('https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#1.1');
    });

    it('should extract WCAG level from references correctly', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Colors',
            number: 2,
            criteria: [
              {
                criterium: {
                  number: 3,
                  title: 'AA level criterion',
                  references: [
                    {
                      wcag: ['1.4.3 Contrast (AA)'],
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);

      expect(result[0]?.level).toBe('AA');
    });

    it('should extract AAA level from references', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Focus',
            number: 3,
            criteria: [
              {
                criterium: {
                  number: 2,
                  title: 'AAA level criterion',
                  references: [
                    {
                      wcag: ['2.4.7 Focus Visible (AAA)'],
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);

      expect(result[0]?.level).toBe('AAA');
    });

    it('should set level to N/A when references are missing', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Criterion without references',
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);

      expect(result[0]?.level).toBe('N/A');
    });
  });

  describe('tests transformation', () => {
    it('should transform tests object to array correctly', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Test criterion',
                  tests: {
                    '1': ['Question 1?'],
                    '2': ['Question 2.1?', 'Question 2.2?'],
                  },
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);
      const tests = result[0]?.tests;

      expect(tests).toHaveLength(2);
      expect(tests?.[0]).toEqual({ id: '1', questions: ['Question 1?'] });
      expect(tests?.[1]).toEqual({ id: '2', questions: ['Question 2.1?', 'Question 2.2?'] });
    });

    it('should return empty tests array when tests field is missing', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Criterion without tests',
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);

      expect(result[0]?.tests).toEqual([]);
    });

    it('should filter out undefined test values', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Test criterion',
                  tests: {
                    '1': ['Question 1?'],
                    '2': undefined,
                    '3': ['Question 3?'],
                  },
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);
      const tests = result[0]?.tests;

      expect(tests).toHaveLength(2);
      expect(tests?.map(t => t.id)).toEqual(['1', '3']);
    });
  });

  describe('references transformation', () => {
    it('should transform references with both wcag and techniques', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Test criterion',
                  references: [
                    {
                      wcag: ['1.1.1 Non-text Content (A)'],
                      techniques: ['G94', 'H36'],
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);
      const refs = result[0]?.references;

      expect(refs).toBeDefined();
      expect(refs?.wcag).toEqual(['1.1.1 Non-text Content (A)']);
      expect(refs?.techniques).toEqual(['G94', 'H36']);
    });

    it('should aggregate references from multiple reference objects', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Test criterion',
                  references: [
                    {
                      wcag: ['1.1.1 Non-text Content (A)'],
                      techniques: ['G94'],
                    },
                    {
                      wcag: ['2.4.2 Page Titled (A)'],
                      techniques: ['H25'],
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);
      const refs = result[0]?.references;

      expect(refs?.wcag).toEqual(['1.1.1 Non-text Content (A)', '2.4.2 Page Titled (A)']);
      expect(refs?.techniques).toEqual(['G94', 'H25']);
    });

    it('should return undefined references when references array is empty', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Test criterion',
                  references: [],
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);

      expect(result[0]?.references).toBeUndefined();
    });

    it('should return undefined references when references field is missing', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Test criterion',
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);

      expect(result[0]?.references).toBeUndefined();
    });

    it('should exclude undefined wcag and techniques from references', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Test criterion',
                  references: [
                    {
                      wcag: ['1.1.1 Non-text Content (A)'],
                    },
                    {
                      techniques: ['G94'],
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);
      const refs = result[0]?.references;

      expect(refs?.wcag).toEqual(['1.1.1 Non-text Content (A)']);
      expect(refs?.techniques).toEqual(['G94']);
    });
  });

  describe('multiple criteria transformation', () => {
    it('should transform multiple criteria into array', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Criterion 1.1',
                },
              },
              {
                criterium: {
                  number: 2,
                  title: 'Criterion 1.2',
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('1.1');
      expect(result[1]?.id).toBe('1.2');
    });

    it('should handle multiple topics with multiple criteria', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Criterion 1.1',
                },
              },
              {
                criterium: {
                  number: 2,
                  title: 'Criterion 1.2',
                },
              },
            ],
          },
          {
            topic: 'Colors',
            number: 2,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Criterion 2.1',
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);

      expect(result).toHaveLength(3);
      expect(result[0]?.id).toBe('1.1');
      expect(result[1]?.id).toBe('1.2');
      expect(result[2]?.id).toBe('2.1');
    });
  });

  describe('edge cases - empty data', () => {
    it('should return empty array when topics array is empty', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [],
      };

      const result = transformCriteriaData(mockData);

      expect(result).toEqual([]);
    });

    it('should skip topics with invalid criteria and log warning', () => {
      const mockData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: undefined,
          },
          {
            topic: 'Colors',
            number: 2,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Valid criterion',
                },
              },
            ],
          },
        ],
      } as CriteriaRawData;

      const result = transformCriteriaData(mockData);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('2.1');
      expect(logger.logWarning).toHaveBeenCalledWith('Topic Images a des critères invalides, ignoré');
    });

    it('should skip topics with non-array criteria and log warning', () => {
      const mockData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: {},
          },
        ],
      } as CriteriaRawData;

      const result = transformCriteriaData(mockData);

      expect(result).toEqual([]);
      expect(logger.logWarning).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should throw Error when topics field is missing', () => {
      const mockData = {
        wcag: { version: 2.1 },
      } as CriteriaRawData;

      expect(() => transformCriteriaData(mockData)).toThrow('Échec de la transformation des données de critères');
      expect(logger.logError).toHaveBeenCalled();
    });

    it('should throw Error when topics is not an array', () => {
      const mockData = {
        wcag: { version: 2.1 },
        topics: {},
      } as CriteriaRawData;

      expect(() => transformCriteriaData(mockData)).toThrow('Échec de la transformation des données de critères');
      expect(logger.logError).toHaveBeenCalled();
    });

    it('should throw Error with message "Échec de la transformation des données de critères"', () => {
      const mockData = {
        wcag: { version: 2.1 },
        topics: null,
      } as unknown as CriteriaRawData;

      expect(() => transformCriteriaData(mockData)).toThrow('Échec de la transformation des données de critères');
    });
  });

  describe('optional fields', () => {
    it('should handle missing technicalNote', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Test criterion',
                  // technicalNote is missing
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);

      expect(result[0]?.technicalNote).toBeUndefined();
    });

    it('should include technicalNote when present', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Test criterion',
                  technicalNote: ['Note 1', 'Note 2'],
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);

      expect(result[0]?.technicalNote).toEqual(['Note 1', 'Note 2']);
    });

    it('should handle particularCases when present', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Test criterion',
                  particularCases: ['Case 1', 'Case 2'],
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);

      expect(result[0]?.particularCases).toEqual(['Case 1', 'Case 2']);
    });

    it('should handle missing particularCases', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Test criterion',
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);

      expect(result[0]?.particularCases).toBeUndefined();
    });
  });

  describe('immutability', () => {
    it('should not mutate the input data', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Original title',
                  tests: {
                    '1': ['Original question'],
                  },
                },
              },
            ],
          },
        ],
      };

      const originalData = JSON.parse(JSON.stringify(mockData));
      transformCriteriaData(mockData);

      expect(mockData).toEqual(originalData);
    });

    it('should create new objects in results', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Test criterion',
                },
              },
            ],
          },
        ],
      };

      const result1 = transformCriteriaData(mockData);
      const result2 = transformCriteriaData(mockData);

      expect(result1).not.toBe(result2);
      expect(result1[0]).not.toBe(result2[0]);
    });
  });

  describe('URL generation', () => {
    it('should generate correct URL for criterion', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Images',
            number: 1,
            criteria: [
              {
                criterium: {
                  number: 1,
                  title: 'Test criterion',
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);

      expect(result[0]?.url).toBe('https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#1.1');
    });

    it('should generate correct URL for criterion 13.6', () => {
      const mockData: CriteriaRawData = {
        wcag: { version: 2.1 },
        topics: [
          {
            topic: 'Form inputs',
            number: 13,
            criteria: [
              {
                criterium: {
                  number: 6,
                  title: 'Test criterion',
                },
              },
            ],
          },
        ],
      };

      const result = transformCriteriaData(mockData);

      expect(result[0]?.url).toBe('https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/#13.6');
    });
  });
});
