import { useState, useRef, useEffect } from 'react';
import {
  Upload, Send, Mic, MicOff, FileText, AlertTriangle, CheckCircle,
  Paperclip, Trash2, ChevronRight, Stethoscope, X, FileScan,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { analyzeLabReport, askLabQuestion } from '../services/api';
import { saveInteraction, getInteractions } from '../services/dataStore';
import { LANGUAGES, CLASSIFICATION_COLORS } from '../utils/constants';
import AudioPlayer from '../components/AudioPlayer';
import Disclaimer from '../components/Disclaimer';

const WELCOME_MSG = {
  hindi: 'नमस्ते! अपनी लैब रिपोर्ट अपलोड करें और मैं उसका विश्लेषण करूंगा। फिर आप उसके बारे में सवाल पूछ सकते हैं।',
  tamil: 'வணக்கம்! உங்கள் லேப் அறிக்கையை பதிவேற்றவும், நான் அதை பகுப்பாய்வு செய்கிறேன். பின்னர் கேள்விகள் கேளுங்கள்.',
  english: 'Hello! Upload your lab report and I\'ll analyze it. You can then ask follow-up questions about your results.',
  telugu: 'నమస్కారం! మీ ల్యాబ్ రిపోర్ట్ అప్‌లోడ్ చేయండి, నేను విశ్లేషిస్తాను. తర్వాత మీరు ప్రశ్నలు అడగవచ్చు.',
  kannada: 'ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಲ್ಯಾಬ್ ರಿಪೋರ್ಟ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ, ನಾನು ವಿಶ್ಲೇಷಿಸುತ್ತೇನೆ.',
  malayalam: 'നമസ്കാരം! നിങ്ങളുടെ ലാബ് റിപ്പോർട്ട് അപ്‌ലോഡ് ചെയ്യുക.',
  bengali: 'নমস্কার! আপনার ল্যাব রিপোর্ট আপলোড করুন।',
  marathi: 'नमस्कार! तुमचा लॅब रिपोर्ट अपलोड करा.',
  gujarati: 'નમસ્તે! તમારો લેબ રિપોર્ટ અપલોડ કરો.',
};

const PLACEHOLDERS = {
  hindi: 'रिपोर्ट के बारे में सवाल पूछें...',
  tamil: 'அறிக்கை பற்றி கேள்வி கேளுங்கள்...',
  english: 'Ask about your report...',
  telugu: 'మీ రిపోర్ట్ గురించి అడగండి...',
  kannada: 'ನಿಮ್ಮ ರಿಪೋರ್ಟ್ ಬಗ್ಗೆ ಕೇಳಿ...',
  malayalam: 'നിങ്ങളുടെ റിപ്പോർട്ടിനെ കുറിച്ച് ചോദിക്കുക...',
  bengali: 'আপনার রিপোর্ট সম্পর্কে জিজ্ঞাসা করুন...',
  marathi: 'तुमच्या रिपोर्ट बद्दल विचारा...',
  gujarati: 'તમારા રિપોર્ટ વિશે પૂછો...',
};

/* ── Compact parameter card inside chat ── */
function AnalysisCard({ result }) {
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
          <CheckCircle size={12} /> {normalCount} Normal
        </span>
        {flaggedCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] font-heading font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded-lg">
            <AlertTriangle size={12} /> {flaggedCount} Flagged
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
          {expanded ? 'Show less' : `Show all ${params.length} parameters`}
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
  const { language } = useLanguage();
  const { addNotification } = useNotifications();
  const [messages, setMessages] = useState([]);
  const [textInput, setTextInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeAnalysis, setActiveAnalysis] = useState(null); // current report analysis for Q&A
  const [showDocs, setShowDocs] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [recordDuration, setRecordDuration] = useState(0);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const langConfig = LANGUAGES[language];
  const labReports = getInteractions('lab_report');
  const prescriptions = getInteractions('medscribe');

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
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Please upload a JPEG, PNG, or PDF file.', isError: true, timestamp: new Date() }]);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'File too large. Maximum 10MB.', isError: true, timestamp: new Date() }]);
      return;
    }

    // Show upload message
    const previewUrl = file.type !== 'application/pdf' ? URL.createObjectURL(file) : null;
    setMessages(prev => [...prev, {
      role: 'user', text: `Uploaded: ${file.name}`, file: { name: file.name, type: file.type, previewUrl }, timestamp: new Date(),
    }]);
    scrollToBottom();

    // Analyze
    setIsLoading(true);
    try {
      const data = await analyzeLabReport(file, language);
      setActiveAnalysis(data);
      saveInteraction('lab_report', data);
      const flagged = data.parameters?.filter(p => p.classification !== 'Normal').length || 0;
      addNotification('Lab report analyzed', `${data.parameters?.length || 0} parameters, ${flagged} flagged`, flagged > 0 ? 'warning' : 'success', '/lab-samjho');
      setMessages(prev => [...prev, {
        role: 'assistant', analysisResult: data, audio_url: data.audio_url,
        text: 'Here are your lab report results. You can ask me any questions about these values.',
        timestamp: new Date(),
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant', text: err.response?.data?.detail || 'Failed to analyze report. Please try again.', isError: true, timestamp: new Date(),
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
      { role: 'user', text: `Loaded report: ${report.title}`, timestamp: new Date(report.date) },
      {
        role: 'assistant', analysisResult: report.data, audio_url: report.data?.audio_url,
        text: 'I\'ve loaded your previous report. Ask me anything about these results.',
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
      { role: 'user', text: `Loaded prescription: ${rx.title}`, timestamp: new Date(rx.date) },
      {
        role: 'assistant',
        text: `**Doctor's Notes:**\n\n**Assessment:** ${soap.assessment || 'N/A'}\n\n**Plan:** ${soap.plan || 'N/A'}\n\n**Medications:**\n${meds.map(m => `- ${m.name} ${m.dosage || ''} ${m.frequency || ''}`).join('\n')}\n\n**Instructions:** ${instructions}`,
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
          role: 'assistant', text: 'Please upload a lab report first, or select one from your documents to ask questions about.',
          timestamp: new Date(),
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant', text: err.response?.data?.detail || 'Something went wrong. Please try again.', isError: true, timestamp: new Date(),
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
    <div className="h-[calc(100vh-130px)] flex overflow-hidden rounded-3xl bg-gray-50">
      {/* ── Document Sidebar ── */}
      <div className={`${showDocs ? 'w-72' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 bg-white shrink-0`}>
        <div className="w-72 h-full flex flex-col">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-heading text-sm font-bold text-dark">My Documents</h3>
            <button onClick={() => setShowDocs(false)} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"><X size={16} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {/* Lab Reports */}
            <div>
              <h4 className="text-[10px] font-heading font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Lab Reports</h4>
              {labReports.length === 0 ? (
                <p className="text-[11px] text-gray-400 font-body px-1">No reports yet</p>
              ) : labReports.slice(0, 10).map((r, i) => (
                <button key={r.id} onClick={() => loadReport(r)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-primary-50 transition-colors text-left group mb-1">
                  <div className="w-8 h-8 bg-sky-50 rounded-lg flex items-center justify-center shrink-0 border border-sky-100">
                    <FileText size={14} className="text-sky-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-heading font-semibold text-dark truncate">{r.title}</p>
                    <p className="text-[9px] font-body text-gray-400">{new Date(r.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <ChevronRight size={12} className="text-gray-300 group-hover:text-primary-500 shrink-0" />
                </button>
              ))}
            </div>

            {/* MedScribe Prescriptions */}
            <div>
              <h4 className="text-[10px] font-heading font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Prescriptions</h4>
              {prescriptions.length === 0 ? (
                <p className="text-[11px] text-gray-400 font-body px-1">No prescriptions yet</p>
              ) : prescriptions.slice(0, 10).map((rx) => (
                <button key={rx.id} onClick={() => loadPrescription(rx)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-emerald-50 transition-colors text-left group mb-1">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100">
                    <Stethoscope size={14} className="text-emerald-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-heading font-semibold text-dark truncate">{rx.title}</p>
                    <p className="text-[9px] font-body text-gray-400">{new Date(rx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                  </div>
                  <ChevronRight size={12} className="text-gray-300 group-hover:text-emerald-500 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowDocs(!showDocs)}
              className={`p-2 rounded-lg transition-colors ${showDocs ? 'bg-primary-50 text-primary-500' : 'text-gray-400 hover:bg-gray-100'}`}
              title="My Documents">
              <FileText size={18} />
            </button>
            <div>
              <h2 className="font-heading text-sm font-bold text-dark">Lab Samjho</h2>
              <p className="text-[11px] text-green-500 font-medium">
                {activeAnalysis ? `${activeAnalysis.parameters?.length || 0} parameters loaded` : 'Upload a report to start'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button onClick={clearChat} className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Clear chat">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 chat-scroll">
          {/* Welcome */}
          <div className="flex justify-start">
            <div className="max-w-[80%] sm:max-w-[70%]">
              <div className="bg-white rounded-2xl rounded-tl-md px-4 py-3 shadow-sm border border-gray-100">
                <p className="text-sm text-dark font-body leading-relaxed">{WELCOME_MSG[language] || WELCOME_MSG.english}</p>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 text-[11px] font-heading font-semibold bg-primary-500 text-white px-3 py-1.5 rounded-lg hover:bg-primary-600 transition-colors">
                    <Upload size={12} /> Upload Report
                  </button>
                  {(labReports.length > 0 || prescriptions.length > 0) && (
                    <button onClick={() => setShowDocs(true)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-heading font-semibold bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors">
                      <FileText size={12} /> My Documents
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
                    {msg.analysisResult && <AnalysisCard result={msg.analysisResult} />}

                    {/* Text */}
                    {msg.text && (!msg.analysisResult || msg.text !== 'Here are your lab report results. You can ask me any questions about these values.') && (
                      <p className="text-sm font-body leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    )}
                    {msg.analysisResult && (
                      <p className="text-xs font-body text-gray-500 mt-2 italic">Ask me anything about these results below.</p>
                    )}

                    {msg.isVoice && isUser && (
                      <div className="flex items-center gap-1 mt-1.5 opacity-70">
                        <Mic size={11} /><span className="text-[10px]">Voice</span>
                      </div>
                    )}
                  </div>

                  {/* Audio */}
                  {msg.audio_url && (
                    <div className="mt-1.5">
                      <AudioPlayer audioUrl={msg.audio_url} label="Listen" autoPlay={isLastAssistant} />
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
                      {activeAnalysis ? 'Thinking...' : 'Analyzing your report...'}
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
              <span className="text-xs text-red-600 font-heading font-semibold flex-1">Recording {formatTime(recordDuration)}</span>
              {liveTranscript && <span className="text-xs text-dark font-body italic truncate max-w-[50%]">{liveTranscript}</span>}
              <button onClick={stopRecording} className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg font-heading font-semibold hover:bg-red-600">Send</button>
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="bg-white border-t border-gray-100 px-3 py-2.5 shrink-0">
          <form onSubmit={handleTextSubmit} className="flex items-end gap-2">
            {/* Upload button */}
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isLoading}
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-gray-100 text-gray-500 hover:bg-primary-50 hover:text-primary-500 transition-colors disabled:opacity-40"
              title="Upload report">
              <Paperclip size={18} />
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,application/pdf" capture="environment" onChange={handleFileUpload} className="hidden" />

            {/* Mic */}
            <button type="button" onClick={() => isRecording ? stopRecording() : startRecording()} disabled={isLoading}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-primary-50 hover:text-primary-500'
              } disabled:opacity-40`}>
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* Text input */}
            <div className="flex-1">
              <input type="text" value={isRecording ? liveTranscript : textInput}
                onChange={(e) => !isRecording && setTextInput(e.target.value)}
                placeholder={isRecording ? 'Listening...' : (PLACEHOLDERS[language] || PLACEHOLDERS.english)}
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
    </div>
  );
}
