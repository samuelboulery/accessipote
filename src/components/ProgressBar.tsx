import { memo } from 'react';
import { getProgressColorClass } from '../utils/getProgressColorClass';

interface ProgressBarProps {
  progress: number;
}

function ProgressBar({ progress }: ProgressBarProps) {
  const roundedProgress = Math.round(progress);

  return (
    <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Progression</span>
        <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{roundedProgress}%</span>
      </div>
      <div
        className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5"
        role="progressbar"
        aria-valuenow={roundedProgress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`${getProgressColorClass(roundedProgress)} h-full rounded-full transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default memo(ProgressBar);
