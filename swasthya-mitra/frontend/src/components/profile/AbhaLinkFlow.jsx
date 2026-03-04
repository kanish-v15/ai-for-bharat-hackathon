import { useState } from 'react';
import { Shield, ArrowLeft, CheckCircle, User, MapPin, Calendar, Phone } from 'lucide-react';

const MOCK_ABHA_DATA = {
  fullName: 'Ramesh Kumar',
  dateOfBirth: '1985-06-15',
  gender: 'male',
  address: { district: 'Pune', state: 'Maharashtra', pin: '411001' },
  email: 'ramesh.kumar@gmail.com',
};

export default function AbhaLinkFlow({ onComplete, onSkip, userPhone }) {
  const [step, setStep] = useState(1);
  const [abhaId, setAbhaId] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handleAbhaSubmit = () => {
    if (abhaId.replace(/[-\s]/g, '').length >= 14) setStep(2);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`abha-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpSubmit = () => {
    if (otp.every(d => d !== '')) setStep(3);
  };

  const handleContinue = () => {
    onComplete(abhaId, { ...MOCK_ABHA_DATA, phone: userPhone });
  };

  return (
    <div className="animate-slide-up">
      {/* Step indicator */}
      <div className="flex justify-center gap-2 mb-6">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 rounded-full transition-all ${
            s === step ? 'w-8 bg-primary-500' : s < step ? 'w-4 bg-india-green' : 'w-4 bg-gray-200'
          }`} />
        ))}
      </div>

      {/* Step 1: Enter ABHA ID */}
      {step === 1 && (
        <div className="animate-slide-up">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4 ring-primary-100">
              <Shield size={28} className="text-primary-500" />
            </div>
            <h2 className="font-display text-xl text-dark">Link Your ABHA ID</h2>
            <p className="font-body text-sm text-warm-gray mt-1">
              Enter your 14-digit Ayushman Bharat Health Account ID
            </p>
          </div>

          <div className="space-y-4">
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-primary-500 transition-colors">
              <input
                type="text"
                value={abhaId}
                onChange={e => {
                  let v = e.target.value.replace(/[^\d-]/g, '');
                  setAbhaId(v);
                }}
                placeholder="91-XXXX-XXXX-XXXX"
                className="w-full px-4 py-3.5 text-sm font-body outline-none text-center tracking-widest"
              />
            </div>

            <button
              onClick={handleAbhaSubmit}
              disabled={abhaId.replace(/[-\s]/g, '').length < 14}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-xl font-heading font-bold text-sm hover:from-primary-600 hover:to-primary-700 disabled:opacity-40 transition-all shadow-lg shadow-primary-500/20"
            >
              Verify ABHA ID
            </button>

            <button onClick={onSkip} className="w-full text-center text-xs text-warm-gray hover:text-primary-500 font-heading font-medium transition-colors py-2">
              Skip — I'll fill manually instead
            </button>
          </div>
        </div>
      )}

      {/* Step 2: OTP */}
      {step === 2 && (
        <div className="animate-slide-up">
          <button onClick={() => setStep(1)} className="flex items-center gap-1 text-xs text-warm-gray hover:text-primary-500 font-heading font-medium mb-4 transition-colors">
            <ArrowLeft size={14} /> Back
          </button>

          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4 ring-primary-100">
              <Phone size={28} className="text-primary-500" />
            </div>
            <h2 className="font-display text-xl text-dark">Verify OTP</h2>
            <p className="font-body text-sm text-warm-gray mt-1">
              Enter the code sent to your ABHA-linked mobile
            </p>
          </div>

          <div className="flex gap-2 justify-center mb-5">
            {otp.map((digit, i) => (
              <input
                key={i}
                id={`abha-otp-${i}`}
                type="text"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpChange(i, e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Backspace' && !digit && i > 0) {
                    document.getElementById(`abha-otp-${i - 1}`)?.focus();
                  }
                }}
                className="w-11 h-11 border-2 border-gray-200 rounded-xl text-center text-lg font-bold focus:border-primary-500 outline-none transition-colors"
              />
            ))}
          </div>

          <button
            onClick={handleOtpSubmit}
            disabled={!otp.every(d => d !== '')}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-xl font-heading font-bold text-sm disabled:opacity-40 transition-all shadow-lg shadow-primary-500/20"
          >
            Verify & Fetch Records
          </button>
        </div>
      )}

      {/* Step 3: Prefilled Data */}
      {step === 3 && (
        <div className="animate-slide-up">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4 ring-emerald-100">
              <CheckCircle size={28} className="text-india-green" />
            </div>
            <h2 className="font-display text-xl text-dark">Records Found!</h2>
            <p className="font-body text-sm text-warm-gray mt-1">
              We fetched the following from your ABHA profile
            </p>
          </div>

          {/* Prefilled data cards */}
          <div className="space-y-2 mb-6">
            {[
              { icon: User, label: 'Name', value: MOCK_ABHA_DATA.fullName },
              { icon: Calendar, label: 'Date of Birth', value: MOCK_ABHA_DATA.dateOfBirth },
              { icon: User, label: 'Gender', value: MOCK_ABHA_DATA.gender.charAt(0).toUpperCase() + MOCK_ABHA_DATA.gender.slice(1) },
              { icon: MapPin, label: 'Location', value: `${MOCK_ABHA_DATA.address.district}, ${MOCK_ABHA_DATA.address.state} - ${MOCK_ABHA_DATA.address.pin}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 bg-cream rounded-xl px-4 py-3 border border-gray-100">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
                  <Icon size={14} className="text-primary-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-body text-[10px] text-warm-gray uppercase tracking-wider">{label}</p>
                  <p className="font-heading font-semibold text-sm text-dark truncate">{value}</p>
                </div>
                <CheckCircle size={14} className="text-india-green shrink-0" />
              </div>
            ))}
          </div>

          <div className="bg-primary-50/50 border border-primary-100 rounded-xl p-3 mb-5">
            <p className="font-body text-xs text-primary-700 text-center">
              You'll be able to fill in additional details like emergency contact, allergies, and medications in the next step.
            </p>
          </div>

          <button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 rounded-xl font-heading font-bold text-sm hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/20"
          >
            Continue to Complete Profile
          </button>
        </div>
      )}
    </div>
  );
}
