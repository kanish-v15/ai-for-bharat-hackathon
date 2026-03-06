import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Send, CheckCircle, ChevronDown, ChevronUp, Edit3, MessageCircle, Volume2, VolumeX, Square } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { LANGUAGES } from '../../utils/constants';
import recordOrb from '../../../icons/image 96.png';
import {
  BLOOD_GROUPS, GENDERS, INDIAN_STATES,
  PATIENT_REQUIRED_FIELDS, validateField,
} from '../../utils/profileHelpers';

/* ── Multilingual questions for 9 languages ── */
const QUESTIONS = [
  {
    field: 'fullName', type: 'text', placeholder: 'e.g., Ramesh Kumar',
    questions: {
      english: "What is your full name?",
      hindi: "आपका पूरा नाम क्या है?",
      tamil: "உங்கள் முழுப்பெயர் என்ன?",
      telugu: "మీ పూర్తి పేరు ఏమిటి?",
      kannada: "ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ಏನು?",
      malayalam: "നിങ്ങളുടെ മുഴുവൻ പേര് എന്താണ്?",
      bengali: "আপনার পুরো নাম কী?",
      marathi: "तुमचं पूर्ण नाव काय आहे?",
      gujarati: "તમારું પૂરું નામ શું છે?",
    },
  },
  {
    field: 'dateOfBirth', type: 'date', placeholder: 'DD/MM/YYYY',
    questions: {
      english: "What is your date of birth?",
      hindi: "आपकी जन्म तिथि क्या है?",
      tamil: "உங்கள் பிறந்த தேதி என்ன?",
      telugu: "మీ పుట్టిన తేదీ ఏమిటి?",
      kannada: "ನಿಮ್ಮ ಹುಟ್ಟಿದ ದಿನಾಂಕ ಏನು?",
      malayalam: "നിങ്ങളുടെ ജനന തീയതി എന്താണ്?",
      bengali: "আপনার জন্ম তারিখ কী?",
      marathi: "तुमची जन्म तारीख काय आहे?",
      gujarati: "તમારી જન્મ તારીખ શું છે?",
    },
  },
  {
    field: 'gender', type: 'select', options: GENDERS, placeholder: 'Male / Female / Other',
    questions: {
      english: "What is your gender?",
      hindi: "आपका लिंग क्या है?",
      tamil: "உங்கள் பாலினம் என்ன?",
      telugu: "మీ లింగం ఏమిటి?",
      kannada: "ನಿಮ್ಮ ಲಿಂಗ ಏನು?",
      malayalam: "നിങ്ങളുടെ ലിംഗഭേദം എന്താണ്?",
      bengali: "আপনার লিঙ্গ কী?",
      marathi: "तुमचं लिंग काय आहे?",
      gujarati: "તમારું લિંગ શું છે?",
    },
  },
  {
    field: 'email', type: 'text', optional: true, placeholder: 'email@example.com',
    questions: {
      english: "What is your email address? Say skip to skip.",
      hindi: "आपका ईमेल पता क्या है? स्किप कहें अगर नहीं है।",
      tamil: "உங்கள் மின்னஞ்சல் என்ன? skip சொல்லுங்கள்.",
      telugu: "మీ ఈమెయిల్ ఏమిటి? skip అనండి.",
      kannada: "ನಿಮ್ಮ ಇಮೇಲ್ ಏನು? skip ಹೇಳಿ.",
      malayalam: "നിങ്ങളുടെ ഇമെയിൽ എന്താണ്? skip പറയൂ.",
      bengali: "আপনার ইমেইল কী? skip বলুন।",
      marathi: "तुमचा ईमेल काय आहे? skip म्हणा.",
      gujarati: "તમારો ઈમેલ શું છે? skip કહો.",
    },
  },
  {
    field: 'address.district', type: 'text', placeholder: 'e.g., Chennai, Patna',
    questions: {
      english: "Which district do you live in?",
      hindi: "आप किस जिले में रहते हैं?",
      tamil: "நீங்கள் எந்த மாவட்டத்தில் வசிக்கிறீர்கள்?",
      telugu: "మీరు ఏ జిల్లాలో నివసిస్తున్నారు?",
      kannada: "ನೀವು ಯಾವ ಜಿಲ್ಲೆಯಲ್ಲಿ ವಾಸಿಸುತ್ತೀರಿ?",
      malayalam: "നിങ്ങൾ ഏത് ജില്ലയിലാണ് താമസിക്കുന്നത്?",
      bengali: "আপনি কোন জেলায় থাকেন?",
      marathi: "तुम्ही कोणत्या जिल्ह्यात राहता?",
      gujarati: "તમે કયા જિલ્લામાં રહો છો?",
    },
  },
  {
    field: 'address.state', type: 'select', options: INDIAN_STATES, placeholder: 'e.g., Tamil Nadu',
    questions: {
      english: "Which state?",
      hindi: "कौन सा राज्य?",
      tamil: "எந்த மாநிலம்?",
      telugu: "ఏ రాష్ట్రం?",
      kannada: "ಯಾವ ರಾಜ್ಯ?",
      malayalam: "ഏത് സംസ്ഥാനം?",
      bengali: "কোন রাজ্য?",
      marathi: "कोणतं राज्य?",
      gujarati: "કયું રાજ્ય?",
    },
  },
  {
    field: 'address.pin', type: 'text', placeholder: '6-digit PIN code',
    questions: {
      english: "What is your PIN code?",
      hindi: "आपका पिन कोड क्या है?",
      tamil: "உங்கள் பின் கோட் என்ன?",
      telugu: "మీ పిన్ కోడ్ ఏమిటి?",
      kannada: "ನಿಮ್ಮ ಪಿನ್ ಕೋಡ್ ಏನು?",
      malayalam: "നിങ്ങളുടെ പിൻ കോഡ് എന്താണ്?",
      bengali: "আপনার পিন কোড কী?",
      marathi: "तुमचा पिन कोड काय आहे?",
      gujarati: "તમારો પિન કોડ શું છે?",
    },
  },
  {
    field: 'bloodGroup', type: 'select', options: BLOOD_GROUPS, optional: true, placeholder: 'e.g., B+, O-',
    questions: {
      english: "What is your blood group? Say skip if unsure.",
      hindi: "आपका ब्लड ग्रुप क्या है? नहीं पता तो स्किप कहें।",
      tamil: "உங்கள் இரத்த வகை என்ன? தெரியாவிட்டால் skip சொல்லுங்கள்.",
      telugu: "మీ రక్తం గ్రూప్ ఏమిటి? తెలియకపోతే skip అనండి.",
      kannada: "ನಿಮ್ಮ ರಕ್ತ ಗುಂಪು ಏನು? ಗೊತ್ತಿಲ್ಲವಾದರೆ skip ಹೇಳಿ.",
      malayalam: "നിങ്ങളുടെ രക്തഗ്രൂപ്പ് എന്താണ്? അറിയില്ലെങ്കിൽ skip പറയൂ.",
      bengali: "আপনার রক্তের গ্রুপ কী? না জানলে skip বলুন।",
      marathi: "तुमचा रक्तगट काय आहे? माहीत नसेल तर skip म्हणा.",
      gujarati: "તમારું બ્લડ ગ્રૂપ શું છે? ખબર ન હોય તો skip કહો.",
    },
  },
  {
    field: 'emergencyContactName', type: 'text', placeholder: 'e.g., Priya Kumar',
    questions: {
      english: "Who is your emergency contact? Tell me their name.",
      hindi: "आपका आपातकालीन संपर्क कौन है? उनका नाम बताइए।",
      tamil: "உங்கள் அவசர தொடர்பு யார்? பெயர் சொல்லுங்கள்.",
      telugu: "మీ ఎమర్జెన్సీ కాంటాక్ట్ ఎవరు? పేరు చెప్పండి.",
      kannada: "ನಿಮ್ಮ ತುರ್ತು ಸಂಪರ್ಕ ಯಾರು? ಹೆಸರು ಹೇಳಿ.",
      malayalam: "നിങ്ങളുടെ എമർജൻസി കോൺടാക്ട് ആരാണ്? പേര് പറയൂ.",
      bengali: "আপনার জরুরি যোগাযোগ কে? নাম বলুন।",
      marathi: "तुमचा आणीबाणी संपर्क कोण आहे? नाव सांगा.",
      gujarati: "તમારો ઈમરજન્સી કોન્ટેક્ટ કોણ છે? નામ જણાવો.",
    },
  },
  {
    field: 'emergencyContactPhone', type: 'text', placeholder: '10-digit number',
    questions: {
      english: "What is their phone number?",
      hindi: "उनका फोन नंबर क्या है?",
      tamil: "அவர்களின் தொலைபேசி எண் என்ன?",
      telugu: "వారి ఫోన్ నంబర్ ఏమిటి?",
      kannada: "ಅವರ ಫೋನ್ ನಂಬರ್ ಏನು?",
      malayalam: "അവരുടെ ഫോൺ നമ്പർ എന്താണ്?",
      bengali: "তাদের ফোন নম্বর কী?",
      marathi: "त्यांचा फोन नंबर काय आहे?",
      gujarati: "તેમનો ફોન નંબર શું છે?",
    },
  },
  {
    field: 'knownAllergies', type: 'text', optional: true, placeholder: 'e.g., Penicillin, Peanuts',
    questions: {
      english: "Do you have any known allergies? Say none or skip if no.",
      hindi: "क्या आपको कोई एलर्जी है? नहीं या स्किप कहें।",
      tamil: "உங்களுக்கு ஏதாவது ஒவ்வாமை உள்ளதா? இல்லை என்றால் skip சொல்லுங்கள்.",
      telugu: "మీకు ఏదైనా అలర్జీలు ఉన్నాయా? లేకపోతే skip అనండి.",
      kannada: "ನಿಮಗೆ ಯಾವುದೇ ಅಲರ್ಜಿ ಇದೆಯೇ? ಇಲ್ಲವಾದರೆ skip ಹೇಳಿ.",
      malayalam: "നിങ്ങൾക്ക് എന്തെങ്കിലും അലർജി ഉണ്ടോ? ഇല്ലെങ്കിൽ skip പറയൂ.",
      bengali: "আপনার কোনো অ্যালার্জি আছে? না থাকলে skip বলুন।",
      marathi: "तुम्हाला काही एलर्जी आहे का? नसेल तर skip म्हणा.",
      gujarati: "તમને કોઈ એલર્જી છે? ન હોય તો skip કહો.",
    },
  },
  {
    field: 'chronicConditions', type: 'text', optional: true, placeholder: 'e.g., Diabetes, Hypertension',
    questions: {
      english: "Do you have any chronic conditions like diabetes or BP? Say none or skip if no.",
      hindi: "क्या आपको कोई पुरानी बीमारी है? नहीं या स्किप कहें।",
      tamil: "உங்களுக்கு நீரிழிவு போன்ற நாள்பட்ட நோய் உள்ளதா? இல்லை என்றால் skip.",
      telugu: "మీకు షుగర్ లాంటి దీర్ఘకాలిక వ్యాధులు ఉన్నాయా? లేకపోతే skip.",
      kannada: "ನಿಮಗೆ ಮಧುಮೇಹದಂತಹ ದೀರ್ಘಕಾಲಿಕ ಕಾಯಿಲೆ ಇದೆಯೇ? ಇಲ್ಲವಾದರೆ skip.",
      malayalam: "നിങ്ങൾക്ക് പ്രമേഹം പോലുള്ള ദീർഘകാല രോഗങ്ങൾ ഉണ്ടോ? ഇല്ലെങ്കിൽ skip.",
      bengali: "আপনার ডায়াবেটিস জাতীয় কোনো দীর্ঘস্থায়ী রোগ আছে? না থাকলে skip।",
      marathi: "तुम्हाला मधुमेह सारखा कोणता जुनात आजार आहे का? नसेल तर skip.",
      gujarati: "તમને ડાયાબિટીસ જેવી કોઈ લાંબી બીમારી છે? ન હોય તો skip.",
    },
  },
  {
    field: 'currentMedications', type: 'text', optional: true, placeholder: 'e.g., Metformin 500mg',
    questions: {
      english: "Are you taking any medications currently? Say none or skip.",
      hindi: "क्या आप कोई दवाई ले रहे हैं? नहीं या स्किप कहें।",
      tamil: "தற்போது ஏதாவது மருந்து எடுத்துக்கொள்கிறீர்களா? இல்லை என்றால் skip.",
      telugu: "ప్రస్తుతం ఏదైనా మందులు తీసుకుంటున్నారా? లేకపోతే skip.",
      kannada: "ಪ್ರಸ್ತುತ ಯಾವುದೇ ಔಷಧ ತೆಗೆದುಕೊಳ್ಳುತ್ತಿದ್ದೀರಾ? ಇಲ್ಲವಾದರೆ skip.",
      malayalam: "ഇപ്പോൾ എന്തെങ്കിലും മരുന്ന് കഴിക്കുന്നുണ്ടോ? ഇല്ലെങ്കിൽ skip.",
      bengali: "বর্তমানে কোনো ওষুধ খাচ্ছেন? না খেলে skip বলুন।",
      marathi: "सध्या कोणती औषधे घेत आहात? नसेल तर skip म्हणा.",
      gujarati: "હાલમાં કોઈ દવા લો છો? ન લેતા હોય તો skip કહો.",
    },
  },
];

