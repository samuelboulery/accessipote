interface DonutChartClassicProps {
  mode: 'classic';
  conforme: number;
  nonConforme: number;
  nonApplicable: number;
  notEvaluated: number;
  size?: number;
}

interface DonutChartDSProps {
  mode: 'design-system';
  defaultCompliant: number;
  projectImplementation: number;
  nonApplicable: number;
  notEvaluated: number;
  size?: number;
}

type DonutChartProps = DonutChartClassicProps | DonutChartDSProps;

function DonutChart(props: DonutChartProps) {
  const { mode, nonApplicable, notEvaluated, size = 160 } = props;

  let rate: number | null;
  let segmentsData: { value: number; color: string; label: string }[];

  if (mode === 'classic') {
    const { conforme, nonConforme } = props;
    const denominator = conforme + nonConforme;
    rate = denominator === 0 ? null : Math.round((conforme / denominator) * 100);
    segmentsData = [
      { value: conforme, color: '#22c55e', label: 'Conforme' },
      { value: nonConforme, color: '#ef4444', label: 'Non-conforme' },
      { value: nonApplicable, color: '#9ca3af', label: 'N/A' },
      { value: notEvaluated, color: '#e5e7eb', label: 'Non évalué' },
    ];
  } else {
    const { defaultCompliant, projectImplementation } = props;
    const covered = defaultCompliant + projectImplementation;
    const total = covered + nonApplicable + notEvaluated;
    const dsDenominator = total - notEvaluated - nonApplicable;
    rate = dsDenominator === 0 ? null : Math.round((covered / dsDenominator) * 100);
    segmentsData = [
      { value: defaultCompliant, color: '#22c55e', label: 'Par défaut' },
      { value: projectImplementation, color: '#0d9488', label: 'Implémentation projet' },
      { value: nonApplicable, color: '#9ca3af', label: 'N/A' },
      { value: notEvaluated, color: '#e5e7eb', label: 'Non évalué' },
    ];
  }

  const total = segmentsData.reduce((sum, s) => sum + s.value, 0);

  // SVG donut dimensions
  const radius = size / 2 - 8;
  const circumference = 2 * Math.PI * radius;

  // Calculate stroke offsets for each segment
  let offset = 0;
  const segments: { percentage: number; color: string; label: string; offset: number }[] = [];

  if (total === 0) {
    segments.push({
      percentage: 100,
      color: '#e5e7eb',
      label: 'Vide',
      offset: 0,
    });
  } else {
    for (const segment of segmentsData) {
      if (segment.value > 0) {
        const percentage = (segment.value / total) * 100;
        const length = (percentage / 100) * circumference;
        segments.push({
          percentage,
          color: segment.color,
          label: segment.label,
          offset,
        });
        offset += length;
      }
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative inline-flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg p-4">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="2"
            className="dark:stroke-gray-700"
          />

          {/* Donut segments */}
          {segments.map((segment, index) => {
            const length = (segment.percentage / 100) * circumference;
            return (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="6"
                strokeDasharray={`${length} ${circumference - length}`}
                strokeDashoffset={-segment.offset}
                strokeLinecap="round"
              />
            );
          })}
        </svg>

        {/* Center text */}
        <div className="absolute flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {rate === null ? '–' : `${rate}%`}
          </div>
        </div>
      </div>

      {/* Legend */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-2 text-sm">
          {segments.map((segment, index) => (
            segment.percentage > 0 && (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-gray-700 dark:text-gray-300">{segment.label}</span>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}

export default DonutChart;
