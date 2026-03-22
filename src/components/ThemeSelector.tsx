import { memo } from 'react';

interface ThemeSelectorProps {
  availableThemes: string[];
  selectedThemes: string[];
  onThemesChange: (themes: string[]) => void;
}

function ThemeSelector({
  availableThemes,
  selectedThemes,
  onThemesChange,
}: ThemeSelectorProps) {
  const toggleTheme = (theme: string) => {
    if (selectedThemes.includes(theme)) {
      onThemesChange(selectedThemes.filter(t => t !== theme));
    } else {
      onThemesChange([...selectedThemes, theme]);
    }
  };

  const selectAll = () => onThemesChange(availableThemes);
  const clearAll = () => onThemesChange([]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-sm font-bold text-black dark:text-gray-100">
          Thèmes ({selectedThemes.length}/{availableThemes.length})
        </label>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-xs text-black dark:text-gray-100 hover:underline font-semibold"
          >
            Tout sélectionner
          </button>
          {selectedThemes.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-black dark:text-gray-100 hover:underline font-semibold"
            >
              Tout effacer
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {availableThemes.map(theme => {
          const isSelected = selectedThemes.includes(theme);
          return (
            <button
              key={theme}
              onClick={() => toggleTheme(theme)}
              className={`
                px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-sm hover:shadow
                ${isSelected 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }
              `}
            >
              {theme}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default memo(ThemeSelector);

