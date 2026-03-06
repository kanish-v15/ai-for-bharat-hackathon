import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic, Square, Sparkles, CheckCircle, AlertTriangle, Pill,
  User, FileText, Activity, Volume2, Stethoscope, Languages, Printer, RotateCcw,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useNotifications } from '../../context/NotificationContext';
import { processMedScribe, processMedScribeText } from '../../services/api';
import { saveInteraction, addConsultationToPatient } from '../../services/dataStore';
import { LANGUAGES } from '../../utils/constants';
import AudioPlayer from '../AudioPlayer';
import Disclaimer from '../Disclaimer';
import LoadingSpinner from '../LoadingSpinner';
import ThinkingIndicator from '../ThinkingIndicator';
import recordOrb from '../../../icons/image 96.png';

const LOADING_STEPS = {
  english: ['Uploading audio...', 'Transcribing with Sarvam AI...', 'Generating SOAP notes...', 'Extracting medications...', 'Creating patient instructions...'],
  hindi: ['ऑडियो अपलोड हो रहा है...', 'Sarvam AI से लिप्यंतरण...', 'SOAP नोट्स बन रहे हैं...', 'दवाइयाँ निकाली जा रही हैं...', 'मरीज़ निर्देश बन रहे हैं...'],
  tamil: ['ஆடியோ பதிவேற்றம்...', 'Sarvam AI மூலம் படியெடுப்பு...', 'SOAP குறிப்புகள் உருவாக்கம்...', 'மருந்துகள் பிரிப்பு...', 'நோயாளி அறிவுறுத்தல்கள்...'],
  telugu: ['ఆడియో అప్‌లోడ్...', 'Sarvam AI ద్వారా లిప్యంతరం...', 'SOAP నోట్స్ రూపొందించడం...', 'మందులు సేకరణ...', 'రోగి సూచనలు...'],
  kannada: ['ಆಡಿಯೋ ಅಪ್‌ಲೋಡ್...', 'Sarvam AI ಲಿಪ್ಯಂತರ...', 'SOAP ಟಿಪ್ಪಣಿಗಳು...', 'ಔಷಧಿಗಳ ಹೊರತೆಗೆಯುವಿಕೆ...', 'ರೋಗಿ ಸೂಚನೆಗಳು...'],
  malayalam: ['ഓഡിയോ അപ്‌ലോഡ്...', 'Sarvam AI ട്രാൻസ്ക്രിപ്ഷൻ...', 'SOAP കുറിപ്പുകൾ...', 'മരുന്നുകൾ...', 'രോഗി നിർദ്ദേശങ്ങൾ...'],
  bengali: ['অডিও আপলোড...', 'Sarvam AI ট্রান্সক্রিপশন...', 'SOAP নোট তৈরি...', 'ওষুধ বের করা...', 'রোগীর নির্দেশনা...'],
  marathi: ['ऑडिओ अपलोड...', 'Sarvam AI लिप्यंतरण...', 'SOAP नोट्स तयार...', 'औषधे काढणे...', 'रुग्ण सूचना...'],
  gujarati: ['ઓડિયો અપલોડ...', 'Sarvam AI ટ્રાન્સક્રિપ્શન...', 'SOAP નોંધો...', 'દવાઓ કાઢવી...', 'દર્દી સૂચનાઓ...'],
};

const SOAP_CONFIG = {
  subjective: { label: 'Subjective', icon: User, accentColor: 'bg-sky-500', tagBg: 'bg-sky-50', tagText: 'text-sky-700', iconColor: 'text-sky-500' },
  objective: { label: 'Objective', icon: Activity, accentColor: 'bg-emerald-500', tagBg: 'bg-emerald-50', tagText: 'text-emerald-700', iconColor: 'text-emerald-500' },
  assessment: { label: 'Assessment', icon: FileText, accentColor: 'bg-amber-500', tagBg: 'bg-amber-50', tagText: 'text-amber-700', iconColor: 'text-amber-500' },
  plan: { label: 'Plan', icon: CheckCircle, accentColor: 'bg-rose-500', tagBg: 'bg-rose-50', tagText: 'text-rose-700', iconColor: 'text-rose-500' },
};

const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
const MAX_DURATION = 300;