/* ── Multilingual UI strings ── */
const GREETINGS = {
  english: "Hi! I'll help you set up your profile. Just answer my questions — I'll speak them aloud and listen to your answers.",
  hindi: "नमस्ते! मैं आपका प्रोफ़ाइल बनाने में मदद करूँगा। मेरे सवाल सुनें और जवाब दें।",
  tamil: "வணக்கம்! நான் உங்கள் சுயவிவரம் அமைக்க உதவுவேன். கேள்விகளை கேளுங்கள், பதில் சொல்லுங்கள்.",
  telugu: "నమస్కారం! నేను మీ ప్రొఫైల్ సెటప్ చేయడంలో సహాయం చేస్తాను. ప్రశ్నలు వినండి, జవాబు చెప్పండి.",
  kannada: "ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಸೆಟಪ್ ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತೇನೆ. ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ, ಉತ್ತರಿಸಿ.",
  malayalam: "നമസ്കാരം! നിങ്ങളുടെ പ്രൊഫൈൽ സെറ്റപ്പ് ചെയ്യാൻ ഞാൻ സഹായിക്കാം. ചോദ്യങ്ങൾ കേൾക്കൂ, ഉത്തരം പറയൂ.",
  bengali: "নমস্কার! আমি আপনার প্রোফাইল সেটআপ করতে সাহায্য করব। প্রশ্ন শুনুন, উত্তর দিন।",
  marathi: "नमस्कार! मी तुमचं प्रोफाइल सेटअप करायला मदत करेन. प्रश्न ऐका, उत्तर द्या.",
  gujarati: "નમસ્તે! હું તમારી પ્રોફાઈલ સેટ કરવામાં મદદ કરીશ. પ્રશ્નો સાંભળો, જવાબ આપો.",
};

