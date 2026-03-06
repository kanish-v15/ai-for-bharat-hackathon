import { useState, useRef } from 'react';
import { Mic, Square, CheckCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { transcribeAudio } from '../../services/api';
import recordOrb from '../../../icons/image 96.png';

export default function VoiceFormField({
  label, name, value, onChange, type = 'text', options = [],
  required = false, placeholder = '', error = '', disabled = false,
  readOnly = false,
}) {
  const { language } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

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

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size === 0) return;

        // Send to backend for transcription
        setIsTranscribing(true);
        try {
          const transcript = await transcribeAudio(blob, language);
          if (transcript && transcript.trim()) {
            onChange(name, transcript.trim());
          }
        } catch (err) {
          console.error('Transcription failed:', err);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);

      // Auto-stop after 8 seconds for form fields
      timerRef.current = setTimeout(() => {
        stopRecording();
      }, 8000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Please allow microphone access to use voice input.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleMicClick = () => {
    if (isRecording) stopRecording();
    else if (!isTranscribing) startRecording();
  };

  const isFilled = value && (typeof value !== 'string' || value.trim());

  const renderInput = () => {
    const baseClass = 'flex-1 px-4 py-3 text-sm outline-none font-body text-dark placeholder:text-warm-gray/40 bg-transparent';

    if (type === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          disabled={disabled || readOnly}
          className={`${baseClass} appearance-none cursor-pointer`}
        >
          <option value="">{placeholder || 'Select...'}</option>
          {options.map(opt => (
            <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          disabled={disabled || readOnly}
          rows={2}
          className={`${baseClass} resize-none`}
        />
      );
    }

    return (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={isRecording ? 'Recording...' : isTranscribing ? 'Transcribing...' : placeholder}
        disabled={disabled || readOnly}
        className={baseClass}
      />
    );
  };

  return (
    <div className="space-y-1.5">
      {/* Label */}
      <label className="flex items-center gap-1 font-heading font-semibold text-xs text-dark">
        {label}
        {required && <span className="text-red-500">*</span>}
        {isFilled && <CheckCircle size={12} className="text-india-green ml-1" />}
      </label>

      {/* Input + Mic */}
      <div className={`
        flex items-center border-2 rounded-xl overflow-hidden transition-all duration-200
        ${error ? 'border-red-300 bg-red-50/30' : isRecording ? 'border-primary-400 bg-primary-50/30 ring-2 ring-primary-200' : isTranscribing ? 'border-amber-300 bg-amber-50/30 ring-2 ring-amber-200' : 'border-gray-200 hover:border-gray-300 focus-within:border-primary-500'}
        ${readOnly ? 'bg-gray-50' : 'bg-white'}
      `}>
        {renderInput()}

        {/* Mic button */}
        {!readOnly && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={disabled || isTranscribing}
            className={`
              relative w-10 h-10 flex items-center justify-center shrink-0 mr-0.5 rounded-full transition-all duration-200 overflow-hidden
              ${isRecording ? 'scale-110' : 'hover:scale-105'}
              disabled:opacity-30
            `}
            title={isRecording ? 'Stop recording' : isTranscribing ? 'Transcribing...' : 'Speak to fill'}
          >
            {isTranscribing ? (
              <div className="w-full h-full flex items-center justify-center bg-amber-100 rounded-full">
                <Loader2 size={16} className="text-amber-600 animate-spin" />
              </div>
            ) : (
              <>
                <img src={recordOrb} alt="" className={`absolute inset-0 w-full h-full object-cover rounded-full ${isRecording ? 'animate-pulse' : ''}`} />
                <span className="relative z-10">
                  {isRecording ? <Square size={14} className="text-white drop-shadow-md" fill="white" /> : <Mic size={14} className="text-white drop-shadow-md" strokeWidth={2.5} />}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 font-body mt-0.5">{error}</p>
      )}
    </div>
  );
}
