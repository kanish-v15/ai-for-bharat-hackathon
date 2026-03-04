import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, CheckCircle, ChevronDown, ChevronUp, Edit3, MessageCircle } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGES } from '../../utils/constants';
import {
  BLOOD_GROUPS, GENDERS, INDIAN_STATES,
  PATIENT_REQUIRED_FIELDS, validateField,
} from '../../utils/profileHelpers';

const QUESTIONS = [
  { field: 'fullName', question: "What is your full name?", questionHi: "आपका पूरा नाम क्या है?", type: 'text', placeholder: 'e.g., Ramesh Kumar' },
  { field: 'dateOfBirth', question: "What is your date of birth?", questionHi: "आपकी जन्म तिथि क्या है?", type: 'date', placeholder: 'DD/MM/YYYY' },
  { field: 'gender', question: "What is your gender?", questionHi: "आपका लिंग क्या है?", type: 'select', options: GENDERS, placeholder: 'Male / Female / Other' },
  { field: 'email', question: "What is your email address? (optional, say skip to skip)", questionHi: "आपका ईमेल पता क्या है? (वैकल्पिक, स्किप कहें)", type: 'text', optional: true, placeholder: 'email@example.com' },
  { field: 'address.district', question: "Which district do you live in?", questionHi: "आप किस जिले में रहते हैं?", type: 'text', placeholder: 'e.g., Chennai, Patna' },
  { field: 'address.state', question: "Which state?", questionHi: "कौन सा राज्य?", type: 'select', options: INDIAN_STATES, placeholder: 'e.g., Tamil Nadu' },
  { field: 'address.pin', question: "What is your PIN code?", questionHi: "आपका पिन कोड क्या है?", type: 'text', placeholder: '6-digit PIN code' },
  { field: 'bloodGroup', question: "What is your blood group? (say skip if unsure)", questionHi: "आपका ब्लड ग्रुप क्या है? (अगर नहीं पता तो स्किप कहें)", type: 'select', options: BLOOD_GROUPS, optional: true, placeholder: 'e.g., B+, O-' },
  { field: 'emergencyContactName', question: "Who is your emergency contact? Tell me their name.", questionHi: "आपका आपातकालीन संपर्क कौन है? उनका नाम बताइए।", type: 'text', placeholder: 'e.g., Priya Kumar' },
  { field: 'emergencyContactPhone', question: "What is their phone number?", questionHi: "उनका फोन नंबर क्या है?", type: 'text', placeholder: '10-digit number' },
  { field: 'knownAllergies', question: "Do you have any known allergies? (say none or skip if no)", questionHi: "क्या आपको कोई एलर्जी है? (नहीं या स्किप कहें)", type: 'text', optional: true, placeholder: 'e.g., Penicillin, Peanuts' },
  { field: 'chronicConditions', question: "Do you have any chronic conditions like diabetes or BP? (say none or skip if no)", questionHi: "क्या आपको कोई पुरानी बीमारी है? (नहीं या स्किप कहें)", type: 'text', optional: true, placeholder: 'e.g., Diabetes, Hypertension' },
  { field: 'currentMedications', question: "Are you taking any medications currently? (say none or skip)", questionHi: "क्या आप कोई दवाई ले रहे हैं? (नहीं या स्किप कहें)", type: 'text', optional: true, placeholder: 'e.g., Metformin 500mg' },
];

function getVal(obj, path) {
  return path.split('.').reduce((acc, k) => acc?.[k], obj) ?? '';
}

function setVal(obj, path, value) {
  const result = { ...obj };
  const keys = path.split('.');
  if (keys.length === 1) {
    result[keys[0]] = value;
  } else {
    result[keys[0]] = { ...result[keys[0]], [keys[1]]: value };
  }
  return result;
}

function matchSelect(transcript, options) {
  const t = transcript.toLowerCase().trim();
  for (const opt of options) {
    const val = (typeof opt === 'string' ? opt : opt.value || opt).toLowerCase();
    const label = (typeof opt === 'string' ? opt : opt.label || opt).toLowerCase();
    if (t.includes(val) || t.includes(label)) return typeof opt === 'string' ? opt : (opt.value || opt);
  }
  return null;
}

