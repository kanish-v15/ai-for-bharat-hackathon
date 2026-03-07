import { useState, useRef, useEffect } from 'react';
import {
  Mic, MicOff, Send, AlertTriangle, Trash2, FileText, Stethoscope,
  ChevronRight, X, Plus, Square,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { askCareGuide, askCareGuideText } from '../services/api';
import { saveInteraction, getInteractions, getLastLabReport, deleteInteraction } from '../services/dataStore';
import { LANGUAGES } from '../utils/constants';
import AudioPlayer from '../components/AudioPlayer';
import Disclaimer from '../components/Disclaimer';
import ThinkingIndicator from '../components/ThinkingIndicator';
import RunningRobot from '../components/RunningRobot';
import recordOrb from '../../icons/image 96.png';

export default function CareGuide() {
  const { language, t } = useLanguage();
  const { addNotification } = useNotifications();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [docTab, setDocTab] = useState('reports');
  const [docsVersion, setDocsVersion] = useState(0);
  const [waveformBars, setWaveformBars] = useState(new Array(20).fill(3));

  const [liveTranscript, setLiveTranscript] = useState('');

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const analyserRef = useRef(null);
  const audioContextRef = useRef(null);
  const animFrameRef = useRef(null);
  const recognitionRef = useRef(null);

  const langConfig = LANGUAGES[language];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const labReports = docsVersion >= 0 ? getInteractions('lab_report') : [];
  const prescriptions = docsVersion >= 0 ? getInteractions('medscribe') : [];

  const handleDeleteDoc = (id) => {
    deleteInteraction(id);
    setDocsVersion(v => v + 1);
  };

  // Clear chat when language changes
  useEffect(() => {
    setMessages([]);
    setSessionId(null);
  }, [language]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch {}
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleResponse = (data) => {
    setMessages((prev) => [...prev, {
      role: 'assistant',
      text: data.answer_translated || data.answer,
      audio_url: data.audio_url,
      is_emergency: data.is_emergency,
      timestamp: new Date(),
    }]);
    if (data.session_id) setSessionId(data.session_id);
    saveInteraction('care_guide', data);
    setDocsVersion(v => v + 1);
    addNotification('Health question answered', (data.answer_translated || data.answer).substring(0, 80), 'success', '/care-guide');
    scrollToBottom();
  };

  /* Voice input using MediaRecorder + backend Sarvam STT */
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up Web Audio API for waveform visualization
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 64;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyserRef.current = analyser;
      audioContextRef.current = audioContext;

      // Start waveform animation
      const updateWaveform = () => {
        if (!analyserRef.current) return;
        const data = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(data);
        const bars = Array.from(data.slice(0, 20)).map(v => Math.max(3, (v / 255) * 28));
        setWaveformBars(bars);
        animFrameRef.current = requestAnimationFrame(updateWaveform);
      };
      updateWaveform();

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
        // Clean up audio context and animation
        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }
        if (audioContextRef.current) {
          try { audioContextRef.current.close(); } catch {}
          audioContextRef.current = null;
        }
        analyserRef.current = null;
        setWaveformBars(new Array(20).fill(3));

        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size === 0) return;

        // Send audio to backend for STT + AI response
        setIsProcessing(true);
        setMessages((prev) => [...prev, {
          role: 'user',
          text: '...',
          isVoice: true,
          isPending: true,
          timestamp: new Date(),
        }]);
        scrollToBottom();

        try {
          const data = await askCareGuide(blob, language, 'demo-user', sessionId);

          // Update the pending user message with the transcribed question
          setMessages((prev) => {
            const updated = [...prev];
            const pendingIdx = updated.findLastIndex(m => m.isPending);
            if (pendingIdx !== -1) {
              updated[pendingIdx] = {
                ...updated[pendingIdx],
                text: data.transcription || data.question_text || '(voice question)',
                isPending: false,
              };
            }
            return updated;
          });

          handleResponse(data);
        } catch (err) {
          // Remove the pending message on error
          setMessages((prev) => {
            const updated = [...prev];
            const pendingIdx = updated.findLastIndex(m => m.isPending);
            if (pendingIdx !== -1) {
              updated.splice(pendingIdx, 1);
            }
            return [...updated, {
              role: 'assistant',
              text: err.response?.data?.detail || t('common.error'),
              isError: true,
              timestamp: new Date(),
            }];
          });
          scrollToBottom();
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordDuration(0);
      setLiveTranscript('');

      // Start Web Speech API for live transcript preview
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = langConfig?.speechCode || 'en-IN';
        recognition.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            interim += event.results[i][0].transcript;
          }
          setLiveTranscript(interim);
        };
        recognition.onerror = () => {}; // Silently ignore — MediaRecorder is primary
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
        setRecordDuration((d) => {
          if (d + 1 >= 120) { stopRecording(); return 120; }
          return d + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Please allow microphone access to use voice input.');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const submitQuestion = async (question, isVoice = false) => {
    if (!question || isLoading) return;
    setMessages((prev) => [...prev, {
      role: 'user',
      text: question,
      isVoice,
      timestamp: new Date(),
    }]);
    setTextInput('');
    setIsLoading(true);
    scrollToBottom();

    try {
      const data = await askCareGuideText(question, language, 'demo-user', sessionId);
      handleResponse(data);
    } catch (err) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        text: err.response?.data?.detail || t('common.error'),
        isError: true,
        timestamp: new Date(),
      }]);
      scrollToBottom();
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || isLoading) return;
    submitQuestion(textInput.trim(), false);
  };

  const clearSession = () => {
    setMessages([]);
    setSessionId(null);
  };

  /* Load a previous report context into chat */
  const loadReport = async (report) => {
    const params = report.data?.parameters || [];
    const flagged = params.filter(p => p.classification !== 'Normal');
    const summary = report.data?.summary || '';
    const docName = report.data?.fileName || report.title || 'Lab Report';
    setShowDocs(false);

    // Add user message showing which report was selected
    setMessages(prev => [...prev, {
      role: 'user',
      text: docName,
      timestamp: new Date(),
    }]);
    scrollToBottom();

    // Send the summary through Care Guide so AI responds in user's language with audio
    const contextPrompt = `Here is my lab report "${docName}" with ${params.length} parameters (${flagged.length} flagged):\n\n${summary}\n\nPlease explain this lab report summary to me in simple words.`;

    setIsLoading(true);
    try {
      const data = await askCareGuideText(contextPrompt, language, 'demo-user', sessionId);
      handleResponse(data);
    } catch {
      // Fallback: show stored summary without audio
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: summary || 'Could not load report summary.',
        audio_url: report.data?.audio_url || null,
        timestamp: new Date(),
      }]);
      scrollToBottom();
    } finally {
      setIsLoading(false);
    }
  };

  /* Load a prescription context into chat */
  const loadPrescription = async (rx) => {
    const soap = rx.data?.soap_note || {};
    const meds = rx.data?.medications || [];
    const instructions = rx.data?.patient_instructions_translated || rx.data?.patient_instructions || '';
    const rxTitle = rx.data?.patient_name ? `${rx.data.patient_name} consultation` : rx.title;
    setShowDocs(false);

    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      text: rxTitle,
      timestamp: new Date(),
    }]);
    scrollToBottom();

    // Build context and send through Care Guide for language + audio
    const medsText = meds.map(m => `${m.name} ${m.dosage || ''} ${m.frequency || ''}`).join(', ');
    const contextPrompt = `Here is my prescription:\nAssessment: ${soap.assessment || 'N/A'}\nPlan: ${soap.plan || 'N/A'}\nMedications: ${medsText || 'None'}\nInstructions: ${instructions || 'None'}\n\nPlease explain this prescription to me in simple words.`;

    setIsLoading(true);
    try {
      const data = await askCareGuideText(contextPrompt, language, 'demo-user', sessionId);
      handleResponse(data);
    } catch {
      // Fallback: show stored text
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: `Assessment: ${soap.assessment || 'N/A'}\nPlan: ${soap.plan || 'N/A'}\n${medsText ? `Medications: ${medsText}` : ''}\n${instructions ? `Instructions: ${instructions}` : ''}`,
        timestamp: new Date(),
      }]);
      scrollToBottom();
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const formatTimestamp = (d) => d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const welcomeText = `${t('careGuide.welcome')}. ${t('careGuide.welcomeDesc')}`;

  const isBusy = isLoading || isProcessing;

  return (
    <div className="h-[calc(100vh-130px)] flex overflow-hidden rounded-3xl bg-gray-50 gap-3">
      {/* -- Main Chat Area (LEFT) -- */}
      <div className="flex-1 flex flex-col overflow-hidden border border-gray-200 rounded-2xl bg-white shadow-sm">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile docs toggle */}
            <button onClick={() => setShowDocs(!showDocs)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${showDocs ? 'bg-primary-50 text-primary-500' : 'text-gray-400 hover:bg-gray-100'}`}
              title={t('labSamjho.myDocuments') || 'My Documents'}>
              <FileText size={18} />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
              <span className="text-white text-lg font-bold">S</span>
            </div>
            <div>
              <h2 className="font-heading text-sm font-bold text-dark">SwasthyaMitra</h2>
              <p className="text-[11px] text-green-500 font-medium">{t('common.online')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <>
                <button
                  onClick={clearSession}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-semibold bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                  title="New Chat"
                >
                  <Plus size={14} /> {t('labSamjho.newChat') || 'New Chat'}
                </button>
                <button
                  onClick={clearSession}
                  className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  title={t('common.clearChat')}
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 chat-scroll">
          {/* Welcome message */}
          <div className="flex justify-start">
            <div className="max-w-[85%] sm:max-w-[70%] lg:max-w-[60%]">
              <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100">
                <p className="text-sm text-dark font-body leading-relaxed">{welcomeText}</p>
                {/* Quick actions */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {(labReports.length > 0 || prescriptions.length > 0) && (
                    <button onClick={() => setShowDocs(true)}
                      className="lg:hidden inline-flex items-center gap-1.5 text-[11px] font-heading font-semibold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                      <FileText size={12} /> {t('labSamjho.myDocuments') || 'My Documents'}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 ml-2 font-body">SwasthyaMitra</p>
            </div>
          </div>

          {/* Health context pill if available */}
          {(() => {
            const lastReport = getLastLabReport();
            if (!lastReport) return null;
            const flagged = (lastReport.data?.parameters || []).filter(p => p.classification !== 'Normal');
            return (
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-[11px] text-gray-500 shadow-sm">
                  <AlertTriangle size={12} className="text-amber-500" />
                  {flagged.length > 0
                    ? `${flagged.length} ${t('careGuide.flaggedParams')}`
                    : t('careGuide.labReportOnFile')}
                </div>
              </div>
            );
          })()}

          {/* Chat messages */}
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const isLastAssistant = !isUser && i === messages.length - 1;

            return (
              <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                <div className="max-w-[85%] sm:max-w-[70%] lg:max-w-[60%]">
                  {/* Emergency badge */}
                  {msg.is_emergency && (
                    <div className="flex items-center gap-1.5 bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-heading font-bold mb-1">
                      <AlertTriangle size={13} />
                      {t('careGuide.emergencyCall')}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`px-4 py-3 shadow-sm ${
                      isUser
                        ? 'bg-primary-500 text-white rounded-2xl rounded-tr-md'
                        : msg.isError
                          ? 'bg-red-50 text-red-600 rounded-2xl rounded-tl-md border border-red-100'
                          : 'bg-white text-dark rounded-2xl rounded-tl-md border border-gray-100'
                    }`}
                  >
                    {msg.isPending ? (
                      <ThinkingIndicator variant="user" label={t('careGuide.processing')} />
                    ) : (
                      <p className="text-sm font-body leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}

                    {/* Voice indicator */}
                    {isUser && msg.isVoice && !msg.isPending && (
                      <div className="flex items-center gap-1 mt-1.5 opacity-70">
                        <Mic size={11} />
                        <span className="text-[10px]">{t('common.voice')}</span>
                      </div>
                    )}
                  </div>

                  {/* Audio player for assistant */}
                  {msg.audio_url && (
                    <div className="mt-1.5">
                      <AudioPlayer audioUrl={msg.audio_url} label={t('common.listen')} autoPlay={isLastAssistant} />
                    </div>
                  )}

                  {/* Timestamp */}
                  <p className={`text-[10px] text-gray-400 mt-1 font-body ${isUser ? 'text-right mr-2' : 'ml-2'}`}>
                    {formatTimestamp(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {(isLoading || isProcessing) && !messages.some(m => m.isPending) && (
            <ThinkingIndicator variant="assistant" label={isProcessing ? t('careGuide.processing') : t('careGuide.aiThinking')} />
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Running robot when AI is processing */}
        {(isLoading || isProcessing) && (
          <div className="px-4">
            <RunningRobot />
          </div>
        )}

        {/* Disclaimer */}
        <div className="px-4 pb-1"><Disclaimer /></div>

        {/* Recording indicator with waveform */}
        {isRecording && (
          <div className="px-4 pb-2 animate-fade-in">
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              <span className="text-xs text-red-600 font-heading font-semibold shrink-0">
                {formatTime(recordDuration)} / 2:00
              </span>
              {/* Live transcript or waveform */}
              {liveTranscript ? (
                <p className="flex-1 text-xs text-red-600/80 font-body truncate italic">
                  {liveTranscript}
                </p>
              ) : (
                <div className="flex items-center gap-[2px] flex-1 h-7 justify-center">
                  {waveformBars.map((height, idx) => (
                    <div
                      key={idx}
                      className="bg-red-400 rounded-full transition-all duration-75"
                      style={{
                        width: '3px',
                        height: `${height}px`,
                        minHeight: '3px',
                      }}
                    />
                  ))}
                </div>
              )}
              <button
                onClick={stopRecording}
                className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg font-heading font-semibold hover:bg-red-600 transition-colors shrink-0"
              >
                {t('common.send')}
              </button>
            </div>
          </div>
        )}

        {/* Processing indicator (after recording stops) */}
        {isProcessing && !isRecording && (
          <div className="px-4 pb-2 animate-fade-in">
            <ThinkingIndicator variant="bar" label={t('careGuide.processing')} />
          </div>
        )}

        {/* Input Bar */}
        <div className="bg-white border-t border-gray-100 px-3 py-2.5 shrink-0">
          <form onSubmit={handleTextSubmit} className="flex items-end gap-2">
            {/* Mic button */}
            <button
              type="button"
              onClick={() => {
                if (isRecording) stopRecording();
                else startRecording();
              }}
              disabled={isBusy}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 overflow-hidden disabled:opacity-40 ${
                isRecording ? 'scale-110' : 'hover:scale-105'
              }`}
              title={isRecording ? t('medscribe.stopRecording') : t('common.speak')}
            >
              <img src={recordOrb} alt="" className={`absolute inset-0 w-full h-full object-cover rounded-full ${isRecording ? 'animate-pulse' : ''}`} />
              <span className="relative z-10">
                {isRecording ? <Square size={16} className="text-white drop-shadow-md" fill="white" /> : <Mic size={16} className="text-white drop-shadow-md" strokeWidth={2.5} />}
              </span>
            </button>

            {/* Text input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={isRecording ? (t('careGuide.recording') || 'Recording...') : (t('careGuide.askPlaceholder') || 'Type your question...')}
                disabled={isBusy || isRecording}
                className="w-full px-4 py-2.5 rounded-2xl bg-gray-100 border border-gray-200 font-body text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 focus:bg-white disabled:opacity-50 placeholder:text-gray-400 transition-all"
              />
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={!textInput.trim() || isBusy}
              className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center shrink-0 hover:bg-primary-600 disabled:opacity-30 disabled:hover:bg-primary-500 transition-all duration-200 active:scale-95 shadow-md"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* -- Document Panel (RIGHT, sticky) -- */}
      {/* Mobile overlay */}
      {showDocs && (
        <div className="lg:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setShowDocs(false)} />
      )}
      <div className={`
        ${showDocs ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0
        fixed right-0 top-0 bottom-0 z-50
        lg:static lg:z-auto
        w-80 bg-white border border-gray-200 rounded-none lg:rounded-2xl shrink-0
        flex flex-col h-full shadow-sm
        transition-transform duration-300 lg:transition-none
      `}>
        {/* Tab Bar */}
        <div className="px-3 pt-3 pb-0 shrink-0">
          <div className="flex items-center justify-between mb-2 lg:hidden">
            <h3 className="font-heading text-sm font-bold text-dark">{t('labSamjho.myDocuments') || 'My Documents'}</h3>
            <button onClick={() => setShowDocs(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
          </div>
          <div className="flex bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setDocTab('reports')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-heading font-semibold transition-all ${
                docTab === 'reports'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText size={13} />
              {t('healthTimeline.labReports') || 'Lab Reports'}
            </button>
            <button
              onClick={() => setDocTab('prescriptions')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-heading font-semibold transition-all ${
                docTab === 'prescriptions'
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Stethoscope size={13} />
              {t('labSamjho.prescriptions') || 'Prescriptions'}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {docTab === 'reports' ? (
            labReports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 ring-1 ring-gray-100">
                  <FileText size={20} className="text-gray-300" />
                </div>
                <p className="text-xs text-gray-400 font-body">{t('labSamjho.noReports') || 'No lab reports yet'}</p>
                <p className="text-[10px] text-gray-400 font-body mt-1">{t('careGuide.uploadFromLabSamjho') || 'Upload from Lab Samjho page'}</p>
              </div>
            ) : labReports.slice(0, 15).map((r) => {
              const docName = r.data?.fileName || r.title || 'Lab Report';
              return (
                <div key={r.id} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-primary-50 transition-colors group mb-1">
                  <button onClick={() => loadReport(r)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                    <div className="w-9 h-9 bg-sky-50 rounded-lg flex items-center justify-center shrink-0 border border-sky-100">
                      <FileText size={15} className="text-sky-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-heading font-semibold text-dark truncate">{docName}</p>
                      <p className="text-[9px] font-body text-gray-400">{new Date(r.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                    </div>
                    <ChevronRight size={12} className="text-gray-300 group-hover:text-primary-500 shrink-0" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteDoc(r.id); }}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          ) : (
            prescriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 ring-1 ring-gray-100">
                  <Stethoscope size={20} className="text-gray-300" />
                </div>
                <p className="text-xs text-gray-400 font-body">{t('labSamjho.noPrescriptions') || 'No prescriptions yet'}</p>
                <p className="text-[10px] text-gray-400 font-body mt-1">{t('careGuide.recordFromMedscribe') || 'Record from MedScribe page'}</p>
              </div>
            ) : prescriptions.slice(0, 15).map((rx) => (
              <div key={rx.id} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-emerald-50 transition-colors group mb-1">
                <button onClick={() => loadPrescription(rx)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                  <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100">
                    <Stethoscope size={15} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-heading font-semibold text-dark truncate">{rx.title}</p>
                    <p className="text-[9px] font-body text-gray-400">{new Date(rx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <ChevronRight size={12} className="text-gray-300 group-hover:text-emerald-500 shrink-0" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteDoc(rx.id); }}
                  className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                  title="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
