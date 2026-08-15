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
 * Bloc inversé, sombre dans les deux thèmes : le neutre clair ne se voyait pas,
 * et toute teinte franche se lirait comme un statut — dans ce système la
 * couleur ne dit que ça.
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
    <header className="banner mt-2 flex flex-shrink-0 flex-col gap-8 rounded-l-card p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-14">
      <div>
        <p className="font-mono text-meta uppercase tracking-[0.08em] text-banner-muted">
          RGAA 4.1
        </p>
        <h1 className="mt-3 max-w-[20ch] text-hero font-bold [text-wrap:balance]">
          Ton pote qui connaît le RGAA par cœur.
        </h1>
        <p className="mt-4 max-w-[52ch] text-lead text-banner-muted">
          Les {criteriaCount} critères, thème par thème, sans que tu aies à retenir lequel vient
          après lequel. Tu nommes ton audit, tu le reprends quand tu veux, et tes notes comme tes
          pages restent dans ce navigateur — rien ne part ailleurs.
        </p>
      </div>

      {/* Le poids du référentiel. Sur desktop il passe à droite du titre, où
          l'espace est libre, et gagne le rang qu'il n'avait pas en pied. */}
      <ul className="flex flex-shrink-0 flex-wrap gap-8 lg:flex-col lg:gap-6">
        {figures.map(({ value, label }) => (
          <li key={label}>
            <span className="block font-mono text-display font-semibold leading-none">{value}</span>
            <span className="mt-2 block text-dense text-banner-muted">{label}</span>
          </li>
        ))}
      </ul>
    </header>
  );
}
