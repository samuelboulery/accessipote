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
        <label className="block text-sm font-bold text-black">
          Thèmes ({selectedThemes.length}/{availableThemes.length})
        </label>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="text-xs text-black hover:underline font-semibold"
          >
            Tout sélectionner
          </button>
          {selectedThemes.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-black hover:underline font-semibold"
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
                px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow
                ${isSelected 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
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

