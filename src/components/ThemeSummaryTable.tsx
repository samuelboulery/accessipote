import type { ThemeStats } from '../utils/calculateSummaryStats';

interface ThemeSummaryTableProps {
  themes: ThemeStats[];
  mode: 'classic' | 'design-system';
}

function ThemeSummaryTable({ themes, mode }: ThemeSummaryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs sm:text-sm dark:bg-gray-800 dark:text-gray-100">
        <thead>
          <tr className="border-b border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
            <th
              scope="col"
              className="text-left px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white"
            >
              Thème
            </th>
            {mode === 'classic' ? (
              <>
                <th
                  scope="col"
                  className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white"
                >
                  Conformes
                </th>
                <th
                  scope="col"
                  className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white"
                >
                  Non-conformes
                </th>
              </>
            ) : (
              <>
                <th
                  scope="col"
                  className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white"
                >
                  Par défaut
                </th>
                <th
                  scope="col"
                  className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white"
                >
                  Implémentation
                </th>
              </>
            )}
            <th
              scope="col"
              className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white"
            >
              N/A
            </th>
            <th
              scope="col"
              className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold text-gray-900 dark:text-white"
            >
              Taux
            </th>
          </tr>
        </thead>
        <tbody>
          {themes.map((theme) => (
            <tr
              key={theme.theme}
              className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <td className="text-left px-2 sm:px-4 py-2 sm:py-3 font-medium text-gray-900 dark:text-gray-100">
                {theme.theme}
              </td>
              {mode === 'classic' ? (
                <>
                  <td className="text-center px-2 sm:px-4 py-2 sm:py-3 text-green-600 dark:text-green-400 font-semibold">
                    {theme.conforme}
                  </td>
                  <td className="text-center px-2 sm:px-4 py-2 sm:py-3 text-red-600 dark:text-red-400 font-semibold">
                    {theme.nonConforme}
                  </td>
                </>
              ) : (
                <>
                  <td className="text-center px-2 sm:px-4 py-2 sm:py-3 text-green-600 dark:text-green-400 font-semibold">
                    {theme.defaultCompliant}
                  </td>
                  <td className="text-center px-2 sm:px-4 py-2 sm:py-3 text-teal-600 dark:text-teal-400 font-semibold">
                    {theme.projectImplementation}
                  </td>
                </>
              )}
              <td className="text-center px-2 sm:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 font-semibold">
                {theme.nonApplicable}
              </td>
              <td className="text-center px-2 sm:px-4 py-2 sm:py-3 font-semibold">
                {theme.rate === null ? (
                  <span className="text-gray-500 dark:text-gray-400">–</span>
                ) : (
                  <span className="text-gray-900 dark:text-gray-100">
                    {Math.round(theme.rate * 10) / 10}%
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ThemeSummaryTable;