export default function ConsultPanel({ patient, onConsultationComplete }) {
  const { language } = useLanguage();
  const { addNotification } = useNotifications();

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformBars, setWaveformBars] = useState(new Array(24).fill(3));
  const [liveTranscript, setLiveTranscript] = useState('');

  // MediaRecorder refs
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  // Audio waveform refs
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const recognitionRef = useRef(null);
  const liveTranscriptRef = useRef('');

  const consultLang = patient?.language || language;

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current) try { audioCtxRef.current.close(); } catch {}
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
    };
  }, []);

  // Waveform animation loop
  const startWaveformAnimation = useCallback((analyser) => {
    const update = () => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const bars = Array.from(data.slice(0, 24)).map(v => Math.max(3, (v / 255) * 32));
      setWaveformBars(bars);
      animFrameRef.current = requestAnimationFrame(update);
    };
    update();
  }, []);

  const stopWaveformAnimation = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setWaveformBars(new Array(24).fill(3));
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close(); } catch {}
      audioCtxRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup audio waveform visualizer
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;
      startWaveformAnimation(analyser);

      // Start MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus' : 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size > 0) {
          handleProcessAudio(blob);
        } else {
          setError('No audio recorded. Please try again.');
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingTime(0);
      setLiveTranscript('');

      // Start browser SpeechRecognition for live transcript preview
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const langCode = LANGUAGES[consultLang]?.speechCode || 'en-IN';
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = langCode;

        recognition.onresult = (event) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript;
          }
          setLiveTranscript(text);
          liveTranscriptRef.current = text;
        };
        recognition.onerror = () => {};
        recognition.onend = () => {
          // Restart if still recording (browser may stop after silence)
          if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try { recognition.start(); } catch {}
          }
        };
        try { recognition.start(); } catch {}
        recognitionRef.current = recognition;
      }

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          if (t + 1 >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return t + 1;
        });
      }, 1000);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied. Please allow microphone access in your browser settings.');
      } else {
        setError('Could not access microphone. Please check your device.');
      }
    }
  }, [startWaveformAnimation]);

  const stopRecording = useCallback(() => {
    stopWaveformAnimation();

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, [stopWaveformAnimation]);

  const handleProcessAudio = async (audioBlob) => {
    setIsLoading(true);
    setLoadingStep(0);
    setError(null);
    setResult(null);

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, 4));
    }, 5000);

    const browserTranscript = liveTranscriptRef.current?.trim() || '';

    try {
      let data;

      // Strategy: try audio-based first, fall back to text-based with browser transcript
      try {
        data = await processMedScribe(audioBlob, consultLang, 'demo-doctor', patient?.id);
      } catch (audioErr) {
        const errMsg = audioErr.response?.data?.detail || audioErr.message || '';
        const is30sError = errMsg.includes('30 seconds') || errMsg.includes('duration greater');
        console.log('[MedScribe] Audio processing failed:', errMsg);

        // If we have browser transcript, use text-based endpoint (no STT needed)
        if (browserTranscript) {
          console.log(`[MedScribe] Falling back to text-based processing (${browserTranscript.length} chars)`);
          data = await processMedScribeText(browserTranscript, consultLang, 'demo-doctor', patient?.id);
          // Mark that we used browser transcript
          if (data && !data.transcription) {
            data.transcription = browserTranscript;
          }
        } else if (is30sError) {
          throw new Error('Recording too long for audio processing and no live transcript available. Please ensure your browser supports Speech Recognition for the fallback.');
        } else {
          throw audioErr;
        }
      }

      setResult(data);

      saveInteraction('medscribe', {
        ...data,
        language: consultLang,
        transcription: data.transcription,
      });

      if (patient?.id) {
        addConsultationToPatient(patient.id, {
          ...data,
          language: consultLang,
          transcription: data.transcription,
        });
        onConsultationComplete?.();
      }

      addNotification('SOAP Notes Generated', 'Consultation documented successfully', 'success', '/medscribe');
    } catch (err) {
      const detail = err.response?.data?.detail || err.message;
      setError(detail || 'Failed to process consultation. Please try again.');
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setRecordingTime(0);
    setLiveTranscript('');
    liveTranscriptRef.current = '';
  };

  const steps = LOADING_STEPS[language] || LOADING_STEPS.english;

  return (
    <div className="space-y-4">
      {/* Recording */}
      {!result && !isLoading && (
        <div className={`bg-white rounded-2xl border-2 ${isRecording ? 'border-red-300 bg-red-50/10' : 'border-dashed border-gray-200 hover:border-primary-300'} transition-all overflow-hidden`}>
          <div className="px-6 py-6 flex flex-col items-center text-center">
            <div className="relative mb-4">
              <button onClick={isRecording ? stopRecording : startRecording}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 ${isRecording ? 'scale-110' : 'hover:scale-105'}`}>
                <img src={recordOrb} alt="" className={`w-20 h-20 object-contain rounded-full ${isRecording ? 'animate-pulse' : ''}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  {isRecording ? <Square size={22} className="text-white drop-shadow-md" fill="white" /> : <Mic size={26} className="text-white drop-shadow-md" strokeWidth={2} />}
                </div>
              </button>
              {isRecording && <div className="absolute -inset-2 rounded-full border-2 border-purple-300/60 animate-ping pointer-events-none" />}
            </div>

            {isRecording ? (
              <div className="space-y-3 w-full">
                <div className="flex items-center justify-center gap-3">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                  </span>
                  <span className="text-sm text-red-600 font-heading font-bold">Recording {formatTime(recordingTime)}</span>
                  <span className="text-[10px] text-red-400/80 font-body">max 5:00</span>
                </div>

                {/* Waveform + Live Transcript */}
                <div className="w-full max-w-lg mx-auto space-y-3">
                  {/* Waveform bar */}
                  <div className="px-4 py-3 bg-white/90 rounded-xl border border-primary-200/40 shadow-sm">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 animate-ping" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" /></span>
                      <p className="text-[10px] uppercase tracking-widest text-warm-gray/60 font-heading font-semibold">
                        Capturing — {LANGUAGES[consultLang]?.labelEn || consultLang}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-[3px] h-10">
                      {waveformBars.map((h, i) => (
                        <div
                          key={i}
                          className="w-1.5 rounded-full bg-gradient-to-t from-primary-500 to-primary-400 transition-all duration-75"
                          style={{ height: `${h}px` }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Live transcript panel */}
                  <div className="bg-white/90 rounded-xl border border-gray-200/60 shadow-sm px-4 py-3 min-h-[80px] max-h-[200px] overflow-y-auto">
                    <div className="flex items-center gap-1.5 mb-2">
                      <FileText size={11} className="text-primary-400" />
                      <p className="text-[10px] uppercase tracking-widest text-warm-gray/60 font-heading font-semibold">
                        Live Transcript
                      </p>
                      {liveTranscript && (
                        <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 font-heading font-medium border border-green-100 animate-pulse">
                          Live
                        </span>
                      )}
                    </div>
                    {liveTranscript ? (
                      <p className="font-body text-xs text-dark leading-relaxed whitespace-pre-wrap">{liveTranscript}</p>
                    ) : (
                      <p className="font-body text-xs text-warm-gray/40 italic">
                        Start speaking — text will appear here in real time...
                      </p>
                    )}
                  </div>
                </div>

                <p className="text-[10px] text-warm-gray/50 font-body">
                  Live preview uses browser STT — also used as fallback if backend audio processing fails
                </p>

                <button onClick={stopRecording} className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 text-white font-heading font-bold text-xs hover:bg-red-600 transition-all">
                  <Square size={12} fill="white" /> Stop Recording
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-heading font-bold text-dark text-sm mb-1">Record Consultation</h3>
                <p className="font-body text-xs text-warm-gray mb-3 max-w-md">
                  for <span className="font-semibold text-primary-600">{patient?.name}</span> in <span className="font-semibold text-primary-600">{LANGUAGES[consultLang]?.labelEn || consultLang}</span>
                </p>
                <button onClick={startRecording} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-heading font-bold text-xs hover:from-primary-600 hover:to-primary-700 transition-all shadow-sm mb-3">
                  <Mic size={14} /> Start Recording
                </button>
                <div className="flex items-center gap-2.5 flex-wrap justify-center">
                  {[
                    { icon: Stethoscope, label: 'SOAP Notes' },
                    { icon: Pill, label: 'Medications' },
                    { icon: Languages, label: 'Sarvam STT' },
                  ].map(({ icon: I, label }) => (
                    <span key={label} className="inline-flex items-center gap-1 text-[10px] text-warm-gray bg-gray-50 border border-gray-100 px-2 py-1 rounded-full font-body font-medium"><I size={10} />{label}</span>
                  ))}
                </div>
                <p className="text-[10px] text-warm-gray/60 font-body mt-2 max-w-sm">
                  Speak in your language — audio waveform shown during recording, accurate transcription by Sarvam AI after stop.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-6">
          <LoadingSpinner steps={steps} currentStep={loadingStep} />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-body font-medium flex items-center gap-2">
          <AlertTriangle size={14} className="shrink-0" /><span className="flex-1">{error}</span>
          <button onClick={handleReset} className="text-red-500 hover:text-red-700 font-heading font-bold text-[10px] shrink-0">Try Again</button>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {result.transcription && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
                <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center"><Mic size={13} className="text-warm-gray" /></div>
                <h3 className="font-heading font-bold text-dark text-sm">Transcription</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 font-heading font-medium border border-primary-100">
                  {LANGUAGES[consultLang]?.labelEn || consultLang}
                </span>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-heading font-medium border border-emerald-100">Sarvam AI</span>
              </div>
              <div className="px-5 py-4"><p className="font-body text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{result.transcription}</p></div>
            </div>
          )}

          {result.soap_note && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center"><Sparkles size={13} className="text-primary-500" /></div>
                <h3 className="font-heading font-bold text-dark text-sm">SOAP Notes</h3>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-warm-gray font-heading font-medium border border-gray-100">AI-generated</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {Object.entries(SOAP_CONFIG).map(([key, { label, icon: SoapIcon, accentColor, tagBg, tagText, iconColor }]) => {
                  const content = result.soap_note[key];
                  if (!content) return null;
                  return (
                    <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden card-hover">
                      <div className="flex">
                        <div className={`w-1 shrink-0 ${accentColor}`} />
                        <div className="flex-1 p-4">
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className={`w-6 h-6 ${tagBg} rounded-lg flex items-center justify-center`}><SoapIcon size={12} className={iconColor} /></div>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-heading font-semibold ${tagBg} ${tagText}`}>{label}</span>
                          </div>
                          <p className="font-body text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{content}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {result.medications?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
                <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center"><Pill size={13} className="text-primary-500" /></div>
                <h3 className="font-heading font-bold text-dark text-sm">Medications</h3>
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 font-heading font-bold border border-primary-100">{result.medications.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="bg-gray-50/80">
                    <th className="px-5 py-2.5 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold w-10">#</th>
                    <th className="px-5 py-2.5 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Medication</th>
                    <th className="px-5 py-2.5 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Dosage</th>
                    <th className="px-5 py-2.5 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Frequency</th>
                  </tr></thead>
                  <tbody>
                    {result.medications.map((med, i) => (
                      <tr key={i} className={`border-t border-gray-50 hover:bg-primary-50/30 ${i % 2 === 1 ? 'bg-gray-50/40' : ''}`}>
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

          {result.patient_instructions && (
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 rounded-2xl overflow-hidden">
              <div className="flex">
                <div className="w-1 shrink-0 bg-india-green" />
                <div className="flex-1 p-5">
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center"><CheckCircle size={13} className="text-india-green" /></div>
                    <h3 className="font-heading font-bold text-dark text-sm">Patient Instructions</h3>
                    {result.patient_instructions_translated && consultLang !== 'english' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-heading font-medium">
                        {LANGUAGES[consultLang]?.labelEn}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-gray-700 whitespace-pre-wrap leading-relaxed pl-9">{result.patient_instructions_translated || result.patient_instructions}</p>
                </div>
              </div>
            </div>
          )}

          {result.patient_audio_url && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center"><Volume2 size={13} className="text-violet-600" /></div>
                <h3 className="font-heading font-bold text-dark text-sm">Audio Instructions</h3>
              </div>
              <div className="pl-9"><AudioPlayer audioUrl={result.patient_audio_url} label="Listen to instructions" /></div>
            </div>
          )}

          <Disclaimer />

          <div className="flex gap-3">
            <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 text-white font-heading font-bold text-xs hover:bg-primary-600 transition-all shadow-sm">
              <Printer size={14} /> Print Notes
            </button>
            <button onClick={handleReset} className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-primary-500 text-primary-600 font-heading font-semibold text-xs hover:bg-primary-50 transition-all">
              <RotateCcw size={14} /> New Session
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
