import { useState } from 'react';
import { X, MessageSquare, UserCheck, Languages, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { sendOtp, verifyOtp, resendOtp } from '../services/api';

const LANGUAGES_LIST = [
  { code: 'english', native: 'English', english: '' },
  { code: 'hindi', native: 'हिंदी', english: 'Hindi' },
  { code: 'tamil', native: 'தமிழ்', english: 'Tamil' },
  { code: 'telugu', native: 'తెలుగు', english: 'Telugu' },
  { code: 'kannada', native: 'ಕನ್ನಡ', english: 'Kannada' },
  { code: 'malayalam', native: 'മലയാളം', english: 'Malayalam' },
  { code: 'bengali', native: 'বাংলা', english: 'Bengali' },
  { code: 'marathi', native: 'मराठी', english: 'Marathi' },
  { code: 'gujarati', native: 'ગુજરાતી', english: 'Gujarati' },
];


export default function LoginModal() {
  const { login, setShowLogin } = useAuth();
  const { setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const handlePhoneSubmit = async () => {
    if (phone.length !== 10) return;
    setLoading(true);
    setError('');
    try {
      const result = await sendOtp(phone);
      // In dev mode, auto-fill OTP if returned
      if (result.dev_otp) {
        const digits = result.dev_otp.split('');
        setOtp(digits);
      }
      setStep(2);
      startResendCooldown();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startResendCooldown = () => {
    setResendCooldown(30);
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      if (next) next.focus();
    }
  };

  const handleOtpSubmit = async () => {
    const otpString = otp.join('');
    if (otpString.length !== 6) return;
    setLoading(true);
    setError('');
    try {
      await verifyOtp(phone, otpString);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError('');
    try {
      const result = await resendOtp(phone);
      if (result.dev_otp) {
        const digits = result.dev_otp.split('');
        setOtp(digits);
      } else {
        setOtp(['', '', '', '', '', '']);
      }
      startResendCooldown();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (r) => {
    setRole(r);
    setStep(4);
  };

  const handleLanguageSelect = (lang) => {
    login(role, phone, lang);
    setLanguage(lang);
    navigate('/profile-setup');
  };

  const handleBack = () => {
    setError('');
    if (step === 2) {
      setOtp(['', '', '', '', '', '']);
    }
    setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Tricolor top bar */}
        <div className="tricolor"></div>

        <button
          onClick={() => setShowLogin(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors z-10"
        >
          <X size={16} />
        </button>

        {step > 1 && (
          <button
            onClick={handleBack}
            className="absolute top-4 left-4 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors z-10"
          >
            <ArrowLeft size={16} />
          </button>
        )}

        {/* Step indicators */}
        <div className="flex justify-center gap-2 pt-6 pb-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${
              s === step ? 'w-8 bg-saffron-500' : s < step ? 'w-4 bg-saffron-300' : 'w-4 bg-gray-200'
            }`} />
          ))}
        </div>

        <div className="p-8 pt-4">
          {/* Error message */}
          {error && (
            <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium text-center animate-slide-up">
              {error}
            </div>
          )}

          {/* Step 1: Phone */}
          {step === 1 && (
            <div className="animate-slide-up">
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <Logo size={56} />
                </div>
                <h2 className="font-display font-bold text-xl text-dark">Welcome to <span className="text-saffron-500">Swasthya</span><span className="text-india-green">Mitra</span></h2>
                <p className="text-gray-500 text-sm mt-1">Enter your mobile number to get started</p>
              </div>
              <div className="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden focus-within:border-saffron-500 transition-colors mb-4">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-r border-gray-200 text-sm font-medium text-gray-600">
                  <span className="text-base">IN</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="Enter 10-digit mobile number"
                  className="flex-1 px-4 py-3 text-sm outline-none"
                  onKeyDown={e => e.key === 'Enter' && handlePhoneSubmit()}
                />
              </div>
              <button
                onClick={handlePhoneSubmit}
                disabled={phone.length !== 10 || loading}
                className="w-full bg-saffron-500 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-saffron-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Sending OTP...</> : 'Send OTP'}
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">We'll send a 6-digit verification code via SMS</p>
            </div>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <div className="animate-slide-up">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-saffron-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare size={28} className="text-saffron-500" />
                </div>
                <h2 className="font-display font-bold text-xl text-dark">Verify OTP</h2>
                <p className="text-gray-500 text-sm mt-1">Enter the 6-digit code sent to +91 {phone}</p>
              </div>
              <div className="flex gap-2 justify-center mb-4">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !digit && i > 0) {
                        document.getElementById(`otp-${i - 1}`)?.focus();
                      }
                      if (e.key === 'Enter' && otp.every(d => d !== '')) {
                        handleOtpSubmit();
                      }
                    }}
                    className="w-12 h-12 border-2 border-gray-200 rounded-xl text-center text-lg font-bold focus:border-saffron-500 outline-none transition-colors"
                  />
                ))}
              </div>
              <button
                onClick={handleOtpSubmit}
                disabled={!otp.every(d => d !== '') || loading}
                className="w-full bg-saffron-500 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-saffron-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying...</> : 'Verify & Continue'}
              </button>
              <p className="text-xs text-gray-400 text-center mt-3">
                Didn't receive?{' '}
                <button
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="text-saffron-500 font-medium disabled:text-gray-300 disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </p>
            </div>
          )}

          {/* Step 3: Role */}
          {step === 3 && (
            <div className="animate-slide-up">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-saffron-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <UserCheck size={28} className="text-saffron-500" />
                </div>
                <h2 className="font-display font-bold text-xl text-dark">Who are you?</h2>
                <p className="text-gray-500 text-sm mt-1">Select your role for a personalized experience</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleRoleSelect('patient')}
                  className="p-5 border-2 border-gray-200 rounded-2xl hover:border-saffron-500 hover:bg-saffron-50 transition-all text-center group"
                >
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-saffron-100 transition-colors">
                    <span className="text-2xl">🧑</span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-dark">Patient</h3>
                  <p className="text-xs text-gray-400 mt-1">Health guidance & reports</p>
                </button>
                <button
                  onClick={() => handleRoleSelect('doctor')}
                  className="p-5 border-2 border-gray-200 rounded-2xl hover:border-saffron-500 hover:bg-saffron-50 transition-all text-center group"
                >
                  <div className="w-12 h-12 bg-saffron-50 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:bg-saffron-100 transition-colors">
                    <span className="text-2xl">👩‍⚕️</span>
                  </div>
                  <h3 className="font-display font-bold text-sm text-dark">Doctor</h3>
                  <p className="text-xs text-gray-400 mt-1">AI documentation tools</p>
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Language */}
          {step === 4 && (
            <div className="animate-slide-up">
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-saffron-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Languages size={28} className="text-saffron-500" />
                </div>
                <h2 className="font-display font-bold text-xl text-dark">Choose Your Language</h2>
                <p className="text-gray-500 text-sm mt-1">The entire app will work in your chosen language</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGES_LIST.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className="p-3 border-2 border-gray-200 rounded-xl hover:border-saffron-500 hover:bg-saffron-50 transition-all text-center"
                  >
                    <span className="block font-display font-semibold text-sm text-dark">{lang.native}</span>
                    {lang.english && <span className="text-xs text-gray-400">{lang.english}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
