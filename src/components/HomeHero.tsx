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
    // bord droit — pour que les deux blocs de texte s'alignent. En mobile il n'y
    // a pas de panneau à suivre : la bannière va d'un bord à l'autre.
    <header className="banner hero flex-shrink-0 p-6 sm:mt-2 sm:rounded-l-card">
      {/* Le fond couvre toute la largeur, le texte non : passé 1200px il
          s'alignerait sinon sur un bord que le panneau du dessous ne suit pas.
          Même conteneur des deux côtés — c'est ce qui les tient alignés. */}
      <div className="hero-layout mx-auto flex w-full max-w-[1200px] flex-col gap-8">
        <div>
          <p className="font-mono text-meta uppercase tracking-[0.08em] text-banner-muted">
            RGAA 4.1
          </p>
          <h1 className="mt-3 max-w-[20ch] text-screen font-bold [text-wrap:balance] sm:text-display roomy:text-hero">
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
        <ul className="hero-figures flex flex-shrink-0 flex-wrap gap-8">
          {figures.map(({ value, label }) => (
            <li key={label}>
              <span className="block font-mono text-section font-semibold leading-none sm:text-display">
                {value}
              </span>
              <span className="mt-2 block text-dense text-banner-muted">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
