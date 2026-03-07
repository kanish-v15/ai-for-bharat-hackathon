import { useState, useEffect, useCallback, useRef } from 'react';
import {
  User, Building2, GraduationCap, Briefcase, Sparkles, Mic,
  CheckCircle, Volume2, Square, VolumeX, MessageCircle, Loader2,
} from 'lucide-react';
import VoiceFormField from './VoiceFormField';
import WaveformVisualizer from './WaveformVisualizer';
import { useLanguage } from '../../context/LanguageContext';
import { useBackendVoice } from '../../hooks/useBackendVoice';
import {
  SPECIALIZATIONS, REGISTRATION_COUNCILS, QUALIFICATIONS,
  INDIAN_STATES, DOCTOR_REQUIRED_FIELDS, validateField,
} from '../../utils/profileHelpers';
import recordOrb from '../../../icons/image 96.png';

const FIELD_ORDER = [
  'fullName', 'email',
  'medicalRegNumber', 'registrationCouncil', 'specialization', 'qualification',
  'clinicHospitalName', 'clinicAddress.district', 'clinicAddress.state', 'clinicAddress.pin',
  'yearsOfExperience', 'consultationFee', 'availableLanguages', 'workingHours',
];

const FIELD_PROMPTS = {
  fullName: { english: 'Please tell me your full name', hindi: 'कृपया अपना पूरा नाम बताइए' },
  email: { english: 'What is your email address?', hindi: 'आपका ईमेल पता क्या है?' },
  medicalRegNumber: { english: 'What is your medical registration number?', hindi: 'आपका मेडिकल रजिस्ट्रेशन नंबर क्या है?' },
  registrationCouncil: { english: 'Which medical council are you registered with?', hindi: 'आप किस मेडिकल काउंसिल में रजिस्टर्ड हैं?' },
  specialization: { english: 'What is your specialization?', hindi: 'आपकी विशेषज्ञता क्या है?' },
  qualification: { english: 'What is your highest medical qualification?', hindi: 'आपकी सबसे ऊँची मेडिकल डिग्री क्या है?' },
  clinicHospitalName: { english: 'What is the name of your clinic or hospital?', hindi: 'आपके क्लिनिक या अस्पताल का नाम क्या है?' },
  'clinicAddress.district': { english: 'Which district is your clinic in?', hindi: 'आपका क्लिनिक किस जिले में है?' },
  'clinicAddress.state': { english: 'Which state is your clinic in?', hindi: 'आपका क्लिनिक किस राज्य में है?' },
  'clinicAddress.pin': { english: "What is your clinic's PIN code?", hindi: 'आपके क्लिनिक का पिन कोड क्या है?' },
  yearsOfExperience: { english: 'How many years of experience? Say skip to skip.', hindi: 'कितने साल का अनुभव है? स्किप कहें।' },
  consultationFee: { english: 'What is your consultation fee? Say skip to skip.', hindi: 'कंसल्टेशन फीस कितनी है? स्किप कहें।' },
  availableLanguages: { english: 'What languages do you speak? Say skip to skip.', hindi: 'आप कौन सी भाषाएँ बोलते हैं? स्किप कहें।' },
  workingHours: { english: 'What are your working hours? Say skip to skip.', hindi: 'काम के समय क्या हैं? स्किप कहें।' },
};

const FIELD_LABELS = {
  fullName: 'Full Name', email: 'Email', medicalRegNumber: 'Reg. Number',
  registrationCouncil: 'Council', specialization: 'Specialization', qualification: 'Qualification',
  clinicHospitalName: 'Clinic Name', 'clinicAddress.district': 'District',
  'clinicAddress.state': 'State', 'clinicAddress.pin': 'PIN Code',
  yearsOfExperience: 'Experience', consultationFee: 'Fee',
  availableLanguages: 'Languages', workingHours: 'Hours',
};

const SELECT_OPTIONS = {
  registrationCouncil: REGISTRATION_COUNCILS,
  specialization: SPECIALIZATIONS,
  qualification: QUALIFICATIONS,
  'clinicAddress.state': INDIAN_STATES,
};

const OPTIONAL_FIELDS = ['yearsOfExperience', 'consultationFee', 'availableLanguages', 'workingHours'];

function getPrompt(field, lang) {
  return FIELD_PROMPTS[field]?.[lang] || FIELD_PROMPTS[field]?.english || 'Please answer...';
}

function getVal(obj, path) {
  return path.split('.').reduce((acc, k) => acc?.[k], obj) ?? '';
}

