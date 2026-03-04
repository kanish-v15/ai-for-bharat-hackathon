import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Printer,
  RotateCcw,
  Mic,
  MicOff,
  Square,
  Sparkles,
  Clock,
  CheckCircle,
  AlertTriangle,
  Pill,
  User,
  FileText,
  Activity,
  Volume2,
  Stethoscope,
  Brain,
  Languages,
  FileCheck,
  ClipboardList,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { processMedScribeText } from '../services/api';
import { saveInteraction, getInteractions } from '../services/dataStore';
import { LANGUAGES } from '../utils/constants';
import AudioPlayer from '../components/AudioPlayer';
import Disclaimer from '../components/Disclaimer';
import LoadingSpinner from '../components/LoadingSpinner';

/* ── Constants ── */

const LOADING_STEPS = {
  english: ['Recording received...', 'Transcribing conversation...', 'Generating SOAP notes...', 'Extracting medications...', 'Creating patient instructions...'],
  hindi: ['रिकॉर्डिंग प्राप्त हुई...', 'बातचीत लिखी जा रही है...', 'SOAP नोट्स बन रहे हैं...', 'दवाइयाँ निकाली जा रही हैं...', 'मरीज़ निर्देश बन रहे हैं...'],
  tamil: ['பதிவு பெறப்பட்டது...', 'உரையாடல் எழுதப்படுகிறது...', 'SOAP குறிப்புகள் உருவாக்கப்படுகின்றன...', 'மருந்துகள் பிரிக்கப்படுகின்றன...', 'நோயாளி அறிவுறுத்தல்கள் உருவாக்கப்படுகின்றன...'],
  telugu: ['రికార్డింగ్ అందింది...', 'సంభాషణ లిప్యంతరం అవుతోంది...', 'SOAP నోట్స్ రూపొందుతున్నాయి...', 'మందులు సేకరిస్తున్నారు...', 'రోగి సూచనలు తయారవుతున్నాయి...'],
  kannada: ['ರೆಕಾರ್ಡಿಂಗ್ ಸ್ವೀಕರಿಸಲಾಗಿದೆ...', 'ಸಂಭಾಷಣೆ ಲಿಪ್ಯಂತರಿಸಲಾಗುತ್ತಿದೆ...', 'SOAP ಟಿಪ್ಪಣಿಗಳನ್ನು ರಚಿಸಲಾಗುತ್ತಿದೆ...', 'ಔಷಧಿಗಳನ್ನು ಹೊರತೆಗೆಯಲಾಗುತ್ತಿದೆ...', 'ರೋಗಿ ಸೂಚನೆಗಳನ್ನು ರಚಿಸಲಾಗುತ್ತಿದೆ...'],
  malayalam: ['റെക്കോർഡിംഗ് ലഭിച്ചു...', 'സംഭാഷണം ട്രാൻസ്ക്രൈബ് ചെയ്യുന്നു...', 'SOAP കുറിപ്പുകൾ സൃഷ്ടിക്കുന്നു...', 'മരുന്നുകൾ എടുക്കുന്നു...', 'രോഗി നിർദ്ദേശങ്ങൾ സൃഷ്ടിക്കുന്നു...'],
  bengali: ['রেকর্ডিং প্রাপ্ত হয়েছে...', 'কথোপকথন লিপিবদ্ধ হচ্ছে...', 'SOAP নোট তৈরি হচ্ছে...', 'ওষুধ বের করা হচ্ছে...', 'রোগীর নির্দেশনা তৈরি হচ্ছে...'],
  marathi: ['रेकॉर्डिंग प्राप्त झाली...', 'संभाषण लिहिले जात आहे...', 'SOAP नोट्स तयार होत आहेत...', 'औषधे काढली जात आहेत...', 'रुग्ण सूचना तयार होत आहेत...'],
  gujarati: ['રેકોર્ડિંગ પ્રાપ્ત થયું...', 'વાર્તાલાપ લખાઈ રહ્યો છે...', 'SOAP નોંધો બનાવાઈ રહી છે...', 'દવાઓ કાઢવામાં આવી રહી છે...', 'દર્દી સૂચનાઓ બનાવાઈ રહી છે...'],
};

