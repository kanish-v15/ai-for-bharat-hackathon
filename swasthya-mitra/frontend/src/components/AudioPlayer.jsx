import { useState, useRef, useEffect } from 'react';
import { Pause, Play, Volume2 } from 'lucide-react';

export default function AudioPlayer({ audioUrl, label = 'Listen', autoPlay = false }) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (autoPlay && audioUrl && audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  }, [audioUrl, autoPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setProgress(0); setCurrentTime(0); };
    const onTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
        setCurrentTime(audio.currentTime);
      }
    };
    const onLoadedMetadata = () => {
      if (audio.duration && isFinite(audio.duration)) setDuration(audio.duration);
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);

    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !audioRef.current.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, x / rect.width));
    audioRef.current.currentTime = pct * audioRef.current.duration;
  };

  const fmt = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!audioUrl) return null;

  // Generate fake waveform bars for visual effect
  const bars = [3, 5, 8, 4, 7, 10, 6, 9, 4, 7, 11, 5, 8, 3, 6, 9, 5, 7, 4, 8, 10, 6, 3, 7, 5, 9, 4, 6, 8, 3];

  return (
    <div className="flex items-center gap-2.5 bg-gradient-to-r from-gray-50 to-gray-100/80 backdrop-blur-sm rounded-2xl px-3 py-2 border border-gray-200/60 shadow-sm group hover:shadow-md transition-all duration-300">
      <audio ref={audioRef} src={audioUrl} preload="auto" />

      {/* Play/Pause button */}
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 active:scale-90 ${
          isPlaying
            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-200'
            : 'bg-white text-primary-600 shadow-sm border border-gray-200 hover:border-primary-200 hover:shadow-md'
        }`}
      >
        {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
      </button>

      {/* Waveform + progress */}
      <div className="flex-1 min-w-0">
        <div
          className="flex items-center gap-[2px] h-8 cursor-pointer px-1"
          onClick={handleSeek}
        >
          {bars.map((h, i) => {
            const barPct = ((i + 1) / bars.length) * 100;
            const isActive = barPct <= progress;
            const isCurrent = Math.abs(barPct - progress) < 4;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-200 ${
                  isActive
                    ? isCurrent
                      ? 'bg-primary-500 scale-110'
                      : 'bg-primary-400'
                    : 'bg-gray-300/60 group-hover:bg-gray-300'
                }`}
                style={{
                  height: `${h * 2.5}px`,
                  minWidth: '2px',
                  maxWidth: '4px',
                }}
              />
            );
          })}
        </div>

        {/* Time + label */}
        <div className="flex items-center justify-between px-1 -mt-0.5">
          <div className="flex items-center gap-1">
            <Volume2 size={10} className="text-primary-400" />
            <span className="text-[9px] font-medium text-gray-400">{label}</span>
          </div>
          <span className="text-[9px] font-mono text-gray-400 tabular-nums">
            {fmt(currentTime)}{duration > 0 ? ` / ${fmt(duration)}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
