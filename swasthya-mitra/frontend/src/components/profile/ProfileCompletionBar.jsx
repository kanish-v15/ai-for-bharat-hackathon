import { CheckCircle, AlertCircle } from 'lucide-react';

export default function ProfileCompletionBar({ percentage = 0, filledCount = 0, totalCount = 0, missingRequired = [] }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const isComplete = percentage === 100 || missingRequired.length === 0;

  const color = isComplete ? '#0D6E6E' : percentage >= 60 ? '#F59E0B' : '#EF4444';

  return (
    <div className="flex items-center gap-5">
      {/* SVG Ring */}
      <div className="relative w-20 h-20 shrink-0">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" stroke="#F0F0F0" strokeWidth="8" />
          <circle
            cx="50" cy="50" r={radius} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-lg text-dark">{percentage}%</span>
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {isComplete ? (
            <CheckCircle size={16} className="text-india-green shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-amber-500 shrink-0" />
          )}
          <span className="font-heading font-bold text-sm text-dark">
            {isComplete ? 'Profile Complete' : 'Profile Incomplete'}
          </span>
        </div>
        <p className="font-body text-xs text-warm-gray">
          {filledCount} of {totalCount} fields filled
        </p>
        {missingRequired.length > 0 && (
          <p className="font-body text-[11px] text-amber-600 mt-1">
            Missing: {missingRequired.slice(0, 3).map(f => {
              const label = f.split('.').pop().replace(/([A-Z])/g, ' $1').trim();
              return label.charAt(0).toUpperCase() + label.slice(1);
            }).join(', ')}
            {missingRequired.length > 3 && ` +${missingRequired.length - 3} more`}
          </p>
        )}
      </div>
    </div>
  );
}
