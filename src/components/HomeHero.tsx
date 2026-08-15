interface HomeHeroProps {
  criteriaCount: number;
  themeCount: number;
  glossaryCount: number;
}

/**
 * Bannière posée hors du panneau, sur le fond de l'application. À l'intérieur,
 * il fallait choisir entre un titre à l'étroit contre le bord et un padding qui
 * décalait tout le reste.
 *
 * Le dégradé est un neutre chaud, pas une couleur : dans ce système la couleur
 * ne dit qu'un statut, et une teinte franche ici se lirait comme tel.
 */
export default function HomeHero({ criteriaCount, themeCount, glossaryCount }: HomeHeroProps) {
  const figures = [
    { value: criteriaCount, label: `critère${criteriaCount > 1 ? 's' : ''}` },
    { value: themeCount, label: `thème${themeCount > 1 ? 's' : ''}` },
    { value: glossaryCount, label: `définition${glossaryCount > 1 ? 's' : ''}` },
  ];

  return (
    // Même emprise que le panneau du dessous — arrondie à gauche, à fleur du
    // bord droit — pour que les deux blocs de texte s'alignent.
    <header className="banner mt-2 flex-shrink-0 rounded-l-card p-6">
      <p className="font-mono text-meta uppercase tracking-[0.08em] text-ink-muted">RGAA 4.1</p>
      <h1 className="mt-3 max-w-[20ch] text-hero font-bold [text-wrap:balance]">
        Ton pote qui connaît le RGAA par cœur.
      </h1>
      <p className="mt-4 max-w-[58ch] text-lead text-ink-muted">
        Les {criteriaCount} critères, thème par thème, sans que tu aies à retenir lequel vient
        après lequel. Tu nommes ton audit, tu le reprends quand tu veux, et tes notes comme tes
        pages restent dans ce navigateur — rien ne part ailleurs.
      </p>

      {/* Le poids du référentiel, en chiffres : c'est ce que l'outil couvre. */}
      <ul className="mt-6 flex flex-wrap items-baseline gap-4">
        {figures.map(({ value, label }, index) => (
          <li key={label} className="flex items-baseline gap-4">
            {index > 0 && (
              <span aria-hidden="true" className="text-ink-muted">
                ·
              </span>
            )}
            <span className="flex items-baseline gap-2">
              <span className="font-mono text-section font-semibold">{value}</span>
              <span className="text-dense text-ink-muted">{label}</span>
            </span>
          </li>
        ))}
      </ul>
    </header>
  );
}
