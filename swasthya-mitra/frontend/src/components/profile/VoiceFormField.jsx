import { useState, useRef } from 'react';
import { Mic, MicOff, CheckCircle, Square } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import recordOrb from '../../../icons/image 96.png';

const SPEECH_LANG_CODES = {
  hindi: 'hi-IN', tamil: 'ta-IN', english: 'en-IN',
  telugu: 'te-IN', kannada: 'kn-IN', malayalam: 'ml-IN',
  bengali: 'bn-IN', marathi: 'mr-IN', gujarati: 'gu-IN',
};

export default function VoiceFormField({
  label, name, value, onChange, type = 'text', options = [],
  required = false, placeholder = '', error = '', disabled = false,
  readOnly = false,
}) {
  const { language } = useLanguage();
  const [isRecording, setIsRecording] = useState(false);
  const [liveText, setLiveText] = useState('');
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LANG_CODES[language] || 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    let finalTranscript = '';

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setLiveText((finalTranscript + interim).trim());
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setLiveText('');
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };

    recognition.onend = () => {
      const result = finalTranscript.trim();
      if (result) onChange(name, result);
      setIsRecording(false);
      setLiveText('');
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };

    recognition.start();
    setIsRecording(true);
    setLiveText('');

    // Auto-stop after 8 seconds for form fields
    timerRef.current = setTimeout(() => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    }, 8000);
  };

  const stopRecording = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
  };

  const handleMicClick = () => {
    if (isRecording) stopRecording();
    else startRecording();
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
        value={isRecording && liveText ? liveText : value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={isRecording ? 'Listening...' : placeholder}
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
        ${error ? 'border-red-300 bg-red-50/30' : isRecording ? 'border-primary-400 bg-primary-50/30 ring-2 ring-primary-200' : 'border-gray-200 hover:border-gray-300 focus-within:border-primary-500'}
        ${readOnly ? 'bg-gray-50' : 'bg-white'}
      `}>
        {renderInput()}

        {/* Mic button */}
        {!readOnly && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={disabled}
            className={`
              relative w-10 h-10 flex items-center justify-center shrink-0 mr-0.5 rounded-full transition-all duration-200 overflow-hidden
              ${isRecording ? 'scale-110' : 'hover:scale-105'}
              disabled:opacity-30
            `}
            title={isRecording ? 'Stop recording' : 'Speak to fill'}
          >
            <img src={recordOrb} alt="" className={`absolute inset-0 w-full h-full object-cover rounded-full ${isRecording ? 'animate-pulse' : ''}`} />
            <span className="relative z-10">
              {isRecording ? <Square size={14} className="text-white drop-shadow-md" fill="white" /> : <Mic size={14} className="text-white drop-shadow-md" strokeWidth={2.5} />}
            </span>
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
