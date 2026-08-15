import { useState } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import type { Mode } from '../types';
import type { NewAuditInput } from '../hooks/useAudits';

interface NewAuditFormProps {
  themes: string[];
  /** Nombre de critères par thème, pour le compteur. */
  criteriaCountByTheme: Record<string, number>;
  onCancel: () => void;
  onSubmit: (input: NewAuditInput) => void;
}

const MODES: Array<{ value: Mode; title: string; body: string }> = [
  {
    value: 'classic',
    title: 'Classique',
    body: 'Conforme / Non conforme / Non applicable. Pour auditer un site en production.',
  },
  {
    value: 'design-system',
    title: 'Design system',
    body: 'Conforme par défaut / À mettre en place / Non applicable. Pour évaluer un socle de composants.',
  },
];

export default function NewAuditForm({
  themes,
  criteriaCountByTheme,
  onCancel,
  onSubmit,
}: NewAuditFormProps) {
  const [name, setName] = useState('');
  const [scope, setScope] = useState('');
  const [mode, setMode] = useState<Mode>('classic');
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  // L'erreur naît de la sortie du champ, pas de la soumission : signaler à la
  // validation oblige l'utilisateur à remonter chercher ce qui cloche.
  const [nameTouched, setNameTouched] = useState(false);

  const trimmedName = name.trim();
  const nameError = nameTouched && trimmedName === '' ? 'Le nom de l\'audit est requis.' : null;

  const retained = selectedThemes.length === 0 ? themes : selectedThemes;
  const criteriaCount = retained.reduce((sum, theme) => sum + (criteriaCountByTheme[theme] ?? 0), 0);

  const toggleTheme = (theme: string) => {
    setSelectedThemes(previous =>
      previous.includes(theme) ? previous.filter(t => t !== theme) : [...previous, theme],
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (trimmedName === '') {
      setNameTouched(true);
      return;
    }
    onSubmit({
      name: trimmedName,
      scope: scope.trim() || undefined,
      mode,
      themes: selectedThemes,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Retour"
          className="target-44 flex h-ctrl w-ctrl items-center justify-center rounded-ctrl border-1 border-border bg-surface"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        <span className="text-body font-semibold">Nouvel audit</span>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 rounded-card bg-sunk p-4"
      >
        <div>
          <label htmlFor="audit-name" className="mb-2 block text-body font-semibold">
            Nom de l'audit
          </label>
          <input
            id="audit-name"
            value={name}
            onChange={event => setName(event.target.value)}
            onBlur={() => setNameTouched(true)}
            aria-describedby={nameError ? 'audit-name-error' : 'audit-name-help'}
            aria-invalid={nameError ? true : undefined}
            className="w-full rounded-ctrl border-1 border-border bg-surface p-3 text-body"
          />
          {nameError ? (
            <p id="audit-name-error" role="alert" className="mt-2 text-meta text-ko-fg">
              {nameError}
            </p>
          ) : (
            <p id="audit-name-help" className="mt-2 text-meta text-ink-muted">
              Apparaîtra en tête du rapport exporté.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="audit-scope" className="mb-2 block text-body font-semibold">
            Périmètre <span className="font-normal text-ink-muted">— optionnel</span>
          </label>
          <input
            id="audit-scope"
            type="url"
            value={scope}
            onChange={event => setScope(event.target.value)}
            placeholder="https://www.exemple.fr"
            className="w-full rounded-ctrl border-1 border-border bg-sunk p-3 text-body"
          />
        </div>

        <fieldset className="border-0 p-0">
          <legend className="mb-2 text-body font-semibold">Mode de vérification</legend>
          <div className="flex flex-col gap-2">
            {MODES.map(option => {
              const isSelected = mode === option.value;
              return (
                <label
                  key={option.value}
                  className={[
                    'grid cursor-pointer grid-cols-[20px_1fr] items-start gap-3 rounded-card border-1.5 p-4',
                    isSelected ? 'border-ink bg-sunk' : 'border-border bg-surface',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="audit-mode"
                    value={option.value}
                    checked={isSelected}
                    onChange={() => setMode(option.value)}
                    className="mt-1 h-icon-lg w-icon-lg"
                  />
                  <span>
                    <span className="block text-body font-semibold">{option.title}</span>
                    <span className="mt-1 block text-dense text-ink-muted">{option.body}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="border-0 p-0">
          <div className="mb-2 flex items-baseline gap-3">
            <legend className="text-body font-semibold">Thèmes à auditer</legend>
            <span className="flex-1" />
            <span className="font-mono text-meta text-ink-muted">
              {retained.length} / {themes.length} · {criteriaCount} critères
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {themes.map(theme => {
              const isSelected = selectedThemes.includes(theme);
              return (
                <label
                  key={theme}
                  className={[
                    'flex cursor-pointer items-center gap-1 rounded-pill px-3 py-1 text-meta font-medium',
                    isSelected
                      ? 'bg-ink text-surface'
                      : 'border-1 border-border bg-surface text-ink-muted',
                  ].join(' ')}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleTheme(theme)}
                    className="sr-only"
                  />
                  {theme}
                  {isSelected && <Check size={12} strokeWidth={2.6} aria-hidden="true" />}
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-meta text-ink-muted">
            Aucun thème coché signifie « tous les thèmes ».
          </p>
        </fieldset>

        <button
          type="submit"
          disabled={trimmedName === ''}
          className="h-prim rounded-ctrl bg-ink text-lead font-semibold text-surface disabled:opacity-50"
        >
          Créer l'audit
        </button>
      </form>
    </div>
  );
}
