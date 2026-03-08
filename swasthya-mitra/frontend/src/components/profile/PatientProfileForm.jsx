import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, Send, CheckCircle, ChevronDown, ChevronUp, MessageCircle, Volume2, VolumeX, Square, Loader2 } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useBackendVoice } from '../../hooks/useBackendVoice';
import WaveformVisualizer from './WaveformVisualizer';
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

/* ── Voice-to-value parsing ── */

const NUMBER_WORDS_EN = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
  sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
  hundred: 100,
};

const NUMBER_WORDS_HI = {
  'शून्य': 0, 'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5, 'पाँच': 5,
  'छह': 6, 'छः': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'ग्यारह': 11, 'बारह': 12, 'तेरह': 13, 'चौदह': 14, 'पंद्रह': 15,
  'सोलह': 16, 'सत्रह': 17, 'अठारह': 18, 'उन्नीस': 19, 'बीस': 20,
  'इक्कीस': 21, 'बाईस': 22, 'तेईस': 23, 'चौबीस': 24, 'पच्चीस': 25,
  'छब्बीस': 26, 'सत्ताईस': 27, 'अट्ठाईस': 28, 'उनतीस': 29, 'तीस': 30,
  'इकतीस': 31,
};

const MONTH_NAMES_EN = {
  january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3,
  april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7,
  august: 8, aug: 8, september: 9, sep: 9, sept: 9, october: 10, oct: 10,
  november: 11, nov: 11, december: 12, dec: 12,
};

const MONTH_NAMES_HI = {
  'जनवरी': 1, 'फरवरी': 2, 'मार्च': 3, 'अप्रैल': 4, 'मई': 5, 'जून': 6,
  'जुलाई': 7, 'अगस्त': 8, 'सितंबर': 9, 'सितम्बर': 9, 'अक्टूबर': 10,
  'अक्तूबर': 10, 'नवंबर': 11, 'नवम्बर': 11, 'दिसंबर': 12, 'दिसम्बर': 12,
};

const MONTH_NAMES_TA = {
  'ஜனவரி': 1, 'பிப்ரவரி': 2, 'மார்ச்': 3, 'ஏப்ரல்': 4, 'மே': 5, 'ஜூன்': 6,
  'ஜூலை': 7, 'ஆகஸ்ட்': 8, 'செப்டம்பர்': 9, 'அக்டோபர்': 10, 'நவம்பர்': 11, 'டிசம்பர்': 12,
};

const MONTH_NAMES_TE = {
  'జనవరి': 1, 'ఫిబ్రవరి': 2, 'మార్చి': 3, 'ఏప్రిల్': 4, 'మే': 5, 'జూన్': 6,
  'జులై': 7, 'ఆగస్టు': 8, 'సెప్టెంబర్': 9, 'అక్టోబర్': 10, 'నవంబర్': 11, 'డిసెంబర్': 12,
};

const ALL_MONTHS = { ...MONTH_NAMES_EN, ...MONTH_NAMES_HI, ...MONTH_NAMES_TA, ...MONTH_NAMES_TE };

// Digit words in all supported languages
const DIGIT_WORDS = {
  // English
  zero: '0', one: '1', two: '2', three: '3', four: '4',
  five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  // Hindi
  'शून्य': '0', 'एक': '1', 'दो': '2', 'तीन': '3', 'चार': '4',
  'पांच': '5', 'पाँच': '5', 'छह': '6', 'छः': '6', 'सात': '7', 'आठ': '8', 'नौ': '9',
  // Tamil
  'சுழி': '0', 'ஒன்று': '1', 'இரண்டு': '2', 'மூன்று': '3', 'நான்கு': '4',
  'ஐந்து': '5', 'ஆறு': '6', 'ஏழு': '7', 'எட்டு': '8', 'ஒன்பது': '9',
  // Telugu
  'సున్నా': '0', 'ఒకటి': '1', 'రెండు': '2', 'మూడు': '3', 'నాలుగు': '4',
  'ఐదు': '5', 'ఆరు': '6', 'ఏడు': '7', 'ఎనిమిది': '8', 'తొమ్మిది': '9',
  // Kannada
  'ಸೊನ್ನೆ': '0', 'ಒಂದು': '1', 'ಎರಡು': '2', 'ಮೂರು': '3', 'ನಾಲ್ಕು': '4',
  'ಐದು': '5', 'ಆರು': '6', 'ಏಳು': '7', 'ಎಂಟು': '8', 'ಒಂಬತ್ತು': '9',
  // Malayalam
  'പൂജ്യം': '0', 'ഒന്ന്': '1', 'രണ്ട്': '2', 'മൂന്ന്': '3', 'നാല്': '4',
  'അഞ്ച്': '5', 'ആറ്': '6', 'ഏഴ്': '7', 'എട്ട്': '8', 'ഒൻപത്': '9',
  // Bengali
  'শূন্য': '0', 'এক': '1', 'দুই': '2', 'তিন': '3', 'চার': '4',
  'পাঁচ': '5', 'ছয়': '6', 'সাত': '7', 'আট': '8', 'নয়': '9',
  // Marathi (unique words only; शून्य/एक/तीन/चार/सात/आठ overlap with Hindi)
  'दोन': '2', 'पाच': '5', 'सहा': '6', 'नऊ': '9',
  // Gujarati
  'શૂન્ય': '0', 'એક': '1', 'બે': '2', 'ત્રણ': '3', 'ચાર': '4',
  'પાંચ': '5', 'છ': '6', 'સાત': '7', 'આઠ': '8', 'નવ': '9',
};

