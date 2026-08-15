import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Plus, Trash2 } from 'lucide-react';
import { getWcagCriteriaUrl, getTechniqueUrl, parseWcagReference } from '../utils/generateWcagLinks';
import type { CriteriaRGAA, Mode, CriteriaStatus } from '../types';
import { parseMarkdownLinks } from '../utils/parseMarkdown';
import { parseInlineCode } from '../utils/parseInlineCode';
import { cleanCriteriaTitle } from '../utils/stripMarkdown';
import StatusButtons from './StatusButtons';
import { getSelectableStatuses } from '../utils/statusPresentation';

interface CriteriaDetailProps {
  criterion: CriteriaRGAA;
  mode: Mode;
  currentStatus?: CriteriaStatus;
  checkedTests: string[];
  note: string;
  pages: string[];
  previous?: CriteriaRGAA;
  next?: CriteriaRGAA;
  onStatusChange: (criteriaId: string, status: CriteriaStatus | '') => void;
  onCheckedTestsChange: (criteriaId: string, testIds: string[]) => void;
  onNoteChange: (criteriaId: string, note: string) => void;
  onPagesChange: (criteriaId: string, pages: string[]) => void;
  onGlossaryClick: (slug: string) => void;
  onNavigate: (criteriaId: string) => void;
}

