import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Phone, Keyboard, X, AlertTriangle, Droplets, FileText, Send } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { askCareGuideText } from '../services/api';
import { saveInteraction, getLastLabReport } from '../services/dataStore';
import { LANGUAGES } from '../utils/constants';
import AudioPlayer from '../components/AudioPlayer';
import Disclaimer from '../components/Disclaimer';
import orbImage from '../../icons/image 96.png';

const LOADING_STEPS = {
  hindi: ['आवाज़ रिकॉर्ड हो रही है...', 'भाषा समझी जा रही है...', 'उत्तर तैयार हो रहा है...', 'हिंदी में अनुवाद...', 'ऑडियो बनाया जा रहा है...'],
  tamil: ['குரல் பதிவாகிறது...', 'மொழி புரிந்துகொள்ளப்படுகிறது...', 'பதில் தயாராகிறது...', 'தமிழில் மொழிபெயர்ப்பு...', 'ஆடியோ உருவாக்கப்படுகிறது...'],
  english: ['Recording received...', 'Understanding your question...', 'Preparing answer...', 'Translating...', 'Generating audio...'],
  telugu: ['రికార్డింగ్ అందింది...', 'మీ ప్రశ్నను అర్థం చేసుకుంటోంది...', 'సమాధానం తయారు చేస్తోంది...', 'అనువాదం...', 'ఆడియో తయారు చేస్తోంది...'],
  kannada: ['ರೆಕಾರ್ಡಿಂಗ್ ಸ್ವೀಕರಿಸಲಾಗಿದೆ...', 'ನಿಮ್ಮ ಪ್ರಶ್ನೆಯನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳುತ್ತಿದೆ...', 'ಉತ್ತರ ತಯಾರಿಸುತ್ತಿದೆ...', 'ಅನುವಾದಿಸುತ್ತಿದೆ...', 'ಆಡಿಯೋ ರಚಿಸುತ್ತಿದೆ...'],
  malayalam: ['റെക്കോർഡിംഗ് ലഭിച്ചു...', 'നിങ്ങളുടെ ചോദ്യം മനസ്സിലാക്കുന്നു...', 'ഉത്തരം തയ്യാറാക്കുന്നു...', 'വിവർത്തനം ചെയ്യുന്നു...', 'ഓഡിയോ സൃഷ്ടിക്കുന്നു...'],
  bengali: ['রেকর্ডিং পাওয়া গেছে...', 'আপনার প্রশ্ন বোঝা হচ্ছে...', 'উত্তর প্রস্তুত হচ্ছে...', 'অনুবাদ হচ্ছে...', 'অডিও তৈরি হচ্ছে...'],
  marathi: ['रेकॉर्डिंग प्राप्त झाली...', 'तुमचा प्रश्न समजून घेत आहे...', 'उत्तर तयार करत आहे...', 'अनुवाद करत आहे...', 'ऑडिओ तयार करत आहे...'],
  gujarati: ['રેકોર્ડિંગ મળી...', 'તમારો પ્રશ્ન સમજી રહ્યું છે...', 'જવાબ તૈયાર કરી રહ્યું છે...', 'અનુવાદ કરી રહ્યું છે...', 'ઓડિયો બનાવી રહ્યું છે...'],
};

const PLACEHOLDERS = {
  hindi: 'अपना सवाल टाइप करें...',
  tamil: 'உங்கள் கேள்வியை தட்டச்சு செய்யவும்...',
  english: 'Type your health question...',
  telugu: 'మీ ఆరోగ్య ప్రశ్నను టైప్ చేయండి...',
  kannada: 'ನಿಮ್ಮ ಆರೋಗ್ಯ ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ...',
  malayalam: 'നിങ്ങളുടെ ആരോഗ്യ ചോദ്യം ടൈപ്പ് ചെയ്യുക...',
  bengali: 'আপনার স্বাস্থ্য প্রশ্ন টাইপ করুন...',
  marathi: 'तुमचा आरोग्य प्रश्न टाइप करा...',
  gujarati: 'તમારો આરોગ્ય પ્રશ્ન ટાઈપ કરો...',
};

