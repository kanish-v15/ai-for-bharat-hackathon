import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Send, AlertTriangle, Trash2, Volume2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { askCareGuideText } from '../services/api';
import { saveInteraction, getLastLabReport } from '../services/dataStore';
import { LANGUAGES } from '../utils/constants';
import AudioPlayer from '../components/AudioPlayer';
import Disclaimer from '../components/Disclaimer';

export default function CareGuide() {
  const { language, t } = useLanguage();
  const { addNotification } = useNotifications();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const langConfig = LANGUAGES[language];

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
      role: 'assistant',
      text: data.answer_translated || data.answer,
      audio_url: data.audio_url,
      is_emergency: data.is_emergency,
      timestamp: new Date(),
    }]);
    if (data.session_id) setSessionId(data.session_id);
    saveInteraction('care_guide', data);
    addNotification('Health question answered', (data.answer_translated || data.answer).substring(0, 80), 'success', '/care-guide');
    scrollToBottom();
  };

  /* Voice input using Web Speech API */
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
      if (finalTranscript.trim() && isRecording) {
        submitQuestion(finalTranscript.trim(), true);
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
    if (liveTranscript.trim()) {
      submitQuestion(liveTranscript.trim(), true);
    }
    setIsRecording(false);
    setLiveTranscript('');
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

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const formatTimestamp = (d) => d ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  const welcomeText = `${t('careGuide.welcome')}. ${t('careGuide.welcomeDesc')}`;

  return (
    <div className="h-[calc(100vh-130px)] flex flex-col overflow-hidden rounded-3xl bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
            <span className="text-white text-lg font-bold">S</span>
          </div>
          <div>
            <h2 className="font-heading text-sm font-bold text-dark">SwasthyaMitra</h2>
            <p className="text-[11px] text-green-500 font-medium">{t('common.online')}</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearSession}
            className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title={t('common.clearChat')}
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 chat-scroll">
        {/* Welcome message */}
        <div className="flex justify-start">
          <div className="max-w-[80%] sm:max-w-[70%]">
            <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100">
              <p className="text-sm text-dark font-body leading-relaxed">{welcomeText}</p>
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
              <div className={`max-w-[80%] sm:max-w-[70%]`}>
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
                  <p className="text-sm font-body leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                  {/* Voice indicator */}
                  {isUser && msg.isVoice && (
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
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="max-w-[80%] sm:max-w-[70%]">
              <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                  <span className="text-xs text-gray-400 font-body">{t('careGuide.thinking')}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Disclaimer */}
      <div className="px-4 pb-1">
        <Disclaimer />
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="px-4 pb-2 animate-fade-in">
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-xs text-red-600 font-heading font-semibold flex-1">
              {t('careGuide.recording')} {formatTime(recordDuration)} / 1:00
            </span>
            {liveTranscript && (
              <span className="text-xs text-dark font-body italic truncate max-w-[60%]">{liveTranscript}</span>
            )}
            <button
              onClick={stopRecording}
              className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg font-heading font-semibold hover:bg-red-600 transition-colors"
            >
              {t('common.send')}
            </button>
          </div>
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
            disabled={isLoading}
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-200 ${
              isRecording
                ? 'bg-red-500 text-white shadow-lg animate-pulse'
                : 'bg-gray-100 text-gray-500 hover:bg-primary-50 hover:text-primary-500'
            } disabled:opacity-40`}
            title={isRecording ? t('medscribe.stopRecording') : t('common.speak')}
          >
            {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={isRecording ? liveTranscript : textInput}
              onChange={(e) => !isRecording && setTextInput(e.target.value)}
              placeholder={isRecording ? t('careGuide.recording') : t('careGuide.askPlaceholder')}
              disabled={isLoading || isRecording}
              className="w-full px-4 py-2.5 rounded-2xl bg-gray-100 border border-gray-200 font-body text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 focus:bg-white disabled:opacity-50 placeholder:text-gray-400 transition-all"
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={(!textInput.trim() && !isRecording) || isLoading}
            className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center shrink-0 hover:bg-primary-600 disabled:opacity-30 disabled:hover:bg-primary-500 transition-all duration-200 active:scale-95 shadow-md"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