// Gender mappings across 9 languages
const GENDER_MAP = {
  // English
  male: 'male', man: 'male', boy: 'male', gentleman: 'male',
  female: 'female', woman: 'female', girl: 'female', lady: 'female',
  other: 'other', others: 'other', 'non-binary': 'other', nonbinary: 'other',
  // Hindi
  'पुरुष': 'male', 'आदमी': 'male', 'लड़का': 'male', 'मर्द': 'male',
  'महिला': 'female', 'औरत': 'female', 'लड़की': 'female', 'स्त्री': 'female',
  'अन्य': 'other',
  // Tamil
  'ஆண்': 'male', 'ஆண': 'male', 'பெண்': 'female', 'பெண': 'female',
  'மற்றவை': 'other', 'பிற': 'other',
  // Telugu
  'పురుషుడు': 'male', 'మగ': 'male', 'స్త్రీ': 'female', 'ఆడ': 'female',
  'ఇతర': 'other',
  // Kannada
  'ಪುರುಷ': 'male', 'ಗಂಡು': 'male', 'ಮಹಿಳೆ': 'female', 'ಹೆಣ್ಣು': 'female',
  'ಇತರ': 'other',
  // Malayalam
  'പുരുഷൻ': 'male', 'ആൺ': 'male', 'സ്ത്രീ': 'female', 'പെൺ': 'female',
  'മറ്റുള്ളവ': 'other',
  // Bengali
  'পুরুষ': 'male', 'ছেলে': 'male', 'মহিলা': 'female', 'মেয়ে': 'female',
  'অন্যান্য': 'other',
  // Marathi (पुरुष/स्त्री already covered by Hindi above)
  'मुलगा': 'male', 'मुलगी': 'female',
  'इतर': 'other', 'बाई': 'female',
  // Gujarati
  'પુરુષ': 'male', 'છોકરો': 'male', 'સ્ત્રી': 'female', 'છોકરી': 'female',
  'અન્ય': 'other',
};

// Blood group spoken-to-value mappings
const BLOOD_GROUP_MAP = {
  'a positive': 'A+', 'a pos': 'A+', 'a plus': 'A+', 'a +': 'A+',
  'a negative': 'A-', 'a neg': 'A-', 'a minus': 'A-', 'a -': 'A-',
  'b positive': 'B+', 'b pos': 'B+', 'b plus': 'B+', 'b +': 'B+',
  'b negative': 'B-', 'b neg': 'B-', 'b minus': 'B-', 'b -': 'B-',
  'a b positive': 'AB+', 'ab positive': 'AB+', 'ab pos': 'AB+', 'ab plus': 'AB+', 'ab +': 'AB+',
  'a b negative': 'AB-', 'ab negative': 'AB-', 'ab neg': 'AB-', 'ab minus': 'AB-', 'ab -': 'AB-',
  'o positive': 'O+', 'o pos': 'O+', 'o plus': 'O+', 'o +': 'O+',
  'o negative': 'O-', 'o neg': 'O-', 'o minus': 'O-', 'o -': 'O-',
};

