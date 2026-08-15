import { useMemo, useState } from 'react';
import { ChevronLeft, Search } from 'lucide-react';
import type { CriteriaRGAA, GlossaryTerm } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { titleToSlug } from '../utils/transformGlossary';
import { parseGlossaryHtml } from '../utils/parseGlossaryHtml';
import { cleanCriteriaTitle } from '../utils/stripMarkdown';
import { MAX_SEARCH_LENGTH } from '../constants';
import EmptyState from './EmptyState';

interface GlossaryScreenProps {
  glossary: GlossaryTerm[];
  criteriaList: CriteriaRGAA[];
  selectedSlug?: string;
  /** `undefined` referme le détail et rend la main à la liste en écran étroit. */
  onSelectTerm: (slug: string | undefined) => void;
  onCriteriaClick: (criteriaId: string) => void;
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Première lettre du terme, sans accent, pour l'index alphabétique. */
function initialOf(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .charAt(0)
    .toUpperCase();
}

/**
 * Extrait de définition. Le corps du glossaire est du HTML : retirer les balises
 * ne suffit pas, il reste les entités (`&lt;frame&gt;`) qu'il faut décoder.
 */
function excerpt(body: string): string {
  const withoutTags = body.replace(/<[^>]+>/g, ' ');
  const decoder = document.createElement('textarea');
  decoder.innerHTML = withoutTags;
  return (decoder.value || withoutTags).replace(/\s+/g, ' ').trim();
}

export default function GlossaryScreen({
  glossary,
  criteriaList,
  selectedSlug,
  onSelectTerm,
  onCriteriaClick,
}: GlossaryScreenProps) {
  const [search, setSearch] = useState('');
  const [letter, setLetter] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 200);

  const filtered = useMemo(() => {
    const needle = debouncedSearch.toLowerCase();
    return glossary.filter(term => {
      const matchesSearch = needle === '' || term.title.toLowerCase().includes(needle);
      const matchesLetter = letter === null || initialOf(term.title) === letter;
      return matchesSearch && matchesLetter;
    });
  }, [glossary, debouncedSearch, letter]);

  const selected = useMemo(
    () => glossary.find(term => titleToSlug(term.title) === selectedSlug) ?? filtered[0] ?? null,
    [glossary, selectedSlug, filtered],
  );

  /** Les critères dont l'intitulé renvoie explicitement vers ce terme. */
  const relatedCriteria = useMemo(() => {
    if (!selected) return [];
    const slug = titleToSlug(selected.title);
    return criteriaList.filter(criterion => criterion.title.includes(`#${slug}`));
  }, [selected, criteriaList]);

  const availableLetters = useMemo(
    () => new Set(glossary.map(term => initialOf(term.title))),
    [glossary],
  );

