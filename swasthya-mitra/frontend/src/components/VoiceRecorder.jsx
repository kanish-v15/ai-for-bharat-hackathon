import { useState, useRef, useCallback } from 'react';
import { Mic, Square } from 'lucide-react';

export default function VoiceRecorder({ onRecordingComplete, maxDuration = 30, disabled = false }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      chunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
        onRecordingComplete(blob);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => {
          if (d + 1 >= maxDuration) {
            stopRecording();
            return maxDuration;
          }
          return d + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Please allow microphone access to use voice input.');
    }
  }, [maxDuration, onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
          isRecording
            ? 'bg-red-500 animate-pulse'
            : 'bg-emerald-600 hover:bg-emerald-700'
        }`}
      >
        {isRecording ? <Square size={28} /> : <Mic size={28} />}
        {isRecording && (
          <span className="absolute -inset-2 rounded-full border-2 border-red-400 animate-ping opacity-40" />
        )}
      </button>
      <span className="text-sm text-gray-500">
        {isRecording
          ? `Recording... ${formatTime(duration)} / ${formatTime(maxDuration)}`
          : 'Tap to speak'}
      </span>
    </div>
  );
}
