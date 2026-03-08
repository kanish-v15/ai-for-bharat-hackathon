import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, FileText, Heart, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import PatientProfileForm from '../components/profile/PatientProfileForm';
import DoctorProfileForm from '../components/profile/DoctorProfileForm';

/* ── ABHA Link Flow with OTP ── */
function AbhaLinkStep({ onComplete, onSkip }) {
  const { t } = useLanguage();
  const [step, setStep] = useState('id'); // 'id' | 'otp' | 'verifying'
  const [abhaId, setAbhaId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const otpRefs = useRef([]);

  const handleSendOtp = () => {
    const cleaned = abhaId.replace(/[\s-]/g, '');
    if (cleaned.length < 14) {
      setError('Please enter a valid 14-digit ABHA ID');
      return;
    }
    setError('');
    setLoading(true);
    // Simulate sending OTP
    setTimeout(() => {
      setLoading(false);
      setStep('otp');
    }, 1200);
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(-1);
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = () => {
    const code = otp.join('');
    if (code.length < 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }
    setError('');
    setStep('verifying');
    // Simulate OTP verification + ABHA data fetch
    setTimeout(() => {
      onComplete(abhaId, {
        fullName: 'Ramesh Kumar',
        dateOfBirth: '15/06/1985',
        gender: 'male',
        email: 'ramesh.kumar@gmail.com',
        address: { district: 'Pune', state: 'Maharashtra', pin: '411001' },
      });
    }, 2000);
  };

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="w-16 h-16 bg-saffron-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4 ring-saffron-100">
        <Shield size={28} className="text-saffron-500" />
      </div>

      {/* Step 1: Enter ABHA ID */}
      {step === 'id' && (
        <>
          <h2 className="font-display text-xl text-dark mb-1">Link Your ABHA ID</h2>
          <p className="font-body text-sm text-warm-gray mb-6">
            Enter your 14-digit Ayushman Bharat Health Account ID
          </p>

          <input
            type="text"
            value={abhaId}
            onChange={(e) => { setAbhaId(e.target.value); setError(''); }}
            placeholder="XX-XXXX-XXXX-XXXX"
            maxLength={19}
            className="w-full px-5 py-3.5 text-center text-lg font-body tracking-wider border-2 border-saffron-200 rounded-xl focus:border-saffron-400 focus:ring-2 focus:ring-saffron-200 outline-none transition-all placeholder:text-warm-gray/40"
          />

          {error && <p className="text-xs text-red-500 font-body mt-2">{error}</p>}

          <button
            onClick={handleSendOtp}
            disabled={loading}
            className="w-full mt-4 bg-gradient-to-r from-saffron-400 to-saffron-500 text-white py-3 rounded-xl font-heading font-bold text-sm disabled:opacity-60 transition-all hover:from-saffron-500 hover:to-saffron-600 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Sending OTP...' : 'Verify ABHA ID'}
          </button>
        </>
      )}

      {/* Step 2: Enter OTP */}
      {step === 'otp' && (
        <>
          <h2 className="font-display text-xl text-dark mb-1">Verify OTP</h2>
          <p className="font-body text-sm text-warm-gray mb-6">
            We sent a 6-digit OTP to your ABHA-linked mobile number
          </p>

          <div className="flex justify-center gap-2.5 mb-4">
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (otpRefs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-heading font-bold border-2 border-gray-200 rounded-xl focus:border-saffron-400 focus:ring-2 focus:ring-saffron-200 outline-none transition-all"
              />
            ))}
          </div>

          {error && <p className="text-xs text-red-500 font-body mb-3">{error}</p>}

          <p className="text-xs text-warm-gray font-body mb-4">
            Demo OTP: <span className="font-semibold text-dark">123456</span>
          </p>

          <button
            onClick={handleVerifyOtp}
            className="w-full bg-gradient-to-r from-saffron-400 to-saffron-500 text-white py-3 rounded-xl font-heading font-bold text-sm transition-all hover:from-saffron-500 hover:to-saffron-600"
          >
            Verify & Fetch Profile
          </button>

          <button
            onClick={() => { setStep('id'); setOtp(['', '', '', '', '', '']); setError(''); }}
            className="mt-3 text-xs font-body text-warm-gray hover:text-primary-500 underline underline-offset-2 transition-colors"
          >
            Change ABHA ID
          </button>
        </>
      )}

      {/* Step 3: Verifying animation */}
      {step === 'verifying' && (
        <div className="py-8">
          <Loader2 size={40} className="animate-spin text-saffron-500 mx-auto mb-4" />
          <h2 className="font-display text-lg text-dark mb-1">Fetching Your Profile</h2>
          <p className="font-body text-sm text-warm-gray">
            Pulling your details from ABHA registry...
          </p>
        </div>
      )}

      {step !== 'verifying' && (
        <button
          onClick={onSkip}
          className="mt-5 text-sm font-body text-warm-gray hover:text-primary-500 underline underline-offset-2 transition-colors"
        >
          {t('profileSetup.formLabels.skipForNow')}
        </button>
      )}
    </div>
  );
}