export default function PatientProfileForm({ initialData = {}, onSave, mode = 'setup', phone = '' }) {
  const { language } = useLanguage();
  const [form, setForm] = useState({ ...initialData });
  const [currentQ, setCurrentQ] = useState(0);
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [done, setDone] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);

  const langConfig = LANGUAGES.find(l => l.code === language);
  const speechCode = langConfig?.speechCode || 'en-IN';

  // Start with greeting
  useEffect(() => {
    const greeting = language === 'hindi'
      ? "नमस्ते! मैं आपका प्रोफ़ाइल बनाने में मदद करूँगा। बस मेरे सवालों का जवाब दें — बोलें या टाइप करें।"
      : "Hi! I'll help you set up your profile. Just answer my questions — speak or type.";
    setMessages([{ role: 'ai', text: greeting }]);
    // Ask first question after a short delay
    setTimeout(() => {
      askQuestion(0);
    }, 800);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveTranscript]);

  const askQuestion = (idx) => {
    if (idx >= QUESTIONS.length) {
      setDone(true);
      const doneMsg = language === 'hindi'
        ? "बहुत अच्छा! आपका प्रोफ़ाइल तैयार है। कृपया नीचे सेव बटन दबाएं।"
        : "Great! Your profile is ready. Please click Save below.";
      setMessages(prev => [...prev, { role: 'ai', text: doneMsg }]);
      return;
    }
    const q = QUESTIONS[idx];
    const text = language === 'hindi' && q.questionHi ? q.questionHi : q.question;
    setMessages(prev => [...prev, { role: 'ai', text, field: q.field }]);
    setCurrentQ(idx);
  };

  const handleAnswer = (answer) => {
    const q = QUESTIONS[currentQ];
    const trimmed = answer.trim();

    // Skip handling
    if (/^(skip|none|no|nahi|nahi hai|kuch nahi|स्किप|नहीं|कोई नहीं)$/i.test(trimmed)) {
      if (q.optional) {
        setMessages(prev => [...prev, { role: 'user', text: trimmed }, { role: 'ai', text: language === 'hindi' ? 'ठीक है, आगे बढ़ते हैं।' : 'Okay, moving on.' }]);
        setTimeout(() => askQuestion(currentQ + 1), 500);
        return;
      }
    }

    // For select fields, try to match
    let value = trimmed;
    if (q.type === 'select' && q.options) {
      const matched = matchSelect(trimmed, q.options);
      if (matched) {
        value = matched;
      } else {
        // If couldn't match, ask again
        setMessages(prev => [...prev,
          { role: 'user', text: trimmed },
          { role: 'ai', text: language === 'hindi' ? `कृपया इनमें से चुनें: ${q.options.join(', ')}` : `Please choose from: ${q.options.join(', ')}` }
        ]);
        return;
      }
    }

    // Validate required fields
    if (PATIENT_REQUIRED_FIELDS.includes(q.field) && !q.optional) {
      const result = validateField(q.field, value);
      if (!result.valid) {
        setMessages(prev => [...prev,
          { role: 'user', text: trimmed },
          { role: 'ai', text: language === 'hindi' ? `कृपया सही जानकारी दें। ${result.error}` : `Please provide valid info. ${result.error}` }
        ]);
        return;
      }
    }

    // Save value
    setForm(prev => setVal(prev, q.field, value));
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);

    // Confirmation + next question
    const confirmations = language === 'hindi'
      ? ['अच्छा!', 'ठीक है।', 'बहुत बढ़िया!', 'नोट कर लिया।']
      : ['Got it!', 'Noted.', 'Perfect!', 'Okay!'];
    const conf = confirmations[Math.floor(Math.random() * confirmations.length)];

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: conf }]);
      setTimeout(() => askQuestion(currentQ + 1), 400);
    }, 300);
  };

  // Web Speech API
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Voice not supported. Please type your answer.' }]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = speechCode;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      setLiveTranscript(final || interim);
      if (final) {
        setIsListening(false);
        setLiveTranscript('');
        handleAnswer(final);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setLiveTranscript('');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setLiveTranscript('');
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    if (liveTranscript.trim()) {
      handleAnswer(liveTranscript);
      setLiveTranscript('');
    }
  };

  const handleTextSubmit = (e) => {
    e?.preventDefault();
    if (!textInput.trim()) return;
    handleAnswer(textInput);
    setTextInput('');
  };

  const handleSubmit = () => {
    // Final validation
    const errors = [];
    PATIENT_REQUIRED_FIELDS.forEach(field => {
      const val = getVal(form, field);
      const result = validateField(field, val);
      if (!result.valid) errors.push(`${field}: ${result.error}`);
    });
    if (errors.length > 0) {
      setMessages(prev => [...prev, { role: 'ai', text: `Some fields need attention: ${errors.join(', ')}` }]);
      return;
    }
    onSave(form);
  };

  const filledCount = QUESTIONS.filter(q => {
    const v = getVal(form, q.field);
    return v && (typeof v !== 'string' || v.trim());
  }).length;

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[700px]">
      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${(filledCount / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-heading font-semibold text-warm-gray">{filledCount}/{QUESTIONS.length}</span>
        <button
          onClick={() => setShowSummary(!showSummary)}
          className="text-xs font-heading font-semibold text-primary-500 flex items-center gap-1 hover:text-primary-600"
        >
          {showSummary ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {showSummary ? 'Hide' : 'Summary'}
        </button>
      </div>

      {/* Collapsible Summary */}
      {showSummary && (
        <div className="mb-3 bg-white rounded-xl border border-gray-200 p-3 animate-fade-in max-h-48 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {QUESTIONS.map(q => {
              const v = getVal(form, q.field);
              return v ? (
                <div key={q.field} className="flex items-start gap-1.5">
                  <CheckCircle size={12} className="text-india-green shrink-0 mt-0.5" />
                  <div>
                    <span className="text-warm-gray">{q.field.split('.').pop()}: </span>
                    <span className="font-medium text-dark">{v}</span>
                  </div>
                </div>
              ) : null;
            })}
            {filledCount === 0 && <p className="text-warm-gray col-span-2">No fields filled yet.</p>}
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto rounded-2xl bg-gray-50 border border-gray-200 p-4 space-y-3 mb-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              msg.role === 'user'
                ? 'bg-primary-500 text-white rounded-br-md'
                : 'bg-white border border-gray-200 text-dark rounded-bl-md shadow-sm'
            }`}>
              {msg.role === 'ai' && (
                <div className="flex items-center gap-1.5 mb-1">
                  <MessageCircle size={12} className="text-primary-500" />
                  <span className="text-[10px] font-heading font-semibold text-primary-500">SwasthyaMitra</span>
                </div>
              )}
              <p className="text-sm font-body leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Live transcript */}
        {isListening && liveTranscript && (
          <div className="flex justify-end animate-fade-in">
            <div className="max-w-[80%] rounded-2xl px-4 py-2.5 bg-primary-100 text-primary-700 rounded-br-md border border-primary-200">
              <p className="text-sm font-body italic">{liveTranscript}...</p>
            </div>
          </div>
        )}

        {/* Listening indicator */}
        {isListening && !liveTranscript && (
          <div className="flex justify-end animate-fade-in">
            <div className="rounded-2xl px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 rounded-br-md">
              <p className="text-sm font-body flex items-center gap-2">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                {language === 'hindi' ? 'सुन रहा हूँ...' : 'Listening...'}
              </p>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input area */}
      {!done ? (
        <div className="flex items-center gap-2">
          {/* Mic button */}
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${
              isListening
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                : 'bg-primary-500 text-white hover:bg-primary-600 shadow-md shadow-primary-500/20'
            }`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Text input */}
          <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={QUESTIONS[currentQ]?.placeholder || (language === 'hindi' ? 'टाइप करें...' : 'Type your answer...')}
              className="flex-1 h-12 px-4 rounded-xl border border-gray-200 bg-white text-sm font-body focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="w-12 h-12 rounded-full bg-primary-500 text-white flex items-center justify-center shrink-0 hover:bg-primary-600 disabled:opacity-30 disabled:hover:bg-primary-500 transition-all"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3.5 rounded-xl font-heading font-bold text-sm hover:from-primary-600 hover:to-primary-700 active:scale-[0.99] transition-all shadow-lg shadow-primary-500/20"
        >
          <CheckCircle size={16} className="inline mr-2" />
          {mode === 'setup'
            ? (language === 'hindi' ? 'प्रोफ़ाइल सेव करें' : 'Save Profile & Continue')
            : (language === 'hindi' ? 'बदलाव सेव करें' : 'Save Changes')}
        </button>
      )}
    </div>
  );
}