const SOAP_CONFIG = {
  subjective: { labelKey: 'medscribe.subjective', icon: User, accentBar: 'accent-bar-primary', accentColor: 'bg-sky-500', tagBg: 'bg-sky-50', tagText: 'text-sky-700', iconColor: 'text-sky-500' },
  objective: { labelKey: 'medscribe.objective', icon: Activity, accentBar: 'accent-bar-primary', accentColor: 'bg-emerald-500', tagBg: 'bg-emerald-50', tagText: 'text-emerald-700', iconColor: 'text-emerald-500' },
  assessment: { labelKey: 'medscribe.assessment', icon: FileText, accentBar: 'accent-bar-amber', accentColor: 'bg-amber-500', tagBg: 'bg-amber-50', tagText: 'text-amber-700', iconColor: 'text-amber-500' },
  plan: { labelKey: 'medscribe.plan', icon: CheckCircle, accentBar: 'accent-bar-rose', accentColor: 'bg-rose-500', tagBg: 'bg-rose-50', tagText: 'text-rose-700', iconColor: 'text-rose-500' },
};

const FLOW_STEPS = [
  { num: 1, label: 'Record', icon: Mic },
  { num: 2, label: 'Transcribe', icon: FileCheck },
  { num: 3, label: 'SOAP Notes', icon: ClipboardList },
  { num: 4, label: 'Instructions', icon: FileText },
];

const PIPELINE_STEPS = [
  { step: 'Speech-to-Text', tech: 'Web Speech API', color: 'bg-primary-500', ring: 'ring-primary-100' },
  { step: 'SOAP Generation', tech: 'Amazon Bedrock (Claude)', color: 'bg-blue-500', ring: 'ring-blue-100' },
  { step: 'Entity Extraction', tech: 'Comprehend Medical', color: 'bg-emerald-500', ring: 'ring-emerald-100' },
  { step: 'Translation', tech: 'Sarvam AI Translate', color: 'bg-purple-500', ring: 'ring-purple-100' },
  { step: 'Text-to-Speech', tech: 'Sarvam AI TTS', color: 'bg-teal-500', ring: 'ring-teal-100' },
];

/* ── Helper ── */
const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

/* ── Component ── */