function setVal(obj, path, value) {
  const result = { ...obj };
  const keys = path.split('.');
  if (keys.length === 1) { result[keys[0]] = value; }
  else { result[keys[0]] = { ...result[keys[0]], [keys[1]]: value }; }
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

export default function DoctorProfileForm({ initialData = {}, onSave, mode = 'setup', phone = '' }) {
  const { language } = useLanguage();
  const [form, setForm] = useState({ ...initialData });
  const [errors, setErrors] = useState({});
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceFieldIdx, setVoiceFieldIdx] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const voiceFieldIdxRef = useRef(0);
  const chatEndRef = useRef(null);
  const formRef = useRef(null);

  const {
    isListening, isSpeaking, isTranscribing,
    speak, cancelSpeech, startListening, stopListening, getAnalyser, cleanup,
  } = useBackendVoice(language);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length) {
      setForm(prev => ({ ...prev, ...initialData }));
    }
  }, []);

  useEffect(() => { voiceFieldIdxRef.current = voiceFieldIdx; }, [voiceFieldIdx]);
  useEffect(() => { return () => cleanup(); }, [cleanup]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, isListening]);

  const handleChange = (name, value) => {
    setForm(prev => setVal(prev, name, value));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = () => {
    const newErrors = {};
    DOCTOR_REQUIRED_FIELDS.forEach(field => {
      const val = getVal(form, field);
      const result = validateField(field, val);
      if (!result.valid) newErrors[field] = result.error;
    });
    if (form.email) {
      const r = validateField('email', form.email);
      if (!r.valid) newErrors.email = r.error;
    }
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }
    onSave(form);
  };

  const addChat = (role, text) => setChatMessages(prev => [...prev, { role, text }]);

  const handleSttError = useCallback((errType) => {
    const msg = errType === 'mic_denied'
      ? (language === 'hindi' ? 'माइक्रोफोन की अनुमति दें।' : 'Please allow microphone access.')
      : (language === 'hindi' ? 'आवाज़ नहीं सुनाई दी। फिर बोलिए।' : "Couldn't hear you. Please try again.");
    addChat('ai', msg);
    // Retry listening after a short delay
    setTimeout(() => {
      startListening((transcript) => handleVoiceAnswer(transcript), handleSttError);
    }, 800);
  }, [language, startListening]);

  const askField = useCallback((idx) => {
    if (idx >= FIELD_ORDER.length) {
      setVoiceActive(false);
      const doneMsg = language === 'hindi' ? 'सभी फील्ड भर गए हैं। कृपया सेव करें।' : 'All done! Please review and save your profile.';
      addChat('ai', doneMsg);
      speak(doneMsg);
      return;
    }
    setVoiceFieldIdx(idx);
    const field = FIELD_ORDER[idx];
    const prompt = getPrompt(field, language);
    addChat('ai', prompt);
    speak(prompt, () => {
      startListening((transcript) => handleVoiceAnswer(transcript), handleSttError);
    });
  }, [language, speak, startListening, handleSttError]);

  const handleVoiceAnswer = useCallback((transcript) => {
    const idx = voiceFieldIdxRef.current;
    const field = FIELD_ORDER[idx];
    const trimmed = transcript.trim();
    addChat('user', trimmed);

    if (/^(skip|none|no|nahi|स्किप|नहीं|இல்லை)$/i.test(trimmed)) {
      if (OPTIONAL_FIELDS.includes(field)) {
        addChat('ai', language === 'hindi' ? 'ठीक है, आगे बढ़ते हैं।' : 'Okay, skipping.');
        setTimeout(() => askField(idx + 1), 400);
        return;
      }
    }

    let value = trimmed;
    if (SELECT_OPTIONS[field]) {
      const matched = matchSelect(trimmed, SELECT_OPTIONS[field]);
      if (matched) { value = matched; }
      else {
        const retryMsg = language === 'hindi' ? 'कृपया सही विकल्प बताइए।' : 'Could not match. Please try again.';
        addChat('ai', retryMsg);
        speak(retryMsg, () => { startListening((t) => handleVoiceAnswer(t), handleSttError); });
        return;
      }
    }

    setForm(prev => setVal(prev, field, value));
    const confMsg = language === 'hindi' ? 'अच्छा!' : 'Got it!';
    addChat('ai', `${confMsg} ${FIELD_LABELS[field]}: ${value}`);
    setTimeout(() => askField(idx + 1), 600);
  }, [language, speak, startListening, askField, handleSttError]);

  const toggleVoice = () => {
    if (voiceActive) {
      cancelSpeech();
      setVoiceActive(false);
    } else {
      setVoiceActive(true);
      setChatMessages([]);
      let startIdx = 0;
      for (let i = 0; i < FIELD_ORDER.length; i++) {
        const val = getVal(form, FIELD_ORDER[i]);
        if (!val || (typeof val === 'string' && !val.trim())) { startIdx = i; break; }
      }
      const greeting = language === 'hindi'
        ? 'नमस्ते! मैं आपका प्रोफ़ाइल भरने में मदद करूँगा। मेरे सवाल सुनें।'
        : "Hi! I'll help you fill your profile. Listen to my questions and answer.";
      addChat('ai', greeting);
      speak(greeting, () => setTimeout(() => askField(startIdx), 300));
    }
  };

  const analyser = getAnalyser();
  const filledRequired = DOCTOR_REQUIRED_FIELDS.filter(f => {
    const v = getVal(form, f); return v && (typeof v !== 'string' || v.trim());
  }).length;

  return (
    <div className="flex gap-5 h-[calc(100vh-280px)] min-h-[500px]">
      {/* ── LEFT: Voice Chat Panel ── */}
      <div className="w-80 shrink-0 flex flex-col bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className={`px-4 py-3 flex items-center justify-between shrink-0 ${voiceActive ? 'bg-gradient-to-r from-primary-500 to-primary-600' : 'bg-gray-50 border-b border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Sparkles size={15} className={voiceActive ? 'text-white' : 'text-primary-500'} />
            <span className={`font-heading font-bold text-sm ${voiceActive ? 'text-white' : 'text-dark'}`}>
              Voice Assistant
            </span>
            {isSpeaking && <Volume2 size={13} className="text-white/80 animate-pulse" />}
          </div>
          <button
            type="button"
            onClick={toggleVoice}
            className={`text-[10px] font-heading font-semibold px-2.5 py-1 rounded-full transition-all ${
              voiceActive ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
            }`}
          >
            {voiceActive ? 'Turn Off' : 'Turn On'}
          </button>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/50">
          {!voiceActive && chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <button
                type="button"
                onClick={toggleVoice}
                className="relative w-20 h-20 rounded-full flex items-center justify-center mb-3 transition-all hover:scale-110 active:scale-95 overflow-hidden group"
              >
                <img src={recordOrb} alt="" className="absolute inset-0 w-full h-full object-cover rounded-full group-hover:brightness-110" />
                <span className="relative z-10">
                  <Mic size={28} className="text-white drop-shadow-lg" strokeWidth={2.5} />
                </span>
              </button>
              <p className="text-xs text-gray-500 font-body font-semibold">Tap to start Voice Assistant</p>
              <p className="text-[10px] text-gray-400 font-body mt-1">AI will ask questions & fill your profile</p>
            </div>
          )}

          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[90%] rounded-2xl px-3 py-2 ${
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-br-md'
                  : 'bg-white border border-gray-200 text-dark rounded-bl-md shadow-sm'
              }`}>
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-1 mb-0.5">
                    <MessageCircle size={10} className="text-primary-500" />
                    <span className="text-[9px] font-heading font-semibold text-primary-500">SwasthyaMitra</span>
                  </div>
                )}
                <p className="text-xs font-body leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}

          {/* Listening indicator */}
          {isListening && (
            <div className="flex justify-end animate-fade-in">
              <div className="rounded-2xl px-3 py-2 bg-red-50 border border-red-200 rounded-br-md">
                {analyser && <WaveformVisualizer analyser={analyser} barCount={16} />}
                <p className="text-[10px] text-red-500 font-heading font-semibold text-center mt-0.5">Listening...</p>
              </div>
            </div>
          )}

          {isTranscribing && (
            <div className="flex justify-end animate-fade-in">
              <div className="rounded-2xl px-3 py-2 bg-amber-50 border border-amber-200 rounded-br-md">
                <p className="text-xs font-body flex items-center gap-1.5 text-amber-600">
                  <Loader2 size={12} className="animate-spin" /> Transcribing...
                </p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Mic button + progress at bottom */}
        {voiceActive && (
          <div className="px-3 py-3 border-t border-gray-200 bg-white shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isListening) stopListening();
                  else if (!isSpeaking && !isTranscribing) {
                    cancelSpeech();
                    startListening((t) => handleVoiceAnswer(t), handleSttError);
                  }
                }}
                disabled={isSpeaking || isTranscribing}
                className="relative w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-all overflow-hidden disabled:opacity-40"
              >
                <img src={recordOrb} alt="" className={`absolute inset-0 w-full h-full object-cover rounded-full ${isListening ? 'animate-pulse' : ''}`} />
                <span className="relative z-10">
                  {isTranscribing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : isListening ? (
                    <Square size={14} className="text-white drop-shadow-md" fill="white" />
                  ) : (
                    <Mic size={16} className="text-white drop-shadow-md" />
                  )}
                </span>
              </button>
              <div className="flex-1">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                    style={{ width: `${(voiceFieldIdx / FIELD_ORDER.length) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 font-heading mt-0.5 block">
                  {voiceFieldIdx + 1} / {FIELD_ORDER.length} fields
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Form Fields ── */}
      <div ref={formRef} className="flex-1 overflow-y-auto space-y-5 pr-1">
        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
              <User size={14} className="text-primary-500" />
            </div>
            <h3 className="font-heading font-bold text-dark text-sm">Personal Information</h3>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <VoiceFormField label="Full Name" name="fullName" value={getVal(form, 'fullName')} onChange={handleChange} required placeholder="Dr. Full Name" error={errors.fullName} />
            <VoiceFormField label="Phone Number" name="phone" type="tel" value={phone} onChange={() => {}} readOnly />
            <VoiceFormField label="Email" name="email" type="email" value={getVal(form, 'email')} onChange={handleChange} required placeholder="doctor@hospital.com" error={errors.email} />
          </div>
        </div>

        {/* Medical Registration */}
        <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <GraduationCap size={14} className="text-india-green" />
            </div>
            <h3 className="font-heading font-bold text-dark text-sm">Medical Registration</h3>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <VoiceFormField label="Registration Number" name="medicalRegNumber" value={getVal(form, 'medicalRegNumber')} onChange={handleChange} required placeholder="e.g., MCI-12345" error={errors.medicalRegNumber} />
            <VoiceFormField label="Registration Council" name="registrationCouncil" type="select" options={REGISTRATION_COUNCILS} value={getVal(form, 'registrationCouncil')} onChange={handleChange} required placeholder="Select council" error={errors.registrationCouncil} />
            <VoiceFormField label="Specialization" name="specialization" type="select" options={SPECIALIZATIONS} value={getVal(form, 'specialization')} onChange={handleChange} required placeholder="Select specialization" error={errors.specialization} />
            <VoiceFormField label="Qualification" name="qualification" type="select" options={QUALIFICATIONS} value={getVal(form, 'qualification')} onChange={handleChange} required placeholder="Select qualification" error={errors.qualification} />
          </div>
        </div>

        {/* Clinic / Hospital */}
        <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Building2 size={14} className="text-green-500" />
            </div>
            <h3 className="font-heading font-bold text-dark text-sm">Clinic / Hospital</h3>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <VoiceFormField label="Clinic / Hospital Name" name="clinicHospitalName" value={getVal(form, 'clinicHospitalName')} onChange={handleChange} required placeholder="e.g., City Hospital" error={errors.clinicHospitalName} />
            </div>
            <VoiceFormField label="District" name="clinicAddress.district" value={getVal(form, 'clinicAddress.district')} onChange={handleChange} required placeholder="Enter district" error={errors['clinicAddress.district']} />
            <VoiceFormField label="State" name="clinicAddress.state" type="select" options={INDIAN_STATES} value={getVal(form, 'clinicAddress.state')} onChange={handleChange} required placeholder="Select state" error={errors['clinicAddress.state']} />
            <VoiceFormField label="PIN Code" name="clinicAddress.pin" type="tel" value={getVal(form, 'clinicAddress.pin')} onChange={handleChange} required placeholder="6-digit PIN" error={errors['clinicAddress.pin']} />
          </div>
        </div>

        {/* Additional Info */}
        <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
              <Briefcase size={14} className="text-amber-500" />
            </div>
            <h3 className="font-heading font-bold text-dark text-sm">Additional Info</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-warm-gray font-heading font-medium ml-auto">Optional</span>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            <VoiceFormField label="Years of Experience" name="yearsOfExperience" type="tel" value={getVal(form, 'yearsOfExperience')} onChange={handleChange} placeholder="e.g., 12" />
            <VoiceFormField label="Consultation Fee" name="consultationFee" type="tel" value={getVal(form, 'consultationFee')} onChange={handleChange} placeholder="e.g., 500" />
            <VoiceFormField label="Languages Spoken" name="availableLanguages" value={getVal(form, 'availableLanguages')} onChange={handleChange} placeholder="e.g., Hindi, English" />
            <VoiceFormField label="Working Hours" name="workingHours" value={getVal(form, 'workingHours')} onChange={handleChange} placeholder="e.g., Mon-Sat 9AM-5PM" />
          </div>
        </div>

        {/* Required counter + Submit */}
        <div className="flex items-center justify-between px-1">
          <p className="font-body text-xs text-warm-gray">
            <span className="font-heading font-semibold text-india-green">{filledRequired}</span> / {DOCTOR_REQUIRED_FIELDS.length} required
          </p>
          {filledRequired === DOCTOR_REQUIRED_FIELDS.length && (
            <span className="flex items-center gap-1 text-xs text-india-green font-heading font-semibold">
              <CheckCircle size={13} /> Ready to save
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3.5 rounded-xl font-heading font-bold text-sm hover:from-primary-600 hover:to-primary-700 active:scale-[0.99] transition-all shadow-lg shadow-primary-500/20"
        >
          {mode === 'setup' ? 'Complete Profile & Continue' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
