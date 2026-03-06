/**
 * Pure CSS animated robot that runs left→right.
 * Shows above the disclaimer when AI is processing.
 */
export default function RunningRobot() {
  return (
    <div className="relative w-full h-10 overflow-hidden pointer-events-none">
      <div
        className="absolute top-0"
        style={{ animation: 'robotRun 3.5s linear infinite' }}
      >
        {/* Robot body — pure CSS */}
        <div className="relative w-10 h-10">
          {/* Head */}
          <div className="absolute top-0 left-1.5 w-7 h-5 bg-primary-500 rounded-t-lg rounded-b-sm">
            {/* Eyes */}
            <div className="absolute top-1.5 left-1 w-1.5 h-1.5 bg-white rounded-full" />
            <div className="absolute top-1.5 right-1 w-1.5 h-1.5 bg-white rounded-full">
              <div className="absolute top-0.5 right-0 w-0.5 h-0.5 bg-primary-800 rounded-full" />
            </div>
            {/* Antenna */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0.5 h-2 bg-primary-400">
              <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-400 rounded-full"
                style={{ animation: 'dotPulse 1s ease-in-out infinite' }} />
            </div>
          </div>
          {/* Body */}
          <div className="absolute top-5 left-2 w-6 h-3 bg-primary-600 rounded-sm" />
          {/* Left leg */}
          <div
            className="absolute top-8 left-2.5 w-1.5 h-2.5 bg-primary-700 rounded-b-sm origin-top"
            style={{ animation: 'legRun 0.4s ease-in-out infinite alternate' }}
          />
          {/* Right leg */}
          <div
            className="absolute top-8 right-2.5 w-1.5 h-2.5 bg-primary-700 rounded-b-sm origin-top"
            style={{ animation: 'legRun 0.4s ease-in-out infinite alternate-reverse' }}
          />
          {/* Left arm */}
          <div
            className="absolute top-5 -left-0.5 w-1.5 h-3 bg-primary-500 rounded-b-sm origin-top"
            style={{ animation: 'armRun 0.4s ease-in-out infinite alternate-reverse' }}
          />
          {/* Right arm */}
          <div
            className="absolute top-5 -right-0.5 w-1.5 h-3 bg-primary-500 rounded-b-sm origin-top"
            style={{ animation: 'armRun 0.4s ease-in-out infinite alternate' }}
          />
        </div>
      </div>
    </div>
  );
}