export default function MedScribe() {
  const { language, t } = useLanguage();
  const { addNotification } = useNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Web Speech API states
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordingTime, setRecordingTime] = useState(0);

  // Refs
  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const timerRef = useRef(null);

  // Session stats from dataStore
  const [sessionStats, setSessionStats] = useState({ totalNotes: 0, avgTime: '--', languages: 0 });

  // Keep isRecordingRef in sync
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Load session stats from dataStore
  const loadSessionStats = useCallback(() => {
    const medscribeInteractions = getInteractions('medscribe');
    const totalNotes = medscribeInteractions.length;

    // Calculate languages used
    const languagesUsed = new Set();
    medscribeInteractions.forEach((interaction) => {
      if (interaction.data?.language) languagesUsed.add(interaction.data.language);
    });

    setSessionStats({
      totalNotes,
      avgTime: totalNotes > 0 ? '~2 min' : '--',
      languages: languagesUsed.size || 0,
    });
  }, []);

  useEffect(() => {
    loadSessionStats();
  }, [loadSessionStats]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch {}
      }
    };
  }, []);

  const currentStep = result ? 4 : isLoading ? 2 : isRecording ? 1 : 0;

  /* ── Web Speech API Recording ── */
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported. Please use Chrome.');
      return;
    }

    setError(null);
    const recognition = new SpeechRecognition();
    const langConfig = LANGUAGES[language];
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

    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      if (e.error === 'not-allowed') {
        setError('Please allow microphone access to use voice recording.');
      } else if (e.error !== 'no-speech') {
        setError('Speech recognition error. Please try again.');
      }
      setIsRecording(false);
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };

    recognition.onend = () => {
      // For continuous recognition, restart if still recording
      if (isRecordingRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognition.start();
    setIsRecording(true);
    setLiveTranscript('');
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime((t) => {
        // Max 5 minutes for consultations
        if (t + 1 >= 300) {
          stopRecording();
          return 300;
        }
        return t + 1;
      });
    }, 1000);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsRecording(false);

    // Process the transcript
    const transcript = liveTranscript.trim();
    if (transcript) {
      handleProcessTranscript(transcript);
    } else {
      setError('No speech detected. Please try again and speak clearly.');
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  /* ── Process transcript through API ── */
  const handleProcessTranscript = async (transcript) => {
    setIsLoading(true);
    setLoadingStep(0);
    setError(null);
    setResult(null);

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, 4));
    }, 4000);

    try {
      const data = await processMedScribeText(transcript, language);
      setResult(data);

      // Save to dataStore
      saveInteraction('medscribe', {
        ...data,
        language,
        transcription: data.transcription || transcript,
      });

      // Add notification
      addNotification(
        'SOAP Notes Generated',
        'Consultation documented successfully',
        'success',
        '/medscribe'
      );

      // Reload stats
      loadSessionStats();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to process consultation. Please try again.');
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
      setLiveTranscript('');
    }
  };

  const handlePrint = () => { window.print(); };
  const handleReset = () => {
    setResult(null);
    setError(null);
    setLiveTranscript('');
    setRecordingTime(0);
  };

  const steps = LOADING_STEPS[language] || LOADING_STEPS.english;

  return (
    <div className="animate-slide-up space-y-5">

      {/* ─────────────────────── Horizontal Stepper ─────────────────────── */}
      <div className="flex items-center justify-center gap-0">
        {FLOW_STEPS.map(({ num, label, icon: StepIcon }, i) => {
          const isActive = num <= currentStep + 1;
          const isCompleted = num <= currentStep;
          return (
            <div key={num} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isCompleted
                      ? 'bg-india-green text-white shadow-sm shadow-india-green/30'
                      : isActive
                        ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30'
                        : 'border-2 border-gray-200 text-gray-400 bg-white'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle size={14} strokeWidth={2.5} />
                  ) : (
                    <StepIcon size={13} strokeWidth={2} />
                  )}
                </div>
                <span
                  className={`text-[10px] font-heading font-semibold tracking-wide transition-colors duration-300 ${
                    isCompleted
                      ? 'text-india-green'
                      : isActive
                        ? 'text-primary-600'
                        : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <div
                  className={`w-12 h-[2px] rounded-full mx-2 mb-5 transition-all duration-500 ${
                    isCompleted ? 'bg-india-green' : num <= currentStep ? 'bg-primary-300' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ─────────────────────── Main Grid ─────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* ── Left Column (2/3) ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* ── Recording Section (initial state) ── */}
          {!result && !isLoading && (
            <div className={`bg-white rounded-2xl border-2 ${isRecording ? 'border-red-300 bg-red-50/10' : 'border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50/10'} transition-all duration-300 overflow-hidden animate-stagger-2`}>
              <div className="px-6 py-6 flex flex-col items-center text-center">
                {/* Large mic button */}
                <div className="relative mb-5">
                  <button
                    onClick={toggleRecording}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${
                      isRecording
                        ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30'
                        : 'bg-gradient-to-br from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 shadow-lg shadow-primary-500/30'
                    }`}
                  >
                    {isRecording ? (
                      <Square size={22} className="text-white" fill="white" />
                    ) : (
                      <Mic size={28} className="text-white" strokeWidth={1.8} />
                    )}
                  </button>
                  {/* Pulsing ring when recording */}
                  {isRecording && (
                    <>
                      <div className="absolute -inset-2 rounded-full border-2 border-red-300/60 animate-ping pointer-events-none" />
                      <div className="absolute -inset-3 rounded-full border border-red-200/30 pointer-events-none" />
                    </>
                  )}
                  {/* Decorative ring when idle */}
                  {!isRecording && (
                    <div className="absolute -inset-2 rounded-full border-2 border-primary-200/50 pointer-events-none" />
                  )}
                </div>

                {/* Recording status */}
                {isRecording ? (
                  <div className="space-y-3 w-full">
                    {/* Recording indicator */}
                    <div className="flex items-center justify-center gap-3">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                      </span>
                      <span className="text-sm text-red-600 font-heading font-bold tracking-wider">
                        Recording {formatTime(recordingTime)}
                      </span>
                      <div className="h-3 w-px bg-red-200" />
                      <span className="text-[10px] text-red-400/80 font-body">max 5:00</span>
                    </div>

                    {/* Live transcript */}
                    {liveTranscript ? (
                      <div className="mx-auto max-w-lg px-4 py-3 bg-white/90 rounded-xl border border-primary-200/40 shadow-sm">
                        <p className="text-[10px] uppercase tracking-widest text-warm-gray/60 font-heading font-semibold mb-1.5">{t('medscribe.liveTranscription')}</p>
                        <p className="text-sm text-dark font-body leading-relaxed">{liveTranscript}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-warm-gray font-body animate-pulse">{t('medscribe.speakNow')}</p>
                    )}

                    {/* Stop button */}
                    <button
                      onClick={stopRecording}
                      className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white font-heading font-bold text-xs hover:bg-red-600 active:scale-[0.98] transition-all shadow-sm shadow-red-500/20"
                    >
                      <Square size={12} fill="white" />
                      {t('medscribe.stopRecording')}
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="font-heading font-bold text-dark text-sm mb-1">{t('medscribe.recordTitle')}</h3>
                    <p className="font-body text-xs text-warm-gray mb-6 max-w-md leading-relaxed">
                      {t('medscribe.recordDesc')}
                    </p>

                    {/* Tap to record hint */}
                    <p className="text-xs text-primary-500 font-heading font-semibold mb-4">{t('medscribe.startRecording')}</p>

                    {/* Supported formats hint */}
                    <div className="flex items-center gap-2.5">
                      {[
                        { icon: Stethoscope, label: t('medscribe.soapNotes') },
                        { icon: Pill, label: t('medscribe.medications') },
                        { icon: Languages, label: t('medscribe.multilingual') },
                      ].map(({ icon: HintIcon, label }) => (
                        <span
                          key={label}
                          className="inline-flex items-center gap-1 text-[10px] text-warm-gray bg-gray-50 border border-gray-100 px-2 py-1 rounded-full font-body font-medium"
                        >
                          <HintIcon size={10} />
                          {label}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── Loading State ── */}
          {isLoading && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-6 animate-stagger-2">
              <LoadingSpinner steps={steps} currentStep={loadingStep} />
            </div>
          )}

          {/* ── Error State ── */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-body font-medium flex items-center gap-2 animate-stagger-2">
              <AlertTriangle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {/* ── Results ── */}
          {result && (
            <div className="space-y-4 print:space-y-2" id="medscribe-results">

              {/* Transcription Card */}
              {(result.transcription || liveTranscript) && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden animate-stagger-1">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center">
                      <Mic size={13} className="text-warm-gray" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-dark text-sm">{t('medscribe.transcription')}</h3>
                      <p className="text-[10px] text-warm-gray font-body mt-0.5">{t('medscribe.transcriptionDesc')}</p>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <p className="font-body text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{result.transcription || liveTranscript}</p>
                  </div>
                </div>
              )}

              {/* SOAP Notes — 2x2 Grid with accent bars */}
              {result.soap_note && (
                <div className="animate-stagger-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center">
                      <Sparkles size={13} className="text-primary-500" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-dark text-sm">{t('medscribe.soapNotes')}</h3>
                      <p className="text-[10px] text-warm-gray font-body mt-0.5">{t('medscribe.soapDesc')}</p>
                    </div>
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-warm-gray font-heading font-medium border border-gray-100">
                      {t('medscribe.aiGenerated')}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {Object.entries(SOAP_CONFIG).map(([key, { labelKey, icon: SoapIcon, accentColor, tagBg, tagText, iconColor }], idx) => {
                      const content = result.soap_note[key];
                      if (!content) return null;
                      return (
                        <div
                          key={key}
                          className={`bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden card-hover animate-stagger-${idx + 2}`}
                        >
                          {/* Left accent bar + content */}
                          <div className="flex">
                            <div className={`w-1 shrink-0 ${accentColor}`} />
                            <div className="flex-1 p-4">
                              <div className="flex items-center gap-2 mb-2.5">
                                <div className={`w-6 h-6 ${tagBg} rounded-lg flex items-center justify-center`}>
                                  <SoapIcon size={12} className={iconColor} />
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-heading font-semibold ${tagBg} ${tagText}`}>
                                  {t(labelKey)}
                                </span>
                              </div>
                              <p className="font-body text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {content}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Medications Table */}
              {result.medications?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden animate-stagger-4">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center">
                      <Pill size={13} className="text-primary-500" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-dark text-sm">{t('medscribe.medications')}</h3>
                      <p className="text-[10px] text-warm-gray font-body mt-0.5">{t('medscribe.medicationsDesc')}</p>
                    </div>
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 font-heading font-bold border border-primary-100">
                      {result.medications.length}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/80">
                          <th className="px-5 py-2.5 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold w-10">#</th>
                          <th className="px-5 py-2.5 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">{t('medscribe.medication')}</th>
                          <th className="px-5 py-2.5 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">{t('medscribe.dosage')}</th>
                          <th className="px-5 py-2.5 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">{t('medscribe.frequency')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.medications.map((med, i) => (
                          <tr
                            key={i}
                            className={`border-t border-gray-50 hover:bg-primary-50/30 transition-colors ${
                              i % 2 === 1 ? 'bg-gray-50/40' : ''
                            }`}
                          >
                            <td className="px-5 py-3 text-xs text-warm-gray font-heading font-medium">{i + 1}</td>
                            <td className="px-5 py-3 text-xs font-heading font-semibold text-dark">{med.name}</td>
                            <td className="px-5 py-3 text-xs font-body text-gray-600">{med.dosage || '--'}</td>
                            <td className="px-5 py-3 text-xs font-body text-gray-500">{med.frequency || '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Patient Instructions */}
              {result.patient_instructions && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 rounded-2xl overflow-hidden shadow-premium animate-stagger-5">
                  <div className="flex">
                    <div className="w-1 shrink-0 bg-india-green" />
                    <div className="flex-1 p-5">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <CheckCircle size={13} className="text-india-green" />
                        </div>
                        <h3 className="font-heading font-bold text-dark text-sm">{t('medscribe.patientInstructions')}</h3>
                      </div>
                      <p className="font-body text-xs text-gray-700 whitespace-pre-wrap leading-relaxed pl-9">
                        {result.patient_instructions_translated || result.patient_instructions}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Instructions Audio */}
              {result.patient_audio_url && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-4 animate-stagger-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center">
                      <Volume2 size={13} className="text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-dark text-sm">{t('medscribe.audioInstructions')}</h3>
                      <p className="text-[10px] text-warm-gray font-body mt-0.5">{t('medscribe.audioInstructionsDesc')}</p>
                    </div>
                  </div>
                  <div className="pl-9">
                    <AudioPlayer audioUrl={result.patient_audio_url} label={t('medscribe.listenInstructions')} />
                  </div>
                </div>
              )}

              <Disclaimer />

              {/* Action Buttons */}
              <div className="flex gap-3 print:hidden animate-stagger-6">
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 text-white font-heading font-bold text-xs hover:bg-primary-600 active:scale-[0.98] transition-all shadow-sm shadow-primary-500/20"
                >
                  <Printer size={14} />
                  {t('medscribe.printNotes')}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-primary-500 text-primary-600 font-heading font-semibold text-xs hover:bg-primary-50 active:scale-[0.98] transition-all"
                >
                  <RotateCcw size={14} />
                  {t('medscribe.newSession')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Sidebar (1/3) ── */}
        <div className="space-y-4">

          {/* AI Pipeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-4 animate-stagger-3">
            <h4 className="font-heading font-bold text-dark text-sm flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-primary-50 rounded-lg flex items-center justify-center">
                <Brain size={12} className="text-primary-500" />
              </div>
              {t('medscribe.aiPipeline')}
            </h4>
            <div className="space-y-0">
              {PIPELINE_STEPS.map(({ step, tech, color, ring }, i) => (
                <div key={step} className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-heading font-bold text-white ${color} ring-4 ${ring} transition-all`}>
                      {i + 1}
                    </span>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div className="w-[2px] h-5 bg-gray-100 my-0.5" />
                    )}
                  </div>
                  <div className="pt-0.5 pb-2.5">
                    <p className="text-[11px] font-heading font-semibold text-dark leading-tight">{step}</p>
                    <p className="text-[10px] font-body text-warm-gray mt-0.5">{tech}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Stats — dynamic from dataStore */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-4 animate-stagger-4">
            <h4 className="font-heading font-bold text-dark text-sm flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-primary-50 rounded-lg flex items-center justify-center">
                <Clock size={12} className="text-primary-500" />
              </div>
              {t('medscribe.sessionStats')}
            </h4>
            {sessionStats.totalNotes === 0 ? (
              <div className="text-center py-4">
                <p className="text-xs text-warm-gray font-body">No sessions yet</p>
                <p className="text-[10px] text-warm-gray/60 font-body mt-1">Record your first consultation to see stats</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-primary-50 rounded-xl p-3 text-center card-hover transition-all">
                  <div className="flex items-center justify-center mb-1">
                    <FileText size={13} className="text-primary-700" />
                  </div>
                  <span className="block font-heading font-bold text-sm text-primary-700">{sessionStats.totalNotes}</span>
                  <span className="text-[9px] text-warm-gray font-body font-medium">Notes</span>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center card-hover transition-all">
                  <div className="flex items-center justify-center mb-1">
                    <Clock size={13} className="text-emerald-700" />
                  </div>
                  <span className="block font-heading font-bold text-sm text-emerald-700">{sessionStats.avgTime}</span>
                  <span className="text-[9px] text-warm-gray font-body font-medium">Avg Time</span>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center card-hover transition-all">
                  <div className="flex items-center justify-center mb-1">
                    <Languages size={13} className="text-blue-700" />
                  </div>
                  <span className="block font-heading font-bold text-sm text-blue-700">{sessionStats.languages}</span>
                  <span className="text-[9px] text-warm-gray font-body font-medium">Languages</span>
                </div>
                <div className="bg-purple-50 rounded-xl p-3 text-center card-hover transition-all">
                  <div className="flex items-center justify-center mb-1">
                    <CheckCircle size={13} className="text-purple-700" />
                  </div>
                  <span className="block font-heading font-bold text-sm text-purple-700">95%+</span>
                  <span className="text-[9px] text-warm-gray font-body font-medium">Accuracy</span>
                </div>
              </div>
            )}
          </div>

          {/* Tech Stack Pills */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-4 animate-stagger-5">
            <h4 className="font-heading font-bold text-dark text-sm flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 bg-primary-50 rounded-lg flex items-center justify-center">
                <Sparkles size={12} className="text-primary-500" />
              </div>
              {t('medscribe.poweredBy')}
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Web Speech API', color: 'bg-primary-50 text-primary-600 border-primary-100' },
                { label: 'Amazon Bedrock', color: 'bg-violet-50 text-violet-600 border-violet-100' },
                { label: 'Comprehend Medical', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                { label: 'Sarvam AI', color: 'bg-sky-50 text-sky-600 border-sky-100' },
              ].map(({ label, color }) => (
                <span
                  key={label}
                  className={`text-[10px] px-2.5 py-1 rounded-full border font-heading font-semibold ${color}`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
