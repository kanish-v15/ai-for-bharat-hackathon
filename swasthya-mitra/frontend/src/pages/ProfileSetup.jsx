import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, FileText, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import AbhaLinkFlow from '../components/profile/AbhaLinkFlow';
import PatientProfileForm from '../components/profile/PatientProfileForm';
import DoctorProfileForm from '../components/profile/DoctorProfileForm';

export default function ProfileSetup() {
  const { user, updateProfile, linkAbha } = useAuth();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('choice'); // 'choice' | 'abha' | 'form'
  const [prefilledData, setPrefilledData] = useState(null);

  const isDoctor = user?.role === 'doctor';

  const handleAbhaComplete = (abhaId, data) => {
    linkAbha(abhaId);
    setPrefilledData(data);
    setPhase('form');
  };

  const handleAbhaSkip = () => {
    setPhase('form');
  };

  const handleSave = (formData) => {
    updateProfile(formData);
    navigate(isDoctor ? '/doctor' : '/patient');
  };

  // Doctor goes straight to form
  if (isDoctor) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4 ring-primary-100">
            <Heart size={28} className="text-primary-500" />
          </div>
          <h1 className="font-display text-2xl text-dark">Complete Your Profile</h1>
          <p className="font-body text-sm text-warm-gray mt-1">
            Fill in your details to start using SwasthyaMitra
          </p>
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
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* ABHA Choice */}
      {phase === 'choice' && (
        <div className="animate-slide-up">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4 ring-primary-100">
              <Heart size={28} className="text-primary-500" />
            </div>
            <h1 className="font-display text-2xl text-dark">Complete Your Profile</h1>
            <p className="font-body text-sm text-warm-gray mt-1">
              Choose how you'd like to set up your health profile
            </p>
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
                  <h3 className="font-heading font-bold text-dark text-sm">Link ABHA ID</h3>
                  <p className="font-body text-xs text-warm-gray mt-1">
                    Auto-fill your profile using Ayushman Bharat Health Account. Fast and secure.
                  </p>
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full bg-india-green/10 text-india-green font-heading font-semibold">
                    Recommended
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
                  <h3 className="font-heading font-bold text-dark text-sm">Fill Manually</h3>
                  <p className="font-body text-xs text-warm-gray mt-1">
                    Type or use voice to fill each field. You can link ABHA later from your profile.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ABHA Link Flow */}
      {phase === 'abha' && (
        <AbhaLinkFlow
          onComplete={handleAbhaComplete}
          onSkip={handleAbhaSkip}
          userPhone={user?.phone || ''}
        />
      )}

      {/* Patient Profile Form */}
      {phase === 'form' && (
        <div className="animate-slide-up">
          <div className="text-center mb-6">
            <h1 className="font-display text-2xl text-dark">Your Health Profile</h1>
            <p className="font-body text-sm text-warm-gray mt-1">
              {prefilledData
                ? 'We pre-filled some fields from your ABHA record. Complete the rest.'
                : 'Fill in your details — use voice or type manually'}
            </p>
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
