import { useState, useEffect } from 'react';
import { User, MapPin, Phone, Heart, Pill, Mic, MicOff, Sparkles, CheckCircle } from 'lucide-react';
import VoiceFormField from './VoiceFormField';
import {
  BLOOD_GROUPS, GENDERS, INDIAN_STATES,
  PATIENT_REQUIRED_FIELDS, validateField,
} from '../../utils/profileHelpers';
import { VOICE_PROMPTS, simulateTranscription } from '../../utils/mockTranscription';

const FIELD_ORDER = [
  'fullName', 'dateOfBirth', 'gender', 'email',
  'address.district', 'address.state', 'address.pin',
  'bloodGroup',
  'emergencyContactName', 'emergencyContactPhone',
  'knownAllergies', 'chronicConditions', 'currentMedications',
  'familyDoctorName', 'familyDoctorPhone', 'insuranceInfo',
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

export default function PatientProfileForm({ initialData = {}, onSave, mode = 'setup', phone = '' }) {
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
    PATIENT_REQUIRED_FIELDS.forEach(field => {
      const val = getVal(form, field);
      const result = validateField(field, val);
      if (!result.valid) newErrors[field] = result.error;
    });
    // Optional field validation (email, phones)
    if (form.email) {
      const r = validateField('email', form.email);
      if (!r.valid) newErrors.email = r.error;
    }
    if (form.familyDoctorPhone) {
      const r = validateField('familyDoctorPhone', form.familyDoctorPhone);
      if (!r.valid) newErrors.familyDoctorPhone = r.error;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onSave(form);
  };

  // Voice assistant: advance to next empty required field
  const advanceVoiceField = (fromIdx) => {
    for (let i = fromIdx + 1; i < FIELD_ORDER.length; i++) {
      const val = getVal(form, FIELD_ORDER[i]);
      if (!val || (typeof val === 'string' && !val.trim())) {
        setVoiceFieldIdx(i);
        return;
      }
    }
    // All fields filled
    setVoiceActive(false);
  };

  const handleVoiceRecord = async () => {
    const fieldName = FIELD_ORDER[voiceFieldIdx];
    setVoiceRecording(true);
    // Simulate a short recording
    await new Promise(r => setTimeout(r, 1200));
    setVoiceRecording(false);
    setVoiceTranscribing(true);
    const result = await simulateTranscription(fieldName, 1000);
    if (result) handleChange(fieldName, result);
    setVoiceTranscribing(false);
    advanceVoiceField(voiceFieldIdx);
  };

  const currentPrompt = VOICE_PROMPTS[FIELD_ORDER[voiceFieldIdx]] || 'Please answer...';
  const filledRequired = PATIENT_REQUIRED_FIELDS.filter(f => {
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

              {/* Progress */}
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
            <p className={`font-body text-xs text-warm-gray mt-0.5`}>
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
          <VoiceFormField label="Full Name" name="fullName" value={getVal(form, 'fullName')} onChange={handleChange} required placeholder="Enter your full name" error={errors.fullName} />
          <VoiceFormField label="Date of Birth" name="dateOfBirth" type="date" value={getVal(form, 'dateOfBirth')} onChange={handleChange} required error={errors.dateOfBirth} />
          <VoiceFormField label="Gender" name="gender" type="select" options={GENDERS} value={getVal(form, 'gender')} onChange={handleChange} required placeholder="Select gender" error={errors.gender} />
          <VoiceFormField label="Phone Number" name="phone" type="tel" value={phone} onChange={() => {}} readOnly />
          <VoiceFormField label="Email" name="email" type="email" value={getVal(form, 'email')} onChange={handleChange} placeholder="email@example.com" error={errors.email} />
          <VoiceFormField label="Blood Group" name="bloodGroup" type="select" options={BLOOD_GROUPS} value={getVal(form, 'bloodGroup')} onChange={handleChange} placeholder="Select blood group" />
        </div>
      </div>

      {/* Section: Address */}
      <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden animate-stagger-2">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
            <MapPin size={14} className="text-india-green" />
          </div>
          <h3 className="font-heading font-bold text-dark text-sm">Address</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
          <VoiceFormField label="District" name="address.district" value={getVal(form, 'address.district')} onChange={handleChange} required placeholder="Enter district" error={errors['address.district']} />
          <VoiceFormField label="State" name="address.state" type="select" options={INDIAN_STATES} value={getVal(form, 'address.state')} onChange={handleChange} required placeholder="Select state" error={errors['address.state']} />
          <VoiceFormField label="PIN Code" name="address.pin" type="tel" value={getVal(form, 'address.pin')} onChange={handleChange} required placeholder="6-digit PIN" error={errors['address.pin']} />
        </div>
      </div>

      {/* Section: Emergency Contact */}
      <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden animate-stagger-3">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
            <Phone size={14} className="text-red-500" />
          </div>
          <h3 className="font-heading font-bold text-dark text-sm">Emergency Contact</h3>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <VoiceFormField label="Contact Name" name="emergencyContactName" value={getVal(form, 'emergencyContactName')} onChange={handleChange} required placeholder="Emergency contact name" error={errors.emergencyContactName} />
          <VoiceFormField label="Contact Phone" name="emergencyContactPhone" type="tel" value={getVal(form, 'emergencyContactPhone')} onChange={handleChange} required placeholder="10-digit phone" error={errors.emergencyContactPhone} />
        </div>
      </div>

      {/* Section: Medical Information (Optional) */}
      <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden animate-stagger-4">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
            <Heart size={14} className="text-violet-500" />
          </div>
          <h3 className="font-heading font-bold text-dark text-sm">Medical Information</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-warm-gray font-heading font-medium ml-auto">Optional</span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <VoiceFormField label="Known Allergies" name="knownAllergies" type="textarea" value={getVal(form, 'knownAllergies')} onChange={handleChange} placeholder="e.g., Penicillin, Peanuts" />
          <VoiceFormField label="Chronic Conditions" name="chronicConditions" type="textarea" value={getVal(form, 'chronicConditions')} onChange={handleChange} placeholder="e.g., Diabetes, Hypertension" />
          <VoiceFormField label="Current Medications" name="currentMedications" type="textarea" value={getVal(form, 'currentMedications')} onChange={handleChange} placeholder="e.g., Metformin 500mg" />
          <VoiceFormField label="Insurance Info" name="insuranceInfo" value={getVal(form, 'insuranceInfo')} onChange={handleChange} placeholder="e.g., PMJAY, Star Health" />
        </div>
      </div>

      {/* Section: Family Doctor (Optional) */}
      <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden animate-stagger-5">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center">
            <Pill size={14} className="text-amber-500" />
          </div>
          <h3 className="font-heading font-bold text-dark text-sm">Family Doctor</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-warm-gray font-heading font-medium ml-auto">Optional</span>
        </div>
        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <VoiceFormField label="Doctor Name" name="familyDoctorName" value={getVal(form, 'familyDoctorName')} onChange={handleChange} placeholder="e.g., Dr. Anil Gupta" />
          <VoiceFormField label="Doctor Phone" name="familyDoctorPhone" type="tel" value={getVal(form, 'familyDoctorPhone')} onChange={handleChange} placeholder="10-digit phone" error={errors.familyDoctorPhone} />
        </div>
      </div>

      {/* Required fields counter */}
      <div className="flex items-center justify-between px-1">
        <p className="font-body text-xs text-warm-gray">
          <span className="font-heading font-semibold text-india-green">{filledRequired}</span> / {PATIENT_REQUIRED_FIELDS.length} required fields completed
        </p>
        {filledRequired === PATIENT_REQUIRED_FIELDS.length && (
          <span className="flex items-center gap-1 text-xs text-india-green font-heading font-semibold">
            <CheckCircle size={13} /> Ready to save
          </span>
        )}
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3.5 rounded-xl font-heading font-bold text-sm hover:from-primary-600 hover:to-primary-700 active:scale-[0.99] transition-all shadow-lg shadow-primary-500/20 animate-stagger-6"
      >
        {mode === 'setup' ? 'Complete Profile & Continue' : 'Save Changes'}
      </button>
    </div>
  );
}
