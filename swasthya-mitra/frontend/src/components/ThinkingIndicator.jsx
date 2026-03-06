import { Sparkles, Brain, Mic } from 'lucide-react';

/**
 * Trendy animated thinking/processing indicator.
 *
 * Variants:
 * - "assistant" — AI is thinking (white bg, gray theme)
 * - "user"      — Processing user's voice (blue bg, white theme)
 * - "bar"       — Bottom processing bar (gradient bg)
 */
export default function ThinkingIndicator({ variant = 'assistant', label = 'Thinking...' }) {
  if (variant === 'user') {
    return (
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <Mic size={14} className="text-white/80" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-white/60 rounded-full animate-ping" />
        </div>
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-white/80 rounded-full"
              style={{
                animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
        <span className="text-xs text-white/80 font-body">{label}</span>
      </div>
    );
  }

  if (variant === 'bar') {
    return (
      <div className="flex items-center gap-3 bg-gradient-to-r from-primary-50 via-indigo-50 to-primary-50 border border-primary-200/60 rounded-xl px-4 py-2.5 relative overflow-hidden">
        {/* Shimmer overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
          style={{ animation: 'shimmerSweep 2s ease-in-out infinite' }}
        />
        <div className="relative flex items-center gap-3">
          <div className="relative">
            <Sparkles size={16} className="text-primary-500" style={{ animation: 'sparkleRotate 3s linear infinite' }} />
          </div>
          <div className="flex gap-1 items-center">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1.5 h-1.5 bg-primary-400 rounded-full"
                style={{ animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
          <span className="text-xs text-primary-600 font-heading font-semibold">{label}</span>
        </div>
      </div>
    );
  }

  // Default: assistant variant
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="max-w-[80%] sm:max-w-[70%]">
        <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100 relative overflow-hidden">
          {/* Shimmer background */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50 to-transparent"
            style={{ animation: 'shimmerSweep 2.5s ease-in-out infinite' }}
          />
          <div className="relative flex items-center gap-2.5">
            <div className="relative">
              <Brain size={16} className="text-primary-400" style={{ animation: 'sparkleRotate 4s linear infinite' }} />
            </div>
            <div className="flex gap-1 items-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-2 h-2 bg-primary-300 rounded-full"
                  style={{ animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite` }}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400 font-body">{label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
