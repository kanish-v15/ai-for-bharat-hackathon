import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, FileText, Heart, CheckCircle, User, MapPin, Droplets, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AbhaLinkFlow from '../components/profile/AbhaLinkFlow';
import PatientProfileForm, { QUESTIONS } from '../components/profile/PatientProfileForm';
import DoctorProfileForm from '../components/profile/DoctorProfileForm';
import { FIELD_LABELS } from '../utils/profileHelpers';

/* ── Summary sections for the right panel ── */
const SUMMARY_SECTIONS = [
  {
    title: 'Personal',
    icon: User,
    fields: ['fullName', 'dateOfBirth', 'gender', 'email'],
  },
  {
    title: 'Address',
    icon: MapPin,
    fields: ['address.district', 'address.state', 'address.pin'],
  },
  {
    title: 'Health',
    icon: Droplets,
    fields: ['bloodGroup', 'knownAllergies', 'chronicConditions', 'currentMedications'],
  },
  {
    title: 'Emergency',
    icon: Phone,
    fields: ['emergencyContactName', 'emergencyContactPhone'],
  },
];

function getVal(obj, path) {
  return path.split('.').reduce((acc, k) => acc?.[k], obj) ?? '';
}

/* ── Live Form Summary Panel ── */
function FormSummaryPanel({ formData, lastFilledField }) {
  const filledCount = QUESTIONS.filter(q => {
    const v = getVal(formData, q.field);
    return v && (typeof v !== 'string' || v.trim());
  }).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-gray-200">
        <h3 className="font-heading font-bold text-dark text-base">Profile Preview</h3>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-india-green rounded-full transition-all duration-500"
              style={{ width: `${(filledCount / QUESTIONS.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-heading font-semibold text-warm-gray">
            {filledCount}/{QUESTIONS.length}
          </span>
        </div>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {SUMMARY_SECTIONS.map(section => {
          const Icon = section.icon;
          return (
            <div key={section.title}>
              <div className="flex items-center gap-2 mb-2.5">
                <Icon size={14} className="text-primary-500" />
                <h4 className="font-heading font-semibold text-xs text-primary-600 uppercase tracking-wider">
                  {section.title}
                </h4>
              </div>
              <div className="space-y-2">
                {section.fields.map(field => {
                  const val = getVal(formData, field);
                  const label = FIELD_LABELS[field] || field.split('.').pop();
                  const isFilled = val && (typeof val !== 'string' || val.trim());
                  const isHighlighted = lastFilledField === field;

                  return (
                    <div
                      key={field}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-500 ${
                        isHighlighted
                          ? 'bg-primary-50 ring-1 ring-primary-300 scale-[1.01]'
                          : isFilled
                            ? 'bg-green-50/60'
                            : 'bg-gray-50'
                      }`}
                    >
                      <span className={`text-xs font-body ${isFilled ? 'text-gray-600' : 'text-gray-400'}`}>
                        {label}
                      </span>
                      {isFilled ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-body font-medium text-dark max-w-[140px] truncate">
                            {val}
                          </span>
                          <CheckCircle size={12} className="text-india-green shrink-0" />
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-300 font-body italic">pending</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ProfileSetup() {
  const { user, updateProfile, linkAbha } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('choice'); // 'choice' | 'abha' | 'form'
  const [prefilledData, setPrefilledData] = useState(null);
  const [liveForm, setLiveForm] = useState({});
  const [liveHighlight, setLiveHighlight] = useState(null);

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

  const handleFormChange = useCallback((formData, lastField) => {
    setLiveForm(formData);
    setLiveHighlight(lastField);
  }, []);

  // Doctor goes straight to form
  if (isDoctor) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4 ring-primary-100">
            <Heart size={28} className="text-primary-500" />
          </div>
          <h1 className="font-display text-2xl text-dark">{t('profileSetup.completeProfile')}</h1>
          <p className="font-body text-sm text-warm-gray mt-1">
            {t('profileSetup.fillDetails')}
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
    <div className="animate-fade-in h-[calc(100vh-80px)]">
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
        <div className="max-w-2xl mx-auto">
          <AbhaLinkFlow
            onComplete={handleAbhaComplete}
            onSkip={handleAbhaSkip}
            userPhone={user?.phone || ''}
          />
        </div>
      )}

      {/* Patient Profile Form — Two Panel Layout */}
      {phase === 'form' && (
        <div className="flex h-full gap-0 animate-slide-up">
          {/* LEFT: Chat-based voice conversation */}
          <div className="flex-1 flex flex-col min-w-0 px-4 sm:px-6 py-4">
            <div className="text-center mb-4">
              <h1 className="font-display text-xl text-dark">{t('profileSetup.yourHealthProfile')}</h1>
              <p className="font-body text-xs text-warm-gray mt-1">
                {prefilledData
                  ? t('profileSetup.prefilledNote')
                  : t('profileSetup.manualNote')}
              </p>
            </div>
            <div className="flex-1 min-h-0">
              <PatientProfileForm
                initialData={{ ...(user?.profile || {}), ...(prefilledData || {}) }}
                onSave={handleSave}
                onFormChange={handleFormChange}
                mode="setup"
                phone={user?.phone || ''}
              />
            </div>
          </div>

          {/* RIGHT: Live form summary */}
          <div className="hidden lg:flex w-[340px] shrink-0 border-l border-gray-200 bg-white flex-col">
            <FormSummaryPanel formData={liveForm} lastFilledField={liveHighlight} />
          </div>
        </div>
      )}
    </div>
  );
}
