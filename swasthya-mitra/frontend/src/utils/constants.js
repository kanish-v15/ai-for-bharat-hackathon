export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const LANGUAGES = {
  hindi: {
    code: 'hi',
    label: 'हिंदी',
    labelEn: 'Hindi',
    sarvamSTT: 'hi-IN',
    sarvamTTS: 'hi-IN',
    translate: 'hi',
  },
  tamil: {
    code: 'ta',
    label: 'தமிழ்',
    labelEn: 'Tamil',
    sarvamSTT: 'ta-IN',
    sarvamTTS: 'ta-IN',
    translate: 'ta',
  },
  english: {
    code: 'en',
    label: 'English',
    labelEn: 'English',
    sarvamSTT: 'en-IN',
    sarvamTTS: 'en-IN',
    translate: 'en',
  },
};

export const DISCLAIMERS = {
  hindi: 'यह पेशेवर चिकित्सा सलाह का विकल्प नहीं है। कृपया डॉक्टर से परामर्श करें।',
  tamil: 'இது தொழில்முறை மருத்துவ ஆலோசனைக்கு மாற்றாக அல்ல. உங்கள் மருத்துவரை அணுகவும்.',
  english: 'This is not a substitute for professional medical advice. Please consult your doctor.',
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
