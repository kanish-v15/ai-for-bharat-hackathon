import { useState, useRef, useEffect } from 'react';
import {
  Upload, Send, Mic, MicOff, FileText, AlertTriangle, CheckCircle,
  Paperclip, Trash2, ChevronRight, Stethoscope, X, FileScan, Plus, Square,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { analyzeLabReport, askLabQuestion } from '../services/api';
import { saveInteraction, getInteractions, deleteInteraction } from '../services/dataStore';
import { LANGUAGES } from '../utils/constants';
import AudioPlayer from '../components/AudioPlayer';
import Disclaimer from '../components/Disclaimer';
import recordOrb from '../../icons/image 96.png';

/* ── Compact parameter card inside chat ── */
function AnalysisCard({ result, t }) {
  const [expanded, setExpanded] = useState(false);
  const params = result.parameters || [];
  const normalCount = params.filter(p => p.classification === 'Normal').length;
  const flaggedCount = params.filter(p => p.classification !== 'Normal').length;
  const shown = expanded ? params : params.slice(0, 4);

  return (
    <div className="space-y-2">
      {/* Stats row */}
      <div className="flex gap-2">
        <span className="inline-flex items-center gap-1 text-[11px] font-heading font-semibold bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-lg">
          <CheckCircle size={12} /> {normalCount} {t('labSamjho.normal')}
        </span>
        {flaggedCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-heading font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg">
            <AlertTriangle size={12} /> {flaggedCount} {t('labSamjho.flagged')}
          </span>
        )}
      </div>

      {/* Parameters */}
      <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
        {shown.map((p, i) => {
          const isNormal = p.classification === 'Normal';
          const isBorderline = p.classification === 'Borderline';
          return (
            <div key={i} className={`flex items-center gap-3 px-3 py-2 ${i > 0 ? 'border-t border-gray-100' : ''}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                isNormal ? 'bg-green-100' : isBorderline ? 'bg-amber-100' : 'bg-red-100'
              }`}>
                {isNormal
                  ? <CheckCircle size={11} className="text-green-600" />
                  : <AlertTriangle size={11} className={isBorderline ? 'text-amber-600' : 'text-red-600'} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-heading font-semibold text-dark truncate">{p.name}</p>
                <p className="text-[10px] font-body text-gray-500">{p.explanation_translated || p.explanation}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-heading font-bold text-dark">{p.value} <span className="text-[10px] font-normal text-gray-400">{p.unit}</span></p>
                <p className="text-[9px] font-body text-gray-400">{p.reference_range}</p>
              </div>
            </div>
          );
        })}
      </div>

      {params.length > 4 && (
        <button onClick={() => setExpanded(!expanded)} className="text-[11px] text-primary-500 font-heading font-semibold hover:underline">
          {expanded ? t('labSamjho.showLess') : `${t('labSamjho.showAll')} ${params.length} ${t('labSamjho.parameter')}`}
        </button>
      )}

      {/* Summary */}
      {result.summary && (
        <div className="bg-primary-50 rounded-xl px-3 py-2 border border-primary-100">
          <p className="text-[11px] font-body text-dark leading-relaxed">{result.summary}</p>
        </div>
      )}
    </div>
  );
}

export default function LabSamjho() {
  const { language, t } = useLanguage();
  const { addNotification } = useNotifications();
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState(null);
  const [showDocs, setShowDocs] = useState(false);
  const [docTab, setDocTab] = useState('reports');
  const [docsVersion, setDocsVersion] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordDuration, setRecordDuration] = useState(0);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const langConfig = LANGUAGES[language];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const labReports = docsVersion >= 0 ? getInteractions('lab_report') : [];
  const prescriptions = docsVersion >= 0 ? getInteractions('medscribe') : [];

  const handleDeleteDoc = (id) => {
    deleteInteraction(id);
    setDocsVersion(v => v + 1);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) try { recognitionRef.current.abort(); } catch {}
    };
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  /* ── File upload handler ── */
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setMessages(prev => [...prev, { role: 'assistant', text: t('labSamjho.invalidFile'), isError: true, timestamp: new Date() }]);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessages(prev => [...prev, { role: 'assistant', text: t('labSamjho.fileTooLarge'), isError: true, timestamp: new Date() }]);
      return;
    }

    const previewUrl = file.type !== 'application/pdf' ? URL.createObjectURL(file) : null;
    setMessages(prev => [...prev, {
      role: 'user', text: `${t('labSamjho.uploadReport')}: ${file.name}`, file: { name: file.name, type: file.type, previewUrl }, timestamp: new Date(),
    }]);
    scrollToBottom();

    setIsLoading(true);
    try {
      const data = await analyzeLabReport(file, language);
      setActiveAnalysis(data);
      saveInteraction('lab_report', data);
      const flagged = data.parameters?.filter(p => p.classification !== 'Normal').length || 0;
      addNotification(t('labSamjho.analysisComplete'), `${data.parameters?.length || 0} ${t('labSamjho.parameter')}, ${flagged} ${t('labSamjho.flagged')}`, flagged > 0 ? 'warning' : 'success', '/lab-samjho');
      setMessages(prev => [...prev, {
        role: 'assistant', analysisResult: data, audio_url: data.audio_url,
        text: t('labSamjho.resultReady'),
        timestamp: new Date(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant', text: err.response?.data?.detail || t('labSamjho.analysisFailed'), isError: true, timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ── Load a previous report into chat ── */
  const loadReport = (report) => {
    setMessages([
      { role: 'user', text: `${t('labSamjho.previousReports')}: ${report.title}`, timestamp: new Date(report.date) },
      {
        role: 'assistant', analysisResult: report.data, audio_url: report.data?.audio_url,
        text: t('labSamjho.resultReady'),
        timestamp: new Date(),
      },
    ]);
    setActiveAnalysis(report.data);
    setShowDocs(false);
    scrollToBottom();
  };

  /* ── Load a MedScribe prescription ── */
  const loadPrescription = (rx) => {
    const soap = rx.data?.soap_note || {};
    const meds = rx.data?.medications || [];
    const instructions = rx.data?.patient_instructions_translated || rx.data?.patient_instructions || '';
    setMessages([
      { role: 'user', text: `${t('labSamjho.prescriptions')}: ${rx.title}`, timestamp: new Date(rx.date) },
      {
        role: 'assistant',
        text: `**${t('medscribe.assessment')}:** ${soap.assessment || 'N/A'}\n\n**${t('medscribe.plan')}:** ${soap.plan || 'N/A'}\n\n**${t('medscribe.medications')}:**\n${meds.map(m => `- ${m.name} ${m.dosage || ''} ${m.frequency || ''}`).join('\n')}\n\n**${t('medscribe.patientInstructions')}:** ${instructions}`,
        timestamp: new Date(),
      },
    ]);
    setActiveAnalysis(null);
    setShowDocs(false);
    scrollToBottom();
  };

  /* ── Ask follow-up question ── */
  const submitQuestion = async (question, isVoice = false) => {
    if (!question || isLoading) return;
    setMessages(prev => [...prev, { role: 'user', text: question, isVoice, timestamp: new Date() }]);
    setTextInput('');
    setIsLoading(true);
    scrollToBottom();

    try {
      if (activeAnalysis) {
        const data = await askLabQuestion(question, activeAnalysis, language);
        setMessages(prev => [...prev, {
          role: 'assistant', text: data.answer_translated || data.answer, audio_url: data.audio_url, timestamp: new Date(),
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant', text: t('labSamjho.uploadFirst'),
          timestamp: new Date(),
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant', text: err.response?.data?.detail || t('common.error'), isError: true, timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim() || isLoading) return;
    submitQuestion(textInput.trim(), false);
  };

  /* ── Voice input ── */
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Speech recognition not supported. Use Chrome.'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = langConfig?.speechCode || 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognitionRef.current = recognition;
    let finalTranscript = '';
    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + ' ';
        else interim += event.results[i][0].transcript;
      }
      setLiveTranscript((finalTranscript + interim).trim());
    };
    recognition.onerror = () => { setIsRecording(false); setLiveTranscript(''); if (timerRef.current) clearInterval(timerRef.current); };
    recognition.onend = () => {
      if (finalTranscript.trim() && isRecording) submitQuestion(finalTranscript.trim(), true);
      setIsRecording(false); setLiveTranscript(''); if (timerRef.current) clearInterval(timerRef.current);
    };
    recognition.start();
    setIsRecording(true); setLiveTranscript(''); setRecordDuration(0);
    timerRef.current = setInterval(() => { setRecordDuration(d => { if (d + 1 >= 60) { stopRecording(); return 60; } return d + 1; }); }, 1000);
  };

  const stopRecording = () => {
    if (recognitionRef.current) try { recognitionRef.current.stop(); } catch {}
    if (timerRef.current) clearInterval(timerRef.current);
    if (liveTranscript.trim()) submitQuestion(liveTranscript.trim(), true);
    setIsRecording(false); setLiveTranscript('');
  };

  const clearChat = () => { setMessages([]); setActiveAnalysis(null); };

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const formatTimestamp = (d) => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="h-[calc(100vh-130px)] flex overflow-hidden rounded-3xl bg-gray-50 gap-3">
      {/* ── Main Chat Area (LEFT) ── */}
      <div className="flex-1 flex flex-col overflow-hidden border border-gray-200 rounded-2xl bg-white shadow-sm">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowDocs(!showDocs)}
              className={`lg:hidden p-2 rounded-lg transition-colors ${showDocs ? 'bg-primary-50 text-primary-500' : 'text-gray-400 hover:bg-gray-100'}`}
              title={t('labSamjho.myDocuments')}>
              <FileText size={18} />
            </button>
            <div>
              <h2 className="font-heading text-sm font-bold text-dark">{t('labSamjho.title')}</h2>
              <p className="text-[11px] text-green-500 font-medium">
                {activeAnalysis ? `${activeAnalysis.parameters?.length || 0} ${t('labSamjho.parametersLoaded') || 'parameters loaded'}` : t('labSamjho.uploadToStart')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <>
                <button onClick={clearChat}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-semibold bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors"
                  title="New Chat">
                  <Plus size={14} /> {t('labSamjho.newChat') || 'New Chat'}
                </button>
                <button onClick={clearChat} className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title={t('common.clearChat')}>
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 chat-scroll">
          {/* Welcome */}
          <div className="flex justify-start">
            <div className="max-w-[80%] sm:max-w-[70%]">
              <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100">
                <p className="text-sm text-dark font-body leading-relaxed">{t('labSamjho.subtitle')}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-[11px] font-heading font-semibold bg-primary-500 text-white px-3 py-1.5 rounded-lg hover:bg-primary-600 transition-colors">
                    <Upload size={12} /> {t('labSamjho.uploadReport')}
                  </button>
                  {(labReports.length > 0 || prescriptions.length > 0) && (
                    <button onClick={() => setShowDocs(true)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-heading font-semibold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                      <FileText size={12} /> {t('labSamjho.myDocuments')}
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1 ml-2 font-body">SwasthyaMitra</p>
            </div>
          </div>

          {/* Chat messages */}
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            const isLastAssistant = !isUser && i === messages.length - 1;

            return (
              <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}>
                <div className="max-w-[85%] sm:max-w-[75%]">
                  {/* File attachment preview */}
                  {msg.file && (
                    <div className={`mb-1 ${isUser ? 'flex justify-end' : ''}`}>
                      <div className="inline-flex items-center gap-2 bg-primary-400 text-white px-3 py-2 rounded-xl text-[11px] font-heading">
                        {msg.file.type === 'application/pdf' ? <FileScan size={14} /> : <FileText size={14} />}
                        {msg.file.name}
                      </div>
                      {msg.file.previewUrl && (
                        <img src={msg.file.previewUrl} alt="Report" className="mt-1 max-h-40 rounded-xl border border-gray-200 object-contain" />
                      )}
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className={`px-4 py-3 shadow-sm ${
                    isUser
                      ? 'bg-primary-500 text-white rounded-2xl rounded-tr-md'
                      : msg.isError
                        ? 'bg-red-50 text-red-600 rounded-2xl rounded-tl-md border border-red-100'
                        : 'bg-white text-dark rounded-2xl rounded-tl-md border border-gray-100'
                  }`}>
                    {/* Analysis result card */}
                    {msg.analysisResult && <AnalysisCard result={msg.analysisResult} t={t} />}

                    {/* Text */}
                    {msg.text && (!msg.analysisResult || msg.text !== t('labSamjho.resultReady')) && (
                      <p className="text-sm font-body leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}
                    {msg.analysisResult && (
                      <p className="text-xs font-body text-gray-500 mt-2 italic">{t('labSamjho.askAnything')}</p>
                    )}

                    {msg.isVoice && isUser && (
                      <div className="flex items-center gap-1 mt-1.5 opacity-70">
                        <Mic size={11} /><span className="text-[10px]">{t('common.voice')}</span>
                      </div>
                    )}
                  </div>

                  {/* Audio */}
                  {msg.audio_url && (
                    <div className="mt-1.5">
                      <AudioPlayer audioUrl={msg.audio_url} label={t('common.listen')} autoPlay={isLastAssistant} />
                    </div>
                  )}

                  <p className={`text-[10px] text-gray-400 mt-1 font-body ${isUser ? 'text-right mr-2' : 'ml-2'}`}>
                    {formatTimestamp(msg.timestamp)}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="max-w-[80%]">
                <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                    <span className="text-xs text-gray-400 font-body">
                      {activeAnalysis ? t('careGuide.thinking') : t('labSamjho.analyzing')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Disclaimer */}
        <div className="px-4 pb-1"><Disclaimer /></div>

        {/* Recording bar */}
        {isRecording && (
          <div className="px-4 pb-2 animate-fade-in">
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              <span className="text-xs text-red-600 font-heading font-semibold flex-1">{t('careGuide.recording')} {formatTime(recordDuration)}</span>
              {liveTranscript && <span className="text-xs text-dark font-body italic truncate max-w-[50%]">{liveTranscript}</span>}
              <button onClick={stopRecording} className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg font-heading font-semibold hover:bg-red-600">{t('common.send')}</button>
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="bg-white border-t border-gray-100 px-3 py-2.5 shrink-0">
          <form onSubmit={handleTextSubmit} className="flex items-end gap-2">
            {/* Upload button */}
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-100 text-gray-500 hover:bg-primary-50 hover:text-primary-500 transition-colors disabled:opacity-40"
              title={t('labSamjho.uploadReport')}>
              <Paperclip size={18} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp,image/bmp,application/pdf" capture="environment" onChange={handleFileUpload} className="hidden" />

            {/* Mic */}
            <button type="button" onClick={() => isRecording ? stopRecording() : startRecording()} disabled={isLoading}
              className={`relative w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all overflow-hidden disabled:opacity-40 ${
                isRecording ? 'scale-110' : 'hover:scale-105'
              }`}>
              <img src={recordOrb} alt="" className={`absolute inset-0 w-full h-full object-cover rounded-full ${isRecording ? 'animate-pulse' : ''}`} />
              <span className="relative z-10">
                {isRecording ? <Square size={16} className="text-white drop-shadow-md" fill="white" /> : <Mic size={16} className="text-white drop-shadow-md" strokeWidth={2.5} />}
              </span>
            </button>

            {/* Text input */}
            <div className="flex-1">
              <input type="text" value={isRecording ? liveTranscript : textInput}
                onChange={(e) => !isRecording && setTextInput(e.target.value)}
                placeholder={isRecording ? t('careGuide.recording') : t('careGuide.askPlaceholder')}
                disabled={isLoading || isRecording}
                className="w-full px-4 py-2.5 rounded-2xl bg-gray-100 border border-gray-200 font-body text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-300 focus:bg-white disabled:opacity-50 placeholder:text-gray-400 transition-all" />
            </div>

            {/* Send */}
            <button type="submit" disabled={(!textInput.trim() && !isRecording) || isLoading}
              className="w-10 h-10 bg-primary-500 text-white rounded-full flex items-center justify-center shrink-0 hover:bg-primary-600 disabled:opacity-30 transition-all active:scale-95 shadow-md">
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* ── Document Panel (RIGHT, sticky) ── */}
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
            <h3 className="font-heading text-sm font-bold text-dark">{t('labSamjho.myDocuments')}</h3>
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
              {t('healthTimeline.labReports')}
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
              {t('labSamjho.prescriptions')}
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
                <p className="text-xs text-gray-400 font-body">{t('labSamjho.noReports')}</p>
                <button onClick={() => fileInputRef.current?.click()}
                  className="mt-3 text-[11px] font-heading font-semibold text-primary-500 hover:text-primary-600">
                  {t('labSamjho.uploadReport')}
                </button>
              </div>
            ) : labReports.slice(0, 15).map((r) => (
              <div key={r.id} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-primary-50 transition-colors group mb-1">
                <button onClick={() => { loadReport(r); setShowDocs(false); }}
                  className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                  <div className="w-9 h-9 bg-sky-50 rounded-lg flex items-center justify-center shrink-0 border border-sky-100">
                    <FileText size={15} className="text-sky-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-heading font-semibold text-dark truncate">{r.title}</p>
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
            ))
          ) : (
            prescriptions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 ring-1 ring-gray-100">
                  <Stethoscope size={20} className="text-gray-300" />
                </div>
                <p className="text-xs text-gray-400 font-body">{t('labSamjho.noPrescriptions')}</p>
              </div>
            ) : prescriptions.slice(0, 15).map((rx) => (
              <div key={rx.id} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-emerald-50 transition-colors group mb-1">
                <button onClick={() => { loadPrescription(rx); setShowDocs(false); }}
                  className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
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