// State abbreviations and common misspellings
const STATE_ALIASES = {
  'ap': 'Andhra Pradesh', 'andhra': 'Andhra Pradesh', 'andhrapradesh': 'Andhra Pradesh',
  'arunachal': 'Arunachal Pradesh', 'arunachalpradesh': 'Arunachal Pradesh',
  'assam': 'Assam',
  'bihar': 'Bihar',
  'cg': 'Chhattisgarh', 'chhattisgarh': 'Chhattisgarh', 'chattisgarh': 'Chhattisgarh',
  'goa': 'Goa',
  'gj': 'Gujarat', 'gujarat': 'Gujarat', 'gujrat': 'Gujarat',
  'hr': 'Haryana', 'haryana': 'Haryana',
  'hp': 'Himachal Pradesh', 'himachal': 'Himachal Pradesh', 'himachalpradesh': 'Himachal Pradesh',
  'jk': 'Jammu & Kashmir', 'jammu': 'Jammu & Kashmir', 'kashmir': 'Jammu & Kashmir', 'jammuandkashmir': 'Jammu & Kashmir', 'jammukashmir': 'Jammu & Kashmir',
  'jh': 'Jharkhand', 'jharkhand': 'Jharkhand', 'jharkand': 'Jharkhand',
  'ka': 'Karnataka', 'karnataka': 'Karnataka', 'karnatak': 'Karnataka',
  'kl': 'Kerala', 'kerala': 'Kerala',
  'mp': 'Madhya Pradesh', 'madhyapradesh': 'Madhya Pradesh', 'madhya': 'Madhya Pradesh',
  'mh': 'Maharashtra', 'maharashtra': 'Maharashtra', 'maharastra': 'Maharashtra',
  'mn': 'Manipur', 'manipur': 'Manipur',
  'ml': 'Meghalaya', 'meghalaya': 'Meghalaya',
  'mz': 'Mizoram', 'mizoram': 'Mizoram',
  'nl': 'Nagaland', 'nagaland': 'Nagaland',
  'od': 'Odisha', 'odisha': 'Odisha', 'orissa': 'Odisha',
  'pb': 'Punjab', 'punjab': 'Punjab',
  'rj': 'Rajasthan', 'rajasthan': 'Rajasthan', 'rajsthan': 'Rajasthan',
  'sk': 'Sikkim', 'sikkim': 'Sikkim',
  'tn': 'Tamil Nadu', 'tamilnadu': 'Tamil Nadu', 'tamil': 'Tamil Nadu', 'tamilnad': 'Tamil Nadu',
  'ts': 'Telangana', 'telangana': 'Telangana', 'telengana': 'Telangana',
  'tr': 'Tripura', 'tripura': 'Tripura',
  'up': 'Uttar Pradesh', 'uttarpradesh': 'Uttar Pradesh', 'uttar': 'Uttar Pradesh',
  'uk': 'Uttarakhand', 'uttarakhand': 'Uttarakhand', 'uttrakhand': 'Uttarakhand', 'uttaranchal': 'Uttarakhand',
  'wb': 'West Bengal', 'westbengal': 'West Bengal', 'bengal': 'West Bengal',
  'dl': 'Delhi', 'delhi': 'Delhi', 'newdelhi': 'Delhi',
  'ga': 'Goa',
  'ch': 'Chandigarh', 'chandigarh': 'Chandigarh',
  'py': 'Puducherry', 'puducherry': 'Puducherry', 'pondicherry': 'Puducherry',
  'ladakh': 'Ladakh',
  'lakshadweep': 'Lakshadweep',
  'andaman': 'Andaman & Nicobar Islands', 'nicobar': 'Andaman & Nicobar Islands',
  'dadra': 'Dadra & Nagar Haveli and Daman & Diu', 'daman': 'Dadra & Nagar Haveli and Daman & Diu',
};

function parseSpokenNumber(text) {
  // Convert spoken digit words to actual digit characters
  const lower = text.toLowerCase().trim();
  const words = lower.split(/[\s,]+/);
  let result = '';
  for (const w of words) {
    if (DIGIT_WORDS[w] !== undefined) {
      result += DIGIT_WORDS[w];
    } else if (/^\d+$/.test(w)) {
      result += w;
    }
    // skip non-digit, non-number words
  }
  return result;
}