/* ── AI Orb component (uses iridescent sphere image) ── */
function AiOrb({ isActive, isLoading }) {
  return (
    <div className="relative w-16 h-16 group">
      {/* Outermost ambient glow — always visible, intensifies on active */}
      <div
        className={`absolute inset-[-20px] rounded-full transition-opacity duration-700 ${
          isActive || isLoading ? 'opacity-100' : 'opacity-30 group-hover:opacity-50'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(104,114,255,0.22) 0%, rgba(66,67,212,0.10) 50%, transparent 70%)',
        }}
      />

      {/* Pulsing ring 1 */}
      {(isActive || isLoading) && (
        <div
          className="absolute inset-[-14px] rounded-full border border-primary-300/30"
          style={{ animation: 'pulse-ring 2s ease-out infinite' }}
        />
      )}

      {/* Pulsing ring 2 (offset) */}
      {(isActive || isLoading) && (
        <div
          className="absolute inset-[-8px] rounded-full border border-primary-200/20"
          style={{ animation: 'pulse-ring 2s ease-out 0.5s infinite' }}
        />
      )}

      {/* Orbiting dot accent */}
      {(isActive || isLoading) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-2 h-2 rounded-full bg-primary-400/80"
            style={{ animation: 'orbit 3s linear infinite' }}
          />
        </div>
      )}

      {/* Main orb — PNG image */}
      <img
        src={orbImage}
        alt="AI Assistant"
        className={`w-full h-full rounded-full object-cover transition-transform duration-300 select-none pointer-events-none ${
          isActive || isLoading ? 'scale-110' : 'group-hover:scale-105'
        }`}
        style={{
          filter: isActive || isLoading
            ? 'drop-shadow(0 0 18px rgba(104,114,255,0.35)) drop-shadow(0 0 40px rgba(104,114,255,0.15))'
            : 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
        }}
        draggable={false}
      />
    </div>
  );
}

export default function CareGuide() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const { addNotification } = useNotifications();
  const langConfig = LANGUAGES[language];
  const steps = LOADING_STEPS[language] || LOADING_STEPS.english;

  // Dynamic health context from dataStore
  const lastReport = getLastLabReport();
  const userProfile = null; // from auth context if needed
  const healthContext = [];
  if (lastReport) {
    const flagged = (lastReport.data?.parameters || []).filter(p => p.classification !== 'Normal');
    healthContext.push(
      { icon: FileText, label: 'Last Report', value: lastReport.title?.substring(0, 20) || 'Lab Report' },
    );
    if (flagged.length > 0) {
      healthContext.push({ icon: AlertTriangle, label: 'Flagged', value: `${flagged.length} parameters`, warn: true });
    }
  }

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) try { recognitionRef.current.abort(); } catch {}
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleResponse = (data) => {
    setMessages((prev) => [...prev, {
      role: 'assistant', text: data.answer_translated || data.answer,
      audio_url: data.audio_url, is_emergency: data.is_emergency,
    }]);
    if (data.session_id) setSessionId(data.session_id);
    saveInteraction('care_guide', data);
    addNotification('Health question answered', (data.answer_translated || data.answer).substring(0, 80), 'success', '/care-guide');
    scrollToBottom();
  };

  /* ── Voice input using Web Speech API (browser-based STT) ── */
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = langConfig?.speechCode || 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = true;
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
      setLiveTranscript((finalTranscript + interim).trim());
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        alert('Please allow microphone access to use voice input.');
      }
      setIsRecording(false);
      setLiveTranscript('');
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };

    recognition.onend = () => {
      // Auto-submit if we have text when recognition ends naturally
      if (finalTranscript.trim() && isRecording) {
        handleVoiceSubmit(finalTranscript.trim());
      }
      setIsRecording(false);
      setLiveTranscript('');
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };

    recognition.start();
    setIsRecording(true);
    setLiveTranscript('');
    setRecordDuration(0);
    timerRef.current = setInterval(() => {
      setRecordDuration((d) => {
        if (d + 1 >= 60) { stopRecording(); return 60; }
        return d + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    // Submit whatever we have
    if (liveTranscript.trim()) {
      handleVoiceSubmit(liveTranscript.trim());
    }
    setIsRecording(false);
    setLiveTranscript('');
  };

  const handleVoiceSubmit = async (transcribedText) => {
    if (!transcribedText || isLoading) return;
    setMessages((prev) => [...prev, { role: 'user', text: transcribedText, isVoice: true }]);
    setIsLoading(true); setLoadingStep(0); scrollToBottom();
    const stepInterval = setInterval(() => { setLoadingStep((s) => Math.min(s + 1, 4)); }, 3000);
    try {
      const data = await askCareGuideText(transcribedText, language, 'demo-user', sessionId);
      handleResponse(data);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: err.response?.data?.detail || 'Something went wrong. Please try again.', isError: true }]);
    } finally { clearInterval(stepInterval); setIsLoading(false); }
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim() || isLoading) return;
    const question = textInput.trim();
    setTextInput('');
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setIsLoading(true); setLoadingStep(0); scrollToBottom();
    const stepInterval = setInterval(() => { setLoadingStep((s) => Math.min(s + 1, 4)); }, 3000);
    try {
      const data = await askCareGuideText(question, language, 'demo-user', sessionId);
      handleResponse(data);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', text: err.response?.data?.detail || 'Something went wrong. Please try again.', isError: true }]);
    } finally { clearInterval(stepInterval); setIsLoading(false); }
  };

  const clearSession = () => {
    setMessages([]);
    setSessionId(null);
    setShowTextInput(false);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className="h-[calc(100vh-130px)] flex flex-col overflow-hidden rounded-3xl relative noise">
      {/* ── Layered gradient background ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-cream to-primary-50/20 pointer-events-none" />
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 mesh-gradient pointer-events-none" />
      {/* Subtle radial accent at bottom center for orb area */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 100%, rgba(104,114,255,0.04) 0%, rgba(66,67,212,0.02) 40%, transparent 70%)',
        }}
      />

      {/* ── Top Context Strip — Frosted glass bar ── */}
      <div className="relative z-10 glass border-b border-white/60 px-5 py-2.5">
        <div className="flex items-center justify-between mb-2">
          <span className="font-heading text-xs font-semibold text-dark tracking-wide uppercase">
            Health Context
          </span>
          {messages.length > 0 && (
            <button
              onClick={clearSession}
              className="text-[11px] text-primary-500 hover:text-primary-600 font-heading font-medium tracking-wide transition-colors"
            >
              Clear session
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-0.5 -mb-0.5">
          {healthContext.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-white/80 shadow-premium">
              <p className="text-[10px] text-warm-gray font-body">No health data yet. Use Lab Samjho to build your health context.</p>
            </div>
          )}
          {healthContext.map(({ icon: Icon, label, value, warn }) => (
            <div
              key={label}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full shrink-0 border transition-all ${
                warn
                  ? 'bg-amber-50/80 border-amber-200/60'
                  : 'bg-white/70 border-white/80 hover:border-primary-200/50'
              } shadow-premium`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                  warn ? 'bg-amber-100' : 'bg-primary-50'
                }`}
              >
                <Icon size={12} className={warn ? 'text-amber-600' : 'text-primary-500'} />
              </div>
              <div className="pr-1">
                <p className="text-[9px] uppercase tracking-widest text-warm-gray/60 font-heading font-medium leading-none mb-0.5">
                  {label}
                </p>
                <p className={`text-xs font-body font-semibold leading-none ${warn ? 'text-amber-700' : 'text-dark'}`}>
                  {value}
                </p>
              </div>
              {warn && (
                <span className="text-[8px] px-1.5 py-0.5 bg-amber-200/70 text-amber-800 rounded-full font-heading font-bold">
                  !
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Fade overlay at top of transcript ── */}
      <div className="relative z-[5] h-20 bg-gradient-to-b from-cream via-cream/80 to-transparent -mb-20 pointer-events-none" />

      {/* ── Centered Transcript Area ── */}
      <div className="flex-1 overflow-y-auto relative z-[1] chat-scroll">
        <div className="max-w-[700px] mx-auto px-6 sm:px-8 pt-24 pb-10 flex flex-col gap-8 text-center min-h-full justify-center">

          {/* Empty state — elegant welcome */}
          {messages.length === 0 && !isLoading && (
            <div className="space-y-4 animate-fade-in">
              <p className="font-body text-sm sm:text-base text-warm-gray/60 leading-relaxed max-w-md mx-auto">
                Namaste! I'm your AI health companion. Ask me any health question
                — I understand Hindi, Tamil, Telugu, and 5 more Indian languages.
              </p>
              <p className="font-display text-xl sm:text-2xl text-dark leading-snug">
                Tap the orb to start speaking, or use the keyboard to type your question.
              </p>
            </div>
          )}

          {/* Messages — centered transcript style */}
          {messages.map((msg, i) => {
            const isLast = i === messages.length - 1 && !isLoading;
            const isUser = msg.role === 'user';

            return (
              <div
                key={i}
                className={`space-y-2 transition-all duration-500 ${isLast ? 'animate-slide-up' : ''}`}
              >
                {/* Role label */}
                <p
                  className={`text-[10px] uppercase tracking-[0.2em] font-heading font-semibold ${
                    isUser ? 'text-primary-400' : 'text-warm-gray/40'
                  }`}
                >
                  {isUser ? 'You' : 'SwasthyaMitra'}
                </p>

                {/* Emergency badge */}
                {msg.is_emergency && (
                  <div className="inline-flex items-center gap-1.5 bg-red-500/10 text-red-600 px-4 py-1.5 rounded-full text-xs font-heading font-bold tracking-wide mx-auto border border-red-200/50">
                    <AlertTriangle size={13} />
                    EMERGENCY — Call 108 / 112
                  </div>
                )}

                {/* Message text */}
                <p
                  className={`leading-relaxed transition-all duration-500 ${
                    isLast
                      ? 'font-display text-xl sm:text-2xl text-dark'
                      : 'font-body text-base text-warm-gray/50'
                  } ${msg.isError ? '!text-red-500 !font-body !text-base' : ''}`}
                >
                  {msg.text}
                </p>

                {/* Audio player */}
                {msg.audio_url && (
                  <div className="flex justify-center mt-3">
                    <AudioPlayer audioUrl={msg.audio_url} label="Listen" autoPlay={isLast && !isUser} />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading state */}
          {isLoading && (
            <div className="space-y-2 animate-fade-in">
              <p className="text-[10px] uppercase tracking-[0.2em] font-heading font-semibold text-warm-gray/40">
                SwasthyaMitra
              </p>
              <div className="flex items-center justify-center gap-2">
                <p className="font-body text-base text-warm-gray/50">{steps[loadingStep]}</p>
                <span className="flex gap-1">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Bottom Controls Panel ── */}
      <div className="relative z-10 pb-5 pt-2 px-6">
        {/* Disclaimer — compact */}
        <div className="max-w-[600px] mx-auto mb-3">
          <Disclaimer />
        </div>

        {/* Recording indicator bar */}
        {isRecording && (
          <div className="flex items-center justify-center gap-3 mb-4 animate-fade-in">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-xs text-red-500 font-heading font-semibold tracking-wider">
              Recording {formatTime(recordDuration)}
            </span>
            <div className="h-3 w-px bg-red-200" />
            <span className="text-[10px] text-red-400/80 font-body">max 60s</span>
          </div>
        )}

        {/* Live transcript while recording */}
        {isRecording && liveTranscript && (
          <div className="max-w-[600px] mx-auto mb-3 px-4 py-2 bg-white/80 rounded-xl border border-primary-200/40 animate-fade-in">
            <p className="text-sm text-dark font-body italic text-center">{liveTranscript}</p>
          </div>
        )}

        {/* Text input (slides up, toggleable) */}
        {showTextInput && (
          <form
            onSubmit={handleTextSubmit}
            className="max-w-[600px] mx-auto mb-4 flex gap-2.5 animate-slide-up"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={PLACEHOLDERS[language] || PLACEHOLDERS.english}
                disabled={isLoading}
                autoFocus
                className="w-full px-5 py-3.5 rounded-2xl bg-white/90 border border-white/80 font-body text-sm text-dark shadow-premium focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-300 disabled:opacity-50 placeholder:text-warm-gray/40 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!textInput.trim() || isLoading}
              className="w-10 h-10 bg-primary-500 text-white rounded-2xl hover:bg-primary-600 disabled:opacity-30 transition-all duration-200 flex items-center justify-center shrink-0 shadow-premium active:scale-95"
            >
              <Send size={16} />
            </button>
          </form>
        )}

        {/* ── Voice controls row ── */}
        <div className="flex items-center justify-center gap-7">
          {/* Left button: Mic / Mute */}
          <button
            onClick={() => {
              if (isRecording) { setIsMuted(!isMuted); }
              else { startRecording(); }
            }}
            disabled={isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 active:scale-95 disabled:opacity-40 ${
              isRecording
                ? isMuted
                  ? 'bg-red-50 border-red-300 text-red-500 shadow-premium'
                  : 'bg-white/90 border-white/80 text-dark shadow-premium hover:border-primary-200'
                : 'bg-white/90 border-white/80 text-warm-gray shadow-premium hover:text-primary-500 hover:border-primary-200 hover:shadow-glow-primary'
            }`}
            title={isRecording ? (isMuted ? 'Unmute' : 'Mute') : 'Start recording'}
          >
            {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Center: AI Orb (tappable, starts/stops recording) */}
          <button
            onClick={() => {
              if (isRecording) stopRecording();
              else startRecording();
            }}
            disabled={isLoading}
            className="disabled:opacity-40 transition-transform duration-300 active:scale-90 cursor-pointer"
            title={isRecording ? 'Stop & send' : 'Tap to speak'}
          >
            <AiOrb isActive={isRecording} isLoading={isLoading} />
          </button>

          {/* Right button: End call (recording) / Keyboard toggle (idle) */}
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white shadow-premium hover:bg-red-600 transition-all duration-200 active:scale-95"
              title="Stop recording"
              style={{
                boxShadow: '0 0 0 3px rgba(239,68,68,0.15), 0 4px 16px rgba(239,68,68,0.25)',
              }}
            >
              <Phone size={18} className="rotate-[135deg]" />
            </button>
          ) : (
            <button
              onClick={() => setShowTextInput(!showTextInput)}
              className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-200 active:scale-95 ${
                showTextInput
                  ? 'bg-primary-500 text-white border-primary-500 shadow-glow-primary'
                  : 'bg-white/90 border-white/80 text-warm-gray shadow-premium hover:text-primary-500 hover:border-primary-200 hover:shadow-glow-primary'
              }`}
              title={showTextInput ? 'Hide keyboard' : 'Type instead'}
            >
              {showTextInput ? <X size={18} /> : <Keyboard size={18} />}
            </button>
          )}
        </div>

        {/* Helper text */}
        {!isRecording && !showTextInput && (
          <p className="text-[11px] text-warm-gray/40 text-center mt-3 font-heading tracking-wide">
            Tap the orb to speak
          </p>
        )}
      </div>
    </div>
  );
}
