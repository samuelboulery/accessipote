import { useMemo } from 'react';
import type { CriteriaRGAA, Progress } from '../types';
import { calculateSummaryStats } from '../utils/calculateSummaryStats';
import DonutChart from './DonutChart';
import ThemeSummaryTable from './ThemeSummaryTable';

interface SummaryTabProps {
  criteriaList: CriteriaRGAA[];
  progress: Progress;
  mode: 'classic' | 'design-system';
  isDark: boolean;
}

function SummaryTab({
  criteriaList,
  progress,
  mode,
  isDark,
}: SummaryTabProps) {
  const currentProgress = useMemo(() => {
    return mode === 'classic' ? progress.classic : progress.designSystem;
  }, [progress, mode]);

  const stats = useMemo(() => {
    return calculateSummaryStats(criteriaList, currentProgress, mode);
  }, [criteriaList, currentProgress, mode]);

  return (
    <div className={`py-8 space-y-10 ${isDark ? 'dark' : ''}`}>
      {/* Global stats header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Donut chart */}
        <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Taux de conformité global
          </h3>
          {mode === 'classic' ? (
            <DonutChart
              mode="classic"
              conforme={stats.conforme}
              nonConforme={stats.nonConforme}
              nonApplicable={stats.nonApplicable}
              notEvaluated={stats.notEvaluated}
            />
          ) : (
            <DonutChart
              mode="design-system"
              defaultCompliant={stats.defaultCompliant}
              projectImplementation={stats.projectImplementation}
              nonApplicable={stats.nonApplicable}
              notEvaluated={stats.notEvaluated}
            />
          )}
        </div>

        {/* Stats cards */}
        <div className="space-y-4">
          {mode === 'classic' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="text-sm text-gray-600 dark:text-gray-400">Conformes</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.conforme}
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900 dark:bg-opacity-20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <div className="text-sm text-gray-600 dark:text-gray-400">Non-conformes</div>
                <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {stats.nonConforme}
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-600 dark:text-gray-400">N/A</div>
                <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">
                  {stats.nonApplicable}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-gray-600 dark:text-gray-400">Non évalués</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.notEvaluated}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 dark:bg-green-900 dark:bg-opacity-20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="text-sm text-gray-600 dark:text-gray-400">Par défaut</div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {stats.defaultCompliant}
                </div>
              </div>

              <div className="bg-teal-50 dark:bg-teal-900 dark:bg-opacity-20 rounded-lg p-4 border border-teal-200 dark:border-teal-800">
                <div className="text-sm text-gray-600 dark:text-gray-400">Implémentation projet</div>
                <div className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                  {stats.projectImplementation}
                </div>
              </div>

              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-600 dark:text-gray-400">N/A</div>
                <div className="text-3xl font-bold text-gray-600 dark:text-gray-300">
                  {stats.nonApplicable}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900 dark:bg-opacity-20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="text-sm text-gray-600 dark:text-gray-400">Non évalués</div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {stats.notEvaluated}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total de critères</div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
          </div>
        </div>
      </div>

      {/* Per-theme breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Résumé par thème
        </h3>
        <ThemeSummaryTable themes={stats.byTheme} mode={mode} />
      </div>
    </div>
  );
}

export default SummaryTab;
