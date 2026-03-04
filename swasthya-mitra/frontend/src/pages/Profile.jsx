import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { calculateProfileCompletion } from '../utils/profileHelpers';
import ProfileCompletionBar from '../components/profile/ProfileCompletionBar';
import PatientProfileForm from '../components/profile/PatientProfileForm';
import DoctorProfileForm from '../components/profile/DoctorProfileForm';
import AbhaLinkFlow from '../components/profile/AbhaLinkFlow';
import { Shield, CheckCircle, Phone, User } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile, linkAbha } = useAuth();
  const [showAbhaLink, setShowAbhaLink] = useState(false);

  const isDoctor = user?.role === 'doctor';
  const completion = calculateProfileCompletion(user?.role, user?.profile);

  const handleSave = (formData) => {
    updateProfile(formData);
  };

  const handleAbhaComplete = (abhaId, data) => {
    linkAbha(abhaId);
    updateProfile(data);
    setShowAbhaLink(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-white shrink-0">
              <User size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-heading font-bold text-white text-lg truncate">
                {user?.profile?.fullName || user?.name || 'Your Profile'}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-white/70 text-xs font-heading font-medium flex items-center gap-1">
                  <Phone size={11} /> +91 {user?.phone}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 text-white font-heading font-semibold uppercase">
                  {user?.role}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          <ProfileCompletionBar
            percentage={completion.percentage}
            filledCount={completion.filledCount}
            totalCount={completion.totalCount}
            missingRequired={completion.missingRequired}
          />
        </div>
      </div>

      {/* ABHA Link Card (patients only) */}
      {!isDoctor && (
        <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden">
          <div className="p-5">
            {user?.abhaLinked ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle size={18} className="text-india-green" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm text-dark">ABHA Linked</p>
                  <p className="font-body text-xs text-warm-gray">ID: {user.abhaId}</p>
                </div>
              </div>
            ) : showAbhaLink ? (
              <AbhaLinkFlow
                onComplete={handleAbhaComplete}
                onSkip={() => setShowAbhaLink(false)}
                userPhone={user?.phone || ''}
              />
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                  <Shield size={18} className="text-primary-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm text-dark">Link ABHA ID</p>
                  <p className="font-body text-xs text-warm-gray">Connect your Ayushman Bharat Health Account</p>
                </div>
                <button
                  onClick={() => setShowAbhaLink(true)}
                  className="text-[11px] font-heading font-semibold px-3 py-1.5 rounded-full bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors shrink-0"
                >
                  Link Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Profile Form */}
      {isDoctor ? (
        <DoctorProfileForm
          initialData={user?.profile || {}}
          onSave={handleSave}
          mode="edit"
          phone={user?.phone || ''}
        />
      ) : (
        <PatientProfileForm
          initialData={user?.profile || {}}
          onSave={handleSave}
          mode="edit"
          phone={user?.phone || ''}
        />
      )}
    </div>
  );
}
