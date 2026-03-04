import { useState, useEffect } from 'react';
import { User, Building2, GraduationCap, Briefcase, Sparkles, Mic, MicOff, CheckCircle } from 'lucide-react';
import VoiceFormField from './VoiceFormField';
import {
  SPECIALIZATIONS, REGISTRATION_COUNCILS, QUALIFICATIONS,
  INDIAN_STATES, DOCTOR_REQUIRED_FIELDS, validateField,
} from '../../utils/profileHelpers';
import { VOICE_PROMPTS, simulateTranscription } from '../../utils/mockTranscription';

const FIELD_ORDER = [
  'fullName', 'email',
  'medicalRegNumber', 'registrationCouncil', 'specialization', 'qualification',
  'clinicHospitalName', 'clinicAddress.district', 'clinicAddress.state', 'clinicAddress.pin',
  'yearsOfExperience', 'consultationFee', 'availableLanguages', 'workingHours',
];

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

export default function DoctorProfileForm({ initialData = {}, onSave, mode = 'setup', phone = '' }) {
  const [form, setForm] = useState({ ...initialData });
  const [errors, setErrors] = useState({});
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceFieldIdx, setVoiceFieldIdx] = useState(0);
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceTranscribing, setVoiceTranscribing] = useState(false);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length) {
      setForm(prev => ({ ...prev, ...initialData }));
    }
  }, []);

  const handleChange = (name, value) => {
    setForm(prev => setVal(prev, name, value));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = () => {
    const newErrors = {};
    DOCTOR_REQUIRED_FIELDS.forEach(field => {
      const val = getVal(form, field);
      const result = validateField(field, val);
      if (!result.valid) newErrors[field] = result.error;
    });
    // Optional field validation
    if (form.email) {
      const r = validateField('email', form.email);
      if (!r.valid) newErrors.email = r.error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(form);
  };

  const advanceVoiceField = (fromIdx) => {
    for (let i = fromIdx + 1; i < FIELD_ORDER.length; i++) {
      const val = getVal(form, FIELD_ORDER[i]);
      if (!val || (typeof val === 'string' && !val.trim())) {
        setVoiceFieldIdx(i);
        return;
      }
    }
    setVoiceActive(false);
  };

  const handleVoiceRecord = async () => {
    const fieldName = FIELD_ORDER[voiceFieldIdx];
    setVoiceRecording(true);
    await new Promise(r => setTimeout(r, 1200));
    setVoiceRecording(false);
    setVoiceTranscribing(true);
    const result = await simulateTranscription(fieldName, 1000);
    if (result) handleChange(fieldName, result);
    setVoiceTranscribing(false);
    advanceVoiceField(voiceFieldIdx);
  };

  const currentPrompt = VOICE_PROMPTS[FIELD_ORDER[voiceFieldIdx]] || 'Please answer...';
  const filledRequired = DOCTOR_REQUIRED_FIELDS.filter(f => {
    const v = getVal(form, f);
    return v && (typeof v !== 'string' || v.trim());
  }).length;

  return (
    <div className="space-y-5">
      {/* Voice Assistant Banner */}
      <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${voiceActive ? 'bg-gradient-to-r from-primary-500 to-primary-600 shadow-xl shadow-primary-500/20' : 'bg-white border border-gray-200 shadow-premium'}`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className={voiceActive ? 'text-white' : 'text-primary-500'} />
              <span className={`font-heading font-bold text-sm ${voiceActive ? 'text-white' : 'text-dark'}`}>
                Voice Assistant
              </span>
            </div>
            <button
              type="button"
              onClick={() => { setVoiceActive(!voiceActive); setVoiceFieldIdx(0); }}
              className={`text-[11px] font-heading font-semibold px-3 py-1.5 rounded-full transition-all ${
                voiceActive
                  ? 'bg-white/20 text-white hover:bg-white/30'
                  : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
              }`}
            >
              {voiceActive ? 'Turn Off' : 'Turn On'}
            </button>
          </div>

          {voiceActive && (
            <div className="mt-3 animate-fade-in">
              <p className="text-white/90 font-body text-sm mb-4 italic">"{currentPrompt}"</p>

              <div className="flex items-center justify-center gap-4 mb-3">
                <button
                  type="button"
                  onClick={handleVoiceRecord}
                  disabled={voiceTranscribing}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    voiceRecording
                      ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/40'
                      : voiceTranscribing
                        ? 'bg-white/20 text-white'
                        : 'bg-white/20 text-white hover:bg-white/30 active:scale-95'
                  } disabled:opacity-40`}
                >
                  {voiceTranscribing ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : voiceRecording ? (
                    <MicOff size={22} />
                  ) : (
                    <Mic size={22} />
                  )}
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/70 rounded-full transition-all duration-500"
                    style={{ width: `${(voiceFieldIdx / FIELD_ORDER.length) * 100}%` }}
                  />
                </div>
                <span className="text-white/70 text-[10px] font-heading font-medium">
                  {voiceFieldIdx + 1}/{FIELD_ORDER.length}
                </span>
              </div>
            </div>
          )}

          {!voiceActive && (
            <p className="font-body text-xs text-warm-gray mt-0.5">
              Let AI ask you questions and fill the form by voice
            </p>
          )}
        </div>
      </div>

      {/* Section: Personal Information */}
      <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden animate-stagger-1">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
            <User size={14} className="text-primary-500" />
          </div>
          <h3 className="font-heading font-bold text-dark text-sm">Personal Information</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <VoiceFormField label="Full Name" name="fullName" value={getVal(form, 'fullName')} onChange={handleChange} required placeholder="Dr. Full Name" error={errors.fullName} />
          <VoiceFormField label="Phone Number" name="phone" type="tel" value={phone} onChange={() => {}} readOnly />
          <VoiceFormField label="Email" name="email" type="email" value={getVal(form, 'email')} onChange={handleChange} required placeholder="doctor@hospital.com" error={errors.email} />
        </div>
      </div>

      {/* Section: Medical Registration */}
      <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden animate-stagger-2">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
            <GraduationCap size={14} className="text-india-green" />
          </div>
          <h3 className="font-heading font-bold text-dark text-sm">Medical Registration</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <VoiceFormField label="Registration Number" name="medicalRegNumber" value={getVal(form, 'medicalRegNumber')} onChange={handleChange} required placeholder="e.g., MCI-12345" error={errors.medicalRegNumber} />
          <VoiceFormField label="Registration Council" name="registrationCouncil" type="select" options={REGISTRATION_COUNCILS} value={getVal(form, 'registrationCouncil')} onChange={handleChange} required placeholder="Select council" error={errors.registrationCouncil} />
          <VoiceFormField label="Specialization" name="specialization" type="select" options={SPECIALIZATIONS} value={getVal(form, 'specialization')} onChange={handleChange} required placeholder="Select specialization" error={errors.specialization} />
          <VoiceFormField label="Qualification" name="qualification" type="select" options={QUALIFICATIONS} value={getVal(form, 'qualification')} onChange={handleChange} required placeholder="Select qualification" error={errors.qualification} />
        </div>
      </div>

      {/* Section: Clinic / Hospital */}
      <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden animate-stagger-3">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
            <Building2 size={14} className="text-violet-500" />
          </div>
          <h3 className="font-heading font-bold text-dark text-sm">Clinic / Hospital</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <VoiceFormField label="Clinic / Hospital Name" name="clinicHospitalName" value={getVal(form, 'clinicHospitalName')} onChange={handleChange} required placeholder="e.g., City Hospital, Pune" error={errors.clinicHospitalName} />
          </div>
          <VoiceFormField label="District" name="clinicAddress.district" value={getVal(form, 'clinicAddress.district')} onChange={handleChange} required placeholder="Enter district" error={errors['clinicAddress.district']} />
          <VoiceFormField label="State" name="clinicAddress.state" type="select" options={INDIAN_STATES} value={getVal(form, 'clinicAddress.state')} onChange={handleChange} required placeholder="Select state" error={errors['clinicAddress.state']} />
          <VoiceFormField label="PIN Code" name="clinicAddress.pin" type="tel" value={getVal(form, 'clinicAddress.pin')} onChange={handleChange} required placeholder="6-digit PIN" error={errors['clinicAddress.pin']} />
        </div>
      </div>

      {/* Section: Additional Info (Optional) */}
      <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden animate-stagger-4">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
            <Briefcase size={14} className="text-amber-500" />
          </div>
          <h3 className="font-heading font-bold text-dark text-sm">Additional Info</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-warm-gray font-heading font-medium ml-auto">Optional</span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <VoiceFormField label="Years of Experience" name="yearsOfExperience" type="tel" value={getVal(form, 'yearsOfExperience')} onChange={handleChange} placeholder="e.g., 12" />
          <VoiceFormField label="Consultation Fee" name="consultationFee" type="tel" value={getVal(form, 'consultationFee')} onChange={handleChange} placeholder="e.g., 500" />
          <VoiceFormField label="Languages Spoken" name="availableLanguages" value={getVal(form, 'availableLanguages')} onChange={handleChange} placeholder="e.g., Hindi, English, Marathi" />
          <VoiceFormField label="Working Hours" name="workingHours" value={getVal(form, 'workingHours')} onChange={handleChange} placeholder="e.g., Mon-Sat 9AM-5PM" />
        </div>
      </div>

      {/* Required fields counter */}
      <div className="flex items-center justify-between px-1">
        <p className="font-body text-xs text-warm-gray">
          <span className="font-heading font-semibold text-india-green">{filledRequired}</span> / {DOCTOR_REQUIRED_FIELDS.length} required fields completed
        </p>
        {filledRequired === DOCTOR_REQUIRED_FIELDS.length && (
          <span className="flex items-center gap-1 text-xs text-india-green font-heading font-semibold">
            <CheckCircle size={13} /> Ready to save
          </span>
        )}
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3.5 rounded-xl font-heading font-bold text-sm hover:from-primary-600 hover:to-primary-700 active:scale-[0.99] transition-all shadow-lg shadow-primary-500/20 animate-stagger-5"
      >
        {mode === 'setup' ? 'Complete Profile & Continue' : 'Save Changes'}
      </button>
    </div>
  );
}
