import { useState, useRef, useCallback } from 'react';
import { Mic, Square } from 'lucide-react';
import recordOrb from '../../icons/image 96.png';

export default function VoiceRecorder({ onRecordingComplete, maxDuration = 30, disabled = false, compact = false }) {
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

  if (compact) {
    return (
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 shrink-0 overflow-hidden ${
          isRecording ? 'scale-110' : 'hover:scale-105'
        }`}
        title={isRecording ? `Recording ${formatTime(duration)}` : 'Voice input'}
      >
        <img src={recordOrb} alt="" className={`absolute inset-0 w-full h-full object-cover rounded-full ${isRecording ? 'animate-pulse' : ''}`} />
        <span className="relative z-10">
          {isRecording ? <Square size={14} className="text-white drop-shadow-md" /> : <Mic size={16} className="text-white drop-shadow-md" />}
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={disabled}
        className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${
          isRecording ? 'scale-110' : 'hover:scale-105'
        }`}
      >
        <img src={recordOrb} alt="" className={`w-20 h-20 object-contain rounded-full ${isRecording ? 'animate-pulse' : ''}`} />
        <div className="absolute inset-0 flex items-center justify-center">
          {isRecording ? <Square size={28} className="text-white drop-shadow-md" fill="white" /> : <Mic size={28} className="text-white drop-shadow-md" />}
        </div>
        {isRecording && (
          <span className="absolute -inset-2 rounded-full border-2 border-purple-300/60 animate-ping pointer-events-none" />
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
