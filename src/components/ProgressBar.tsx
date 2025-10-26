import { memo } from 'react';

interface ProgressBarProps {
  progress: number;
}

function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="border border-gray-200 bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm font-semibold text-gray-700">Progression</span>
        <span className="text-lg font-semibold text-gray-900">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-black h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default memo(ProgressBar);