const DONE_MESSAGES = {
  english: "Great! Your profile is ready. Please click Save below.",
  hindi: "बहुत अच्छा! आपका प्रोफ़ाइल तैयार है। नीचे सेव बटन दबाएं।",
  tamil: "அருமை! உங்கள் சுயவிவரம் தயார். கீழே Save அழுத்துங்கள்.",
  telugu: "బాగుంది! మీ ప్రొఫైల్ సిద్ధంగా ఉంది. Save నొక్కండి.",
  kannada: "ಅದ್ಭುತ! ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಸಿದ್ಧವಾಗಿದೆ. Save ಒತ್ತಿ.",
  malayalam: "കൊള്ളാം! നിങ്ങളുടെ പ്രൊഫൈൽ തയ്യാറാണ്. Save അമർത്തുക.",
  bengali: "চমৎকার! আপনার প্রোফাইল তৈরি। Save টিপুন।",
  marathi: "छान! तुमचं प्रोफाइल तयार आहे. Save दाबा.",
  gujarati: "શાબાશ! તમારી પ્રોફાઈલ તૈયાર છે. Save દબાવો.",
};

const CONFIRMATIONS = {
  english: ['Got it!', 'Noted.', 'Perfect!', 'Okay!'],
  hindi: ['अच्छा!', 'ठीक है।', 'बहुत बढ़िया!', 'नोट कर लिया।'],
  tamil: ['சரி!', 'குறிப்பிட்டேன்.', 'நல்லது!', 'ஓகே!'],
  telugu: ['బాగుంది!', 'నోట్ చేశాను.', 'సరే!', 'ఓకే!'],
  kannada: ['ಆಯ್ತು!', 'ನೋಟ್ ಮಾಡಿದೆ.', 'ಚೆನ್ನಾಗಿದೆ!', 'ಓಕೆ!'],
  malayalam: ['ശരി!', 'കുറിച്ചു.', 'കൊള്ളാം!', 'ഓക്കേ!'],
  bengali: ['বুঝেছি!', 'নোট করলাম।', 'দারুণ!', 'ঠিক আছে!'],
  marathi: ['ठीक!', 'नोंद केलं.', 'छान!', 'ओके!'],
  gujarati: ['સારું!', 'નોંધ કર્યું.', 'બરાબર!', 'ઓકે!'],
};

