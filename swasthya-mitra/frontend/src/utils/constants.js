export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const LANGUAGES = {
  hindi: {
    code: 'hi',
    label: 'हिंदी',
    labelEn: 'Hindi',
    sarvamSTT: 'hi-IN',
    sarvamTTS: 'hi-IN',
    speechCode: 'hi-IN',
    translate: 'hi',
  },
  tamil: {
    code: 'ta',
    label: 'தமிழ்',
    labelEn: 'Tamil',
    sarvamSTT: 'ta-IN',
    sarvamTTS: 'ta-IN',
    speechCode: 'ta-IN',
    translate: 'ta',
  },
  english: {
    code: 'en',
    label: 'English',
    labelEn: 'English',
    sarvamSTT: 'en-IN',
    sarvamTTS: 'en-IN',
    speechCode: 'en-IN',
    translate: 'en',
  },
  telugu: {
    code: 'te',
    label: 'తెలుగు',
    labelEn: 'Telugu',
    sarvamSTT: 'te-IN',
    sarvamTTS: 'te-IN',
    speechCode: 'te-IN',
    translate: 'te',
  },
  kannada: {
    code: 'kn',
    label: 'ಕನ್ನಡ',
    labelEn: 'Kannada',
    sarvamSTT: 'kn-IN',
    sarvamTTS: 'kn-IN',
    speechCode: 'kn-IN',
    translate: 'kn',
  },
  malayalam: {
    code: 'ml',
    label: 'മലയാളം',
    labelEn: 'Malayalam',
    sarvamSTT: 'ml-IN',
    sarvamTTS: 'ml-IN',
    speechCode: 'ml-IN',
    translate: 'ml',
  },
  bengali: {
    code: 'bn',
    label: 'বাংলা',
    labelEn: 'Bengali',
    sarvamSTT: 'bn-IN',
    sarvamTTS: 'bn-IN',
    speechCode: 'bn-IN',
    translate: 'bn',
  },
  marathi: {
    code: 'mr',
    label: 'मराठी',
    labelEn: 'Marathi',
    sarvamSTT: 'mr-IN',
    sarvamTTS: 'mr-IN',
    speechCode: 'mr-IN',
    translate: 'mr',
  },
  gujarati: {
    code: 'gu',
    label: 'ગુજરાતી',
    labelEn: 'Gujarati',
    sarvamSTT: 'gu-IN',
    sarvamTTS: 'gu-IN',
    speechCode: 'gu-IN',
    translate: 'gu',
  },
};

export const DISCLAIMERS = {
  hindi: 'यह पेशेवर चिकित्सा सलाह का विकल्प नहीं है। कृपया डॉक्टर से परामर्श करें।',
  tamil: 'இது தொழில்முறை மருத்துவ ஆலோசனைக்கு மாற்றாக அல்ல. உங்கள் மருத்துவரை அணுகவும்.',
  english: 'This is not a substitute for professional medical advice. Please consult your doctor.',
  telugu: 'ఇది వృత్తిపరమైన వైద్య సలహాకు ప్రత్యామ్నాయం కాదు. దయచేసి మీ వైద్యుడిని సంప్రదించండి.',
  kannada: 'ಇದು ವೃತ್ತಿಪರ ವೈದ್ಯಕೀಯ ಸಲಹೆಗೆ ಪರ್ಯಾಯವಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
  malayalam: 'ഇത് പ്രൊഫഷണല്‍ വൈദ്യ ഉപദേശത്തിന് പകരമല്ല. ദയവായി നിങ്ങളുടെ ഡോക്ടറെ സമീപിക്കുക.',
  bengali: 'এটি পেশাদার চিকিৎসা পরামর্শের বিকল্প নয়। অনুগ্রহ করে আপনার ডাক্তারের সাথে পরামর্শ করুন।',
  marathi: 'हे व्यावसायिक वैद्यकीय सल्ल्याचा पर्याय नाही. कृपया आपल्या डॉक्टरांचा सल्ला घ्या.',
  gujarati: 'આ વ્યાવસાયિક તબીબી સલાહનો વિકલ્પ નથી. કૃપા કરીને તમારા ડૉક્ટરની સલાહ લો.',
};

export const EMERGENCY_NUMBERS = {
  ambulance: '108',
  healthHelpline: '104',
};

export const CLASSIFICATION_COLORS = {
  Normal: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '✅' },
  Borderline: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: '⚠️' },
  Abnormal: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: '🔴' },
  Unclassified: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: '❓' },
};
