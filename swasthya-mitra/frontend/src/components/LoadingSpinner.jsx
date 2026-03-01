import { Loader2, CheckCircle2 } from 'lucide-react';

export default function LoadingSpinner({ steps = [], currentStep = 0 }) {
  if (steps.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-8">
        <Loader2 size={24} className="animate-spin text-emerald-600" />
        <span className="text-gray-600">Processing...</span>
      </div>
    );
  }

  return (
    <div className="py-6 space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          {i < currentStep ? (
            <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
          ) : i === currentStep ? (
            <Loader2 size={20} className="animate-spin text-emerald-600 shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-gray-200 shrink-0" />
          )}
          <span className={`text-sm ${
            i < currentStep ? 'text-emerald-600' :
            i === currentStep ? 'text-gray-800 font-medium' :
            'text-gray-400'
          }`}>
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}