const SKIP_MSG = {
  english: 'Okay, moving on.',
  hindi: 'ठीक है, आगे बढ़ते हैं।',
  tamil: 'சரி, அடுத்தது.',
  telugu: 'సరే, ముందుకు.',
  kannada: 'ಸರಿ, ಮುಂದಕ್ಕೆ.',
  malayalam: 'ശരി, അടുത്തത്.',
  bengali: 'ঠিক আছে, পরেরটা।',
  marathi: 'ठीक, पुढे जाऊ.',
  gujarati: 'ઠીક, આગળ.',
};

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

function getQuestionText(q, lang) {
  return q.questions[lang] || q.questions.english;
}

export default function PatientProfileForm({ initialData = {}, onSave, mode = 'setup', phone = '' }) {
  const { language } = useLanguage();
  const [form, setForm] = useState({ ...initialData });
  const [currentQ, setCurrentQ] = useState(0);
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true);
  const [lastFilledField, setLastFilledField] = useState(null);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [done, setDone] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const inputRef = useRef(null);
  const initRef = useRef(false);
  const utteranceRef = useRef(null);

  const langConfig = LANGUAGES[language];
  const speechCode = langConfig?.speechCode || 'en-IN';

  /* ── Speech Synthesis (TTS) ── */
  const cancelSpeech = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback((text, onEnd) => {
    if (!voiceMode || !window.speechSynthesis) {
      onEnd?.();
      return;
    }
    cancelSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speechCode;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utteranceRef.current = utterance;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      // Small delay before auto-starting mic
      if (onEnd) setTimeout(onEnd, 400);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      onEnd?.();
    };

    window.speechSynthesis.speak(utterance);
  }, [voiceMode, speechCode, cancelSpeech]);

  /* ── Speech Recognition (STT) ── */
  const startListening = useCallback(() => {
    cancelSpeech(); // Stop TTS before starting mic

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
  }, [speechCode, cancelSpeech]);

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    if (liveTranscript.trim()) {
      handleAnswer(liveTranscript);
      setLiveTranscript('');
    }
  };

  /* ── Question flow ── */
  const askQuestion = useCallback((idx) => {
    if (idx >= QUESTIONS.length) {
      setDone(true);
      const doneMsg = DONE_MESSAGES[language] || DONE_MESSAGES.english;
      setMessages(prev => [...prev, { role: 'ai', text: doneMsg, isSpeaking: true }]);
      speakText(doneMsg);
      return;
    }
    const q = QUESTIONS[idx];
    const text = getQuestionText(q, language);
    setMessages(prev => [...prev, { role: 'ai', text, field: q.field, isSpeaking: true }]);
    setCurrentQ(idx);

    // Speak the question, then auto-start mic
    speakText(text, () => {
      if (voiceMode) startListening();
    });
  }, [language, speakText, startListening, voiceMode]);

  // Start with greeting
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const greeting = GREETINGS[language] || GREETINGS.english;
    setMessages([{ role: 'ai', text: greeting, isSpeaking: true }]);

    // Speak greeting, then ask first question
    speakText(greeting, () => {
      setTimeout(() => askQuestion(0), 300);
    });
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveTranscript]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelSpeech();
      if (recognitionRef.current) try { recognitionRef.current.abort(); } catch {}
    };
  }, [cancelSpeech]);

  const handleAnswer = (answer) => {
    const q = QUESTIONS[currentQ];
    const trimmed = answer.trim();

    // Skip handling
    if (/^(skip|none|no|nahi|nahi hai|kuch nahi|स्किप|नहीं|कोई नहीं|இல்லை|లేదు|ಇಲ್ಲ|ഇല്ല|না|नाही|ના)$/i.test(trimmed)) {
      if (q.optional) {
        const skipMsg = SKIP_MSG[language] || SKIP_MSG.english;
        setMessages(prev => [...prev, { role: 'user', text: trimmed }, { role: 'ai', text: skipMsg }]);
        speakText(skipMsg, () => {
          setTimeout(() => askQuestion(currentQ + 1), 300);
        });
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
        const retryMsg = language === 'hindi'
          ? `कृपया इनमें से चुनें: ${q.options.join(', ')}`
          : `Please choose from: ${q.options.join(', ')}`;
        setMessages(prev => [...prev,
          { role: 'user', text: trimmed },
          { role: 'ai', text: retryMsg }
        ]);
        speakText(retryMsg, () => {
          if (voiceMode) startListening();
        });
        return;
      }
    }

    // Validate required fields
    if (PATIENT_REQUIRED_FIELDS.includes(q.field) && !q.optional) {
      const result = validateField(q.field, value);
      if (!result.valid) {
        const errorMsg = language === 'hindi'
          ? `कृपया सही जानकारी दें। ${result.error}`
          : `Please provide valid info. ${result.error}`;
        setMessages(prev => [...prev,
          { role: 'user', text: trimmed },
          { role: 'ai', text: errorMsg }
        ]);
        speakText(errorMsg, () => {
          if (voiceMode) startListening();
        });
        return;
      }
    }

    // Save value
    setForm(prev => setVal(prev, q.field, value));
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);

    // Highlight the field
    setLastFilledField(q.field);
    setTimeout(() => setLastFilledField(null), 2500);

    // Confirmation + next question
    const confs = CONFIRMATIONS[language] || CONFIRMATIONS.english;
    const conf = confs[Math.floor(Math.random() * confs.length)];

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: conf }]);
      speakText(conf, () => {
        setTimeout(() => askQuestion(currentQ + 1), 300);
      });
    }, 200);
  };

  const handleTextSubmit = (e) => {
    e?.preventDefault();
    if (!textInput.trim()) return;
    cancelSpeech(); // Stop any TTS
    handleAnswer(textInput);
    setTextInput('');
  };

  const handleSubmit = () => {
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
      {/* Progress bar + voice toggle */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
            style={{ width: `${(filledCount / QUESTIONS.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-heading font-semibold text-warm-gray">{filledCount}/{QUESTIONS.length}</span>

        {/* Voice mode toggle */}
        <button
          onClick={() => {
            if (voiceMode) cancelSpeech();
            setVoiceMode(!voiceMode);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-heading font-semibold transition-all ${
            voiceMode
              ? 'bg-primary-50 text-primary-600 border border-primary-200'
              : 'bg-gray-100 text-gray-500 border border-gray-200'
          }`}
          title={voiceMode ? 'Voice mode ON' : 'Voice mode OFF'}
        >
          {voiceMode ? <Volume2 size={13} /> : <VolumeX size={13} />}
          {voiceMode ? 'Voice' : 'Silent'}
        </button>

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
              const isHighlighted = lastFilledField === q.field;
              return v ? (
                <div key={q.field} className={`flex items-start gap-1.5 rounded-lg px-2 py-1 transition-all duration-500 ${
                  isHighlighted ? 'bg-primary-50 ring-1 ring-primary-200' : ''
                }`}>
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
        {messages.map((msg, i) => {
          const isLatestAi = msg.role === 'ai' && i === messages.length - 1;
          return (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                msg.role === 'user'
                  ? 'bg-primary-500 text-white rounded-br-md'
                  : 'bg-white border border-gray-200 text-dark rounded-bl-md shadow-sm'
              }`}>
                {msg.role === 'ai' && (
                  <div className="flex items-center gap-1.5 mb-1">
                    {isSpeaking && isLatestAi ? (
                      <Volume2 size={12} className="text-primary-500 animate-pulse" />
                    ) : (
                      <MessageCircle size={12} className="text-primary-500" />
                    )}
                    <span className="text-[10px] font-heading font-semibold text-primary-500">
                      SwasthyaMitra {isSpeaking && isLatestAi ? '- Speaking...' : ''}
                    </span>
                  </div>
                )}
                <p className="text-sm font-body leading-relaxed">{msg.text}</p>
              </div>
            </div>
          );
        })}

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
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>
                {language === 'hindi' ? 'सुन रहा हूँ...' : language === 'tamil' ? 'கேட்கிறேன்...' : 'Listening...'}
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
            onClick={() => {
              if (isListening) stopListening();
              else {
                cancelSpeech();
                startListening();
              }
            }}
            disabled={isSpeaking}
            className={`relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all overflow-hidden ${
              isListening ? 'scale-110' : isSpeaking ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'
            }`}
          >
            <img src={recordOrb} alt="" className={`absolute inset-0 w-full h-full object-cover rounded-full ${isListening ? 'animate-pulse' : ''}`} />
            <span className="relative z-10">
              {isListening ? <Square size={18} className="text-white drop-shadow-md" fill="white" /> : <Mic size={18} className="text-white drop-shadow-md" strokeWidth={2.5} />}
            </span>
          </button>

          {/* Text input */}
          <form onSubmit={handleTextSubmit} className="flex-1 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onFocus={cancelSpeech}
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