function parseSpokenYear(text) {
  const t = text.toLowerCase().trim();
  // "nineteen ninety" = 1990, "two thousand five" = 2005, etc.
  const words = t.split(/[\s]+/);
  let num = 0;
  let current = 0;
  for (const w of words) {
    if (NUMBER_WORDS_EN[w] !== undefined) {
      const val = NUMBER_WORDS_EN[w];
      if (w === 'hundred') {
        current = (current || 1) * 100;
      } else if (val >= 20) {
        current += val;
      } else {
        current += val;
      }
    } else if (w === 'thousand') {
      current = (current || 1) * 1000;
      num += current;
      current = 0;
    }
  }
  num += current;
  return num > 0 ? num : null;
}

function parseDateFromText(text) {
  const t = text.trim();

  // Already in DD/MM/YYYY or DD-MM-YYYY
  const ddmm = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(t);
  if (ddmm) {
    const [, d, m, y] = ddmm;
    return { day: parseInt(d), month: parseInt(m), year: parseInt(y) };
  }

  // YYYY-MM-DD (ISO)
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  if (iso) {
    return { day: parseInt(iso[3]), month: parseInt(iso[2]), year: parseInt(iso[1]) };
  }

  // Spoken format: extract day, month, year from text
  const lower = t.toLowerCase();

  // Find month name
  let month = null;
  let remaining = lower;
  for (const [name, num] of Object.entries(ALL_MONTHS)) {
    if (remaining.includes(name)) {
      month = num;
      remaining = remaining.replace(name, ' ');
      break;
    }
  }

  if (!month) {
    // Try Hindi number words for all parts
    const hiWords = lower.split(/[\s,]+/);
    const nums = [];
    for (const w of hiWords) {
      if (NUMBER_WORDS_HI[w] !== undefined) nums.push(NUMBER_WORDS_HI[w]);
      else if (NUMBER_WORDS_EN[w] !== undefined) nums.push(NUMBER_WORDS_EN[w]);
      else if (/^\d+$/.test(w)) nums.push(parseInt(w));
    }
    // If we got 3 numbers, treat as day/month/year
    if (nums.length >= 3) {
      let [day, mo, year] = nums;
      if (year < 100) year += 1900;
      return { day, month: mo, year };
    }
    return null;
  }

  // Extract numbers from remaining text
  const nums = [];
  const tokens = remaining.split(/[\s,]+/).filter(Boolean);
  for (const tok of tokens) {
    // Remove ordinal suffixes
    const clean = tok.replace(/(st|nd|rd|th)$/i, '');
    if (/^\d+$/.test(clean)) {
      nums.push(parseInt(clean));
    } else if (NUMBER_WORDS_EN[clean] !== undefined) {
      nums.push(NUMBER_WORDS_EN[clean]);
    } else if (NUMBER_WORDS_HI[tok] !== undefined) {
      nums.push(NUMBER_WORDS_HI[tok]);
    }
  }

  // Also try multi-word year: "nineteen ninety" -> 1990
  let year = null;
  let day = null;

  for (const n of nums) {
    if (n > 100) { year = n; }
    else if (n >= 1 && n <= 31 && day === null) { day = n; }
  }

  // If no year found, try parsing compound year words
  if (!year) {
    year = parseSpokenYear(remaining);
  }

  if (day && month && year) {
    if (year < 100) year += 1900;
    return { day, month, year };
  }

  return null;
}

