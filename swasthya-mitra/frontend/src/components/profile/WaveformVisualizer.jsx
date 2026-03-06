import { useState, useEffect, useRef } from 'react';

/**
 * Real-time audio waveform visualizer.
 * Pass a Web Audio API AnalyserNode to render live frequency bars.
 */
export default function WaveformVisualizer({ analyser, barCount = 20, className = '' }) {
  const [bars, setBars] = useState(new Array(barCount).fill(3));
  const animRef = useRef(null);

  useEffect(() => {
    if (!analyser) {
      setBars(new Array(barCount).fill(3));
      return;
    }

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const animate = () => {
      analyser.getByteFrequencyData(dataArray);
      const step = Math.max(1, Math.floor(dataArray.length / barCount));
      const newBars = [];
      for (let i = 0; i < barCount; i++) {
        const val = dataArray[i * step] || 0;
        newBars.push(Math.max(3, (val / 255) * 32));
      }
      setBars(newBars);
      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [analyser, barCount]);

  return (
    <div className={`flex items-center justify-center gap-[3px] h-8 ${className}`}>
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full bg-gradient-to-t from-primary-500 to-primary-400 transition-all duration-75"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
}