export default function CriteriaDetail({
  criterion,
  mode,
  currentStatus,
  checkedTests,
  note,
  pages,
  previous,
  next,
  onStatusChange,
  onCheckedTestsChange,
  onNoteChange,
  onPagesChange,
  onGlossaryClick,
  onNavigate,
}: CriteriaDetailProps) {
  // La note est tenue localement pendant la frappe : écrire dans le magasin à
  // chaque touche ferait une écriture localStorage par caractère.
  const [draftNote, setDraftNote] = useState(note);
  const [newPage, setNewPage] = useState('');
  const criteriaId = criterion.id;

  useEffect(() => {
    setDraftNote(note);
  }, [note, criteriaId]);

  const flushNote = useCallback(() => {
    if (draftNote !== note) onNoteChange(criteriaId, draftNote);
  }, [draftNote, note, criteriaId, onNoteChange]);

  // La note doit survivre à une fermeture d'onglet en pleine frappe.
  const flushRef = useRef(flushNote);
  flushRef.current = flushNote;
  useEffect(() => {
    const handler = () => flushRef.current();
    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
      handler();
    };
  }, [criteriaId]);

  const statuses = getSelectableStatuses(mode);

  // Raccourcis du critère déplié. Ignorés dès qu'un champ a le focus : sinon
  // taper « j » dans une note ferait changer de critère.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;

      const key = event.key.toLowerCase();
      if (key === 'j' && next) {
        event.preventDefault();
        onNavigate(next.id);
      } else if (key === 'k' && previous) {
        event.preventDefault();
        onNavigate(previous.id);
      } else if (key === '1' || key === '2' || key === '3') {
        event.preventDefault();
        const chosen = statuses[Number(key) - 1];
        if (chosen) {
          onStatusChange(criteriaId, chosen.key === currentStatus ? '' : chosen.key);
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [criteriaId, currentStatus, next, previous, onNavigate, onStatusChange, statuses]);

  const tests = criterion.tests ?? [];
  const wcagRefs = criterion.references?.wcag ?? [];
  const techniques = criterion.references?.techniques ?? [];
  const checkedCount = tests.filter(test => checkedTests.includes(test.id)).length;

  const toggleTest = (testId: string) => {
    onCheckedTestsChange(
      criteriaId,
      checkedTests.includes(testId)
        ? checkedTests.filter(id => id !== testId)
        : [...checkedTests, testId],
    );
  };

  const addPage = () => {
    const url = newPage.trim();
    if (!url || pages.includes(url)) return;
    onPagesChange(criteriaId, [...pages, url]);
    setNewPage('');
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 wide:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline gap-3">
            <h2 className="text-meta font-semibold uppercase tracking-[0.08em] text-ink-muted">
              Tests · {tests.length}
            </h2>
            <span className="font-mono text-meta text-ink-muted">
              {checkedCount} / {tests.length} cochés
            </span>
          </div>

          <ul className="flex flex-col gap-2">
            {tests.map(test => {
              const isChecked = checkedTests.includes(test.id);
              return (
                <li key={test.id}>
                  <label
                    className={[
                      'grid cursor-pointer grid-cols-[20px_1fr] gap-3 rounded-card border-1 p-4',
                      isChecked ? 'bg-ok-card border-ok-line' : 'bg-surface border-border',
                    ].join(' ')}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleTest(test.id)}
                      className="mt-1 h-icon-lg w-icon-lg cursor-pointer rounded-ctrl"
                    />
                    <span>
                      <span className="block font-mono text-meta text-ink-muted">
                        Test {test.id}
                      </span>
                      <span className="mt-1 block text-body">
                        {test.questions.map((question, index) => (
                          <span key={index} className="block">
                            {parseMarkdownLinks(question, { onGlossaryClick }).map((part, i) =>
                              typeof part === 'string' ? (
                                <span key={i}>{parseInlineCode(part)}</span>
                              ) : (
                                part
                              ),
                            )}
                          </span>
                        ))}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <StatusButtons
            criteriaId={criteriaId}
            criteriaTitle={criterion.title}
            mode={mode}
            currentStatus={currentStatus}
            onStatusChange={onStatusChange}
            density="detail"
          />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label
              htmlFor={`note-${criteriaId}`}
              className="mb-2 block text-body font-semibold"
            >
              Note d'audit
            </label>
            <textarea
              id={`note-${criteriaId}`}
              value={draftNote}
              onChange={event => setDraftNote(event.target.value)}
              onBlur={flushNote}
              className="min-h-[78px] w-full rounded-ctrl border-1 border-border bg-surface p-3 text-body"
            />
          </div>

          <div>
            <h3 className="mb-2 text-body font-semibold">Pages concernées</h3>
            <ul className="mb-2 flex flex-col gap-1">
              {pages.map(url => (
                <li key={url} className="flex items-center gap-2">
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-w-0 flex-1 items-center gap-1 truncate rounded-ctrl bg-sunk px-2 py-1 font-mono text-meta"
                  >
                    <ExternalLink size={12} aria-hidden="true" className="flex-shrink-0" />
                    <span className="truncate">{url}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => onPagesChange(criteriaId, pages.filter(p => p !== url))}
                    aria-label={`Retirer la page ${url}`}
                    className="target-44 flex h-ctrl w-ctrl flex-shrink-0 items-center justify-center rounded-ctrl text-ink-muted"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                type="url"
                value={newPage}
                onChange={event => setNewPage(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    addPage();
                  }
                }}
                aria-label="Adresse de la page à ajouter"
                placeholder="https://exemple.fr/page"
                className="h-touch min-w-0 flex-1 rounded-ctrl border-1 border-border bg-surface px-3 text-body"
              />
              <button
                type="button"
                onClick={addPage}
                className="target-44 flex h-ctrl items-center gap-1 rounded-ctrl border-1 border-dashed border-dashed px-3 text-body"
              >
                <Plus size={16} aria-hidden="true" />
                Ajouter
              </button>
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-body font-semibold">Références</h3>
            {/* Le RGAA fait foi : il ouvre la liste, le WCAG et les techniques
                viennent en appui. */}
            <a
              href={criterion.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-ctrl bg-sunk px-2 py-1 font-mono text-meta font-semibold"
            >
              RGAA {criterion.id}
              <ExternalLink size={12} aria-hidden="true" />
            </a>

            {wcagRefs.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-meta text-ink-muted">WCAG</p>
                <ul className="flex flex-wrap gap-1">
                  {wcagRefs.map(ref => {
                    const parsed = parseWcagReference(ref);
                    return (
                      <li key={ref}>
                        <a
                          href={getWcagCriteriaUrl(ref)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-ctrl bg-sunk px-2 py-1 font-mono text-meta"
                        >
                          {parsed.number || ref}
                          <ExternalLink size={12} aria-hidden="true" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {techniques.length > 0 && (
              <div className="mt-3">
                <p className="mb-1 text-meta text-ink-muted">Techniques</p>
                <ul className="flex flex-wrap gap-1">
                  {techniques.map(technique => (
                    <li key={technique}>
                      <a
                        href={getTechniqueUrl(technique)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-ctrl bg-sunk px-2 py-1 font-mono text-meta"
                      >
                        {technique}
                        <ExternalLink size={12} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-separator pt-4">
        {previous ? (
          <button
            type="button"
            onClick={() => onNavigate(previous.id)}
            className="target-44 flex h-ctrl items-center gap-2 rounded-ctrl border-1 border-border bg-surface px-3 text-body"
          >
            <ChevronLeft size={16} aria-hidden="true" />
            <span className="font-mono text-meta">{previous.id}</span>
            <span className="max-w-[24ch] truncate">{cleanCriteriaTitle(previous.title)}</span>
          </button>
        ) : (
          <span />
        )}

        <span className="flex-1 text-center font-mono text-meta text-ink-muted">
          1 2 3 pour statuer · J / K pour naviguer
        </span>

        {next && (
          <button
            type="button"
            onClick={() => onNavigate(next.id)}
            className="target-44 flex h-ctrl items-center gap-2 rounded-ctrl bg-ink px-3 text-body text-surface"
          >
            <span className="font-mono text-meta">{next.id}</span>
            <span className="max-w-[24ch] truncate">{cleanCriteriaTitle(next.title)}</span>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