function parseVoiceValue(field, transcript, language) {
  const trimmed = transcript.trim();
  const lower = trimmed.toLowerCase();

  // Date of Birth
  if (field === 'dateOfBirth') {
    const parsed = parseDateFromText(trimmed);
    if (parsed) {
      const dd = String(parsed.day).padStart(2, '0');
      const mm = String(parsed.month).padStart(2, '0');
      return `${dd}/${mm}/${parsed.year}`;
    }
    return trimmed;
  }

  // Phone numbers and PIN codes - convert spoken digits to numbers
  if (field === 'emergencyContactPhone' || field === 'address.pin') {
    // First try: if it's already digits (with possible spaces/hyphens)
    const digitsOnly = trimmed.replace(/[\s\-\(\)\.+]/g, '');
    if (/^\d+$/.test(digitsOnly)) return digitsOnly;

    // Convert spoken digit words to numbers
    const parsed = parseSpokenNumber(trimmed);
    if (parsed && /^\d+$/.test(parsed)) return parsed;

    return trimmed;
  }

  // Gender - match across all languages
  if (field === 'gender') {
    // Check direct mapping
    for (const [key, val] of Object.entries(GENDER_MAP)) {
      if (lower === key || lower.includes(key)) return val;
    }
    return trimmed;
  }

  // Blood group
  if (field === 'bloodGroup') {
    // Direct match first (e.g., "B+", "O-")
    const upper = trimmed.toUpperCase().replace(/\s+/g, '');
    if (BLOOD_GROUPS.includes(upper)) return upper;

    // Spoken match
    for (const [spoken, val] of Object.entries(BLOOD_GROUP_MAP)) {
      if (lower === spoken || lower.includes(spoken)) return val;
    }
    return trimmed;
  }

  // State - fuzzy match
  if (field === 'address.state') {
    // Normalize: lowercase, remove spaces, remove "state" suffix
    const normalized = lower.replace(/[\s\-_.]/g, '').replace(/state$/, '');
    if (STATE_ALIASES[normalized]) return STATE_ALIASES[normalized];

    // Try partial match against INDIAN_STATES
    for (const state of INDIAN_STATES) {
      if (state.toLowerCase() === lower) return state;
      if (state.toLowerCase().replace(/\s/g, '') === normalized) return state;
    }

    return trimmed;
  }

  return trimmed;
}

export { QUESTIONS };