export default function ProfileSetup() {
  const { user, updateProfile, linkAbha } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('choice'); // 'choice' | 'abha' | 'form'
  const [prefilledData, setPrefilledData] = useState(null);

  const isDoctor = user?.role === 'doctor';

  const handleAbhaComplete = (abhaId, data) => {
    linkAbha(abhaId);
    setPrefilledData(data);
    setPhase('form');
  };

  const handleSave = (formData) => {
    updateProfile(formData);
    navigate(isDoctor ? '/doctor' : '/patient');
  };

  const handleSkip = () => {
    updateProfile({ profileComplete: true });
    navigate(isDoctor ? '/doctor' : '/patient');
  };

  // Doctor goes straight to form
  if (isDoctor) {
    return (
      <div className="animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4 ring-primary-100">
            <Heart size={28} className="text-primary-500" />
          </div>
          <h1 className="font-display text-2xl text-dark">{t('profileSetup.completeProfile')}</h1>
          <p className="font-body text-sm text-warm-gray mt-1">
            {t('profileSetup.fillDetails')}
          </p>
          <button onClick={handleSkip} className="text-xs font-body text-warm-gray hover:text-primary-500 underline underline-offset-2 mt-2 transition-colors">
            {t('profileSetup.formLabels.skipForNow')}
          </button>
        </div>
        <DoctorProfileForm
          initialData={user?.profile || {}}
          onSave={handleSave}
          mode="setup"
          phone={user?.phone || ''}
        />
      </div>
    );
  }

  // Patient: ABHA choice → ABHA flow / form
  return (
    <div className="animate-fade-in">
      {/* ABHA Choice */}
      {phase === 'choice' && (
        <div className="max-w-2xl mx-auto animate-slide-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4 ring-primary-100">
              <Heart size={28} className="text-primary-500" />
            </div>
            <h1 className="font-display text-2xl text-dark">{t('profileSetup.completeProfile')}</h1>
            <p className="font-body text-sm text-warm-gray mt-1">
              {t('profileSetup.completeProfileDesc')}
            </p>
            <button onClick={handleSkip} className="text-xs font-body text-warm-gray hover:text-primary-500 underline underline-offset-2 mt-2 transition-colors">
              {t('profileSetup.formLabels.skipForNow')}
            </button>
          </div>

          <div className="grid gap-3">
            {/* ABHA option */}
            <button
              onClick={() => setPhase('abha')}
              className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/10 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                  <Shield size={22} className="text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-dark text-sm">{t('profileSetup.linkAbha')}</h3>
                  <p className="font-body text-xs text-warm-gray mt-1">
                    {t('profileSetup.linkAbhaDesc')}
                  </p>
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-india-green/10 text-india-green font-heading font-semibold">
                    {t('profileSetup.recommended')}
                  </span>
                </div>
              </div>
            </button>

            {/* Manual option */}
            <button
              onClick={() => setPhase('form')}
              className="w-full bg-white border-2 border-gray-200 rounded-2xl p-5 text-left hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/10 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition-colors">
                  <FileText size={22} className="text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-dark text-sm">{t('profileSetup.fillManually')}</h3>
                  <p className="font-body text-xs text-warm-gray mt-1">
                    {t('profileSetup.fillManuallyDesc')}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ABHA Link Flow */}
      {phase === 'abha' && (
        <div className="max-w-2xl mx-auto animate-slide-up">
          <button
            onClick={() => setPhase('choice')}
            className="flex items-center gap-1 text-sm font-body text-warm-gray hover:text-primary-500 mb-6 transition-colors"
          >
            <ArrowLeft size={16} /> Back
          </button>
          <AbhaLinkStep
            onComplete={handleAbhaComplete}
            onSkip={() => setPhase('form')}
          />
        </div>
      )}

      {/* Patient Profile Form — Full Width */}
      {phase === 'form' && (
        <div className="animate-slide-up">
          <div className="text-center mb-5">
            <h1 className="font-display text-xl text-dark">{t('profileSetup.yourHealthProfile')}</h1>
            <p className="font-body text-xs text-warm-gray mt-1">
              {prefilledData
                ? t('profileSetup.prefilledNote')
                : t('profileSetup.manualNote')}
            </p>
            <button onClick={handleSkip} className="text-xs font-body text-warm-gray hover:text-primary-500 underline underline-offset-2 mt-1 transition-colors">
              {t('profileSetup.formLabels.skipForNow')}
            </button>
          </div>
          <PatientProfileForm
            initialData={{ ...(user?.profile || {}), ...(prefilledData || {}) }}
            onSave={handleSave}
            mode="setup"
            phone={user?.phone || ''}
          />
        </div>
      )}
    </div>
  );
}