  /**
   * Sous 1100px les deux volets s'empilent, et la liste des 119 termes fait
   * 8600px de haut : la définition se retrouvait enterrée dessous, si bas qu'un
   * clic semblait sans effet. On montre donc l'un ou l'autre, comme l'écran
   * d'audit le fait déjà entre sa liste et le détail d'un critère.
   *
   * Au-delà du seuil les deux volets cohabitent, et `selected` retombe sur le
   * premier terme filtré : le panneau n'est jamais vide à côté de la liste.
   */
  const isDetailOpen = selectedSlug != null;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-section font-semibold">Glossaire</h1>
        <span className="flex-1" />
        <div className="flex flex-wrap gap-1" role="group" aria-label="Index alphabétique">
          <button
            type="button"
            onClick={() => setLetter(null)}
            aria-pressed={letter === null}
            className={[
              'relative h-chip rounded-ctrl px-3 font-mono text-meta',
              "before:absolute before:inset-x-0 before:-top-[6px] before:-bottom-[6px] before:content-['']",
              letter === null ? 'bg-ink text-surface' : 'bg-sunk',
            ].join(' ')}
          >
            Tout
          </button>
          {ALPHABET.filter(l => availableLetters.has(l)).map(l => (
            <button
              key={l}
              type="button"
              onClick={() => setLetter(current => (current === l ? null : l))}
              aria-pressed={letter === l}
              className={[
                'relative h-chip w-chip rounded-ctrl font-mono text-meta',
                "before:absolute before:inset-x-0 before:-top-[6px] before:-bottom-[6px] before:content-['']",
                letter === l ? 'bg-ink text-surface' : 'bg-sunk',
              ].join(' ')}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4 wide:flex-row">
        <div
          data-volet="liste"
          className={[
            'w-full flex-col wide:flex wide:min-h-0 wide:w-[320px] wide:border-r wide:border-separator wide:pr-4',
            isDetailOpen ? 'hidden' : 'flex',
          ].join(' ')}
        >
          <div className="relative">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              type="search"
              value={search}
              onChange={event => setSearch(event.target.value)}
              maxLength={MAX_SEARCH_LENGTH}
              aria-label="Rechercher un terme du glossaire"
              placeholder="Rechercher un terme"
              className="h-touch w-full rounded-card border-1 border-border bg-surface pl-8 pr-3 text-body"
            />
          </div>

          <p className="py-2 font-mono text-meta text-ink-muted">
            {filtered.length} terme{filtered.length > 1 ? 's' : ''} sur {glossary.length}
          </p>

          {/* En colonne, les deux panneaux suivent le défilement de la page :
              deux zones scrollables imbriquées dans un `main` déjà scrollable
              obligent à viser la bonne au pouce. */}
          <ul className="wide:min-h-0 wide:flex-1 wide:overflow-y-auto">
            {filtered.map(term => {
              const slug = titleToSlug(term.title);
              const isSelected = selected != null && titleToSlug(selected.title) === slug;

              return (
                <li key={slug}>
                  <button
                    type="button"
                    onClick={() => onSelectTerm(slug)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={[
                      'w-full border-b border-separator px-4 py-3 text-left',
                      isSelected ? 'bg-sunk font-semibold' : '',
                    ].join(' ')}
                  >
                    <span className="block text-body">{term.title}</span>
                    <span className="mt-1 block truncate text-dense text-ink-muted">
                      {excerpt(term.body)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div
          data-volet="detail"
          className={[
            'flex-1 wide:block wide:min-h-0 wide:overflow-y-auto',
            isDetailOpen ? 'block' : 'hidden',
          ].join(' ')}
        >
          {isDetailOpen && (
            <button
              type="button"
              onClick={() => onSelectTerm(undefined)}
              className="target-44 mb-4 flex h-ctrl items-center gap-2 rounded-ctrl border-1 border-border bg-surface px-3 text-body wide:hidden"
            >
              <ChevronLeft size={16} aria-hidden="true" />
              Retour à la liste
            </button>
          )}

          {selected ? (
            <article>
              <p className="font-mono text-meta uppercase tracking-[0.08em] text-ink-muted">
                Glossaire RGAA · {initialOf(selected.title)}
              </p>
              <h2 className="mt-1 text-section font-semibold">{selected.title}</h2>
              <div className="prose mt-4 max-w-[70ch] text-lead">
                {parseGlossaryHtml(selected.body, { onGlossaryClick: onSelectTerm, onCriteriaClick })}
              </div>

              {relatedCriteria.length > 0 && (
                <div className="mt-6 border-t border-separator pt-4">
                  <h3 className="mb-3 text-body font-semibold">
                    Critères qui emploient ce terme · {relatedCriteria.length}
                  </h3>
                  <ul className="flex flex-wrap gap-2">
                    {relatedCriteria.map(criterion => (
                      <li key={criterion.id}>
                        <button
                          type="button"
                          onClick={() => onCriteriaClick(criterion.id)}
                          className="flex items-center gap-2 rounded-ctrl border-1 border-border bg-surface px-3 py-2 text-left"
                        >
                          <span className="font-mono text-meta font-semibold">{criterion.id}</span>
                          <span className="max-w-[40ch] truncate text-dense">
                            {cleanCriteriaTitle(criterion.title)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ) : (
            <EmptyState
              title="Aucun terme ne correspond"
              body={`« ${search} » n'apparaît dans aucun intitulé du glossaire. Le terme est peut-être dans le corps d'une définition, ou dans un intitulé de critère.`}
              actions={
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setLetter(null);
                  }}
                  className="target-44 h-ctrl rounded-ctrl border-1 border-border bg-surface px-3 text-body"
                >
                  Effacer la recherche
                </button>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