export default function PatientProfileForm({ initialData = {}, onSave, onFormChange, mode = 'setup', phone = '' }) {
  const { language } = useLanguage();
  const [form, setForm] = useState({ ...initialData });
  const [currentQ, setCurrentQ] = useState(0);
  const [messages, setMessages] = useState([]);
  const [voiceMode, setVoiceMode] = useState(true);
  const [lastFilledField, setLastFilledField] = useState(null);
  const [textInput, setTextInput] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [done, setDone] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const initRef = useRef(false);
  const currentQRef = useRef(0);

  // Backend-powered voice (Polly TTS + Sarvam STT)
  const {
    isListening, isSpeaking, isTranscribing, liveTranscript,
    speak, cancelSpeech, startListening, stopListening, getAnalyser, cleanup,
  } = useBackendVoice(language);

  // Keep ref in sync for callbacks
  useEffect(() => { currentQRef.current = currentQ; }, [currentQ]);

  // Notify parent of form changes for live summary
  useEffect(() => {
    onFormChange?.(form, lastFilledField);
  }, [form, lastFilledField]);

  const handleSttError = useCallback((errType) => {
    const msg = errType === 'mic_denied'
      ? (language === 'hindi' ? 'माइक्रोफोन की अनुमति दें।' : 'Please allow microphone access.')
      : (language === 'hindi' ? 'आवाज़ नहीं सुनाई दी। फिर बोलिए।' : "Couldn't hear you. Please try again.");
    setMessages(prev => [...prev, { role: 'ai', text: msg }]);
    setTimeout(() => {
      startListening((transcript) => handleAnswer(transcript), handleSttError);
    }, 800);
  }, [language, startListening]);

  /* ── Question flow ── */
  const askQuestion = useCallback((idx) => {
    if (idx >= QUESTIONS.length) {
      setDone(true);
      const doneMsg = DONE_MESSAGES[language] || DONE_MESSAGES.english;
      setMessages(prev => [...prev, { role: 'ai', text: doneMsg }]);
      if (voiceMode) speak(doneMsg);
      return;
    }
    const q = QUESTIONS[idx];
    const text = getQuestionText(q, language);
    setMessages(prev => [...prev, { role: 'ai', text, field: q.field }]);
    setCurrentQ(idx);

    // Speak the question, then auto-start mic
    if (voiceMode) {
      speak(text, () => {
        startListening((transcript) => handleAnswer(transcript), handleSttError);
      });
    }
  }, [language, voiceMode, speak, startListening, handleSttError]);

  // Handle answer (from voice or text)
  const handleAnswer = useCallback((answer) => {
    const idx = currentQRef.current;
    const q = QUESTIONS[idx];
    const trimmed = answer.trim();

    // Skip handling
    if (/^(skip|none|no|nahi|nahi hai|kuch nahi|स्किप|नहीं|कोई नहीं|இல்லை|లేదు|ಇಲ್ಲ|ഇല്ല|না|नाही|ના)$/i.test(trimmed)) {
      if (q.optional) {
        const skipMsg = SKIP_MSG[language] || SKIP_MSG.english;
        setMessages(prev => [...prev, { role: 'user', text: trimmed }, { role: 'ai', text: skipMsg }]);
        if (voiceMode) {
          speak(skipMsg, () => {
            setTimeout(() => askQuestion(idx + 1), 300);
          });
        } else {
          setTimeout(() => askQuestion(idx + 1), 300);
        }
        return;
      }
    }

    // Parse voice transcript into proper values before matching/validation
    const parsed = parseVoiceValue(q.field, trimmed, language);

    // For select fields, try to match
    let value = parsed;
    if (q.type === 'select' && q.options) {
      const matched = matchSelect(parsed, q.options);
      if (matched) {
        value = matched;
      } else {
        const optLabels = q.options.map(o => typeof o === 'string' ? o : o.label).join(', ');
        const retryMsg = language === 'hindi'
          ? `कृपया इनमें से चुनें: ${optLabels}`
          : `Please choose from: ${optLabels}`;
        setMessages(prev => [...prev,
          { role: 'user', text: trimmed },
          { role: 'ai', text: retryMsg }
        ]);
        if (voiceMode) {
          speak(retryMsg, () => {
            startListening((t) => handleAnswer(t), handleSttError);
          });
        }
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
        if (voiceMode) {
          speak(errorMsg, () => {
            startListening((t) => handleAnswer(t), handleSttError);
          });
        }
        return;
      }
    }

    // Save value
    const newForm = setVal(form, q.field, value);
    setForm(newForm);
    setMessages(prev => [...prev, { role: 'user', text: trimmed }]);

    // Notify parent of form change (for live summary panel)
    if (onFormChange) onFormChange(newForm, q.field);

    // Highlight the field
    setLastFilledField(q.field);
    setTimeout(() => setLastFilledField(null), 2500);

    // Confirmation + next question
    const confs = CONFIRMATIONS[language] || CONFIRMATIONS.english;
    const conf = confs[Math.floor(Math.random() * confs.length)];

    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'ai', text: conf }]);
      if (voiceMode) {
        speak(conf, () => {
          setTimeout(() => askQuestion(idx + 1), 300);
        });
      } else {
        setTimeout(() => askQuestion(idx + 1), 300);
      }
    }, 200);
  }, [language, voiceMode, speak, startListening, askQuestion]);

  // Start with greeting
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const greeting = GREETINGS[language] || GREETINGS.english;
    setMessages([{ role: 'ai', text: greeting }]);

    if (voiceMode) {
      speak(greeting, () => {
        setTimeout(() => askQuestion(0), 300);
      });
    } else {
      setTimeout(() => askQuestion(0), 300);
    }
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isListening, isTranscribing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  const handleTextSubmit = (e) => {
    e?.preventDefault();
    if (!textInput.trim()) return;
    cancelSpeech();
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

  const analyser = getAnalyser();

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

        {/* Waveform visualizer during recording */}
        {isListening && (
          <div className="flex justify-end animate-fade-in">
            <div className="rounded-2xl px-4 py-3 bg-red-50 border border-red-200 rounded-br-md">
              <WaveformVisualizer analyser={analyser} barCount={20} />
              <p className="text-[10px] text-red-500 font-heading font-semibold text-center mt-1">
                {language === 'hindi' ? 'सुन रहा हूँ...' : language === 'tamil' ? 'கேட்கிறேன்...' : 'Listening...'}
              </p>
            </div>
          </div>
        )}

        {/* Transcribing indicator */}
        {isTranscribing && (
          <div className="flex justify-end animate-fade-in">
            <div className="rounded-2xl px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-br-md">
              <p className="text-sm font-body flex items-center gap-2 text-amber-600">
                <Loader2 size={14} className="animate-spin" />
                {language === 'hindi' ? 'समझ रहा हूँ...' : 'Transcribing...'}
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
              if (isListening) {
                stopListening();
              } else {
                cancelSpeech();
                startListening((transcript) => handleAnswer(transcript), handleSttError);
              }
            }}
            disabled={isSpeaking || isTranscribing}
            className={`relative w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all overflow-hidden ${
              isListening ? 'scale-110' : (isSpeaking || isTranscribing) ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'
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
