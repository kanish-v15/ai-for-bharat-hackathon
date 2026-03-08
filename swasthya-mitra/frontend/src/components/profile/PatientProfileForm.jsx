import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { User, MapPin, Droplets, Phone, Heart, CheckCircle } from 'lucide-react';
import VoiceFormField from './VoiceFormField';
import { useLanguage } from '../../context/LanguageContext';
import {
  BLOOD_GROUPS, GENDERS, INDIAN_STATES,
  PATIENT_REQUIRED_FIELDS, validateField,
} from '../../utils/profileHelpers';

/* ── Questions list (exported for summary panel) ── */
const QUESTIONS = [
  { field: 'fullName' },
  { field: 'dateOfBirth' },
  { field: 'gender' },
  { field: 'email' },
  { field: 'address.district' },
  { field: 'address.state' },
  { field: 'address.pin' },
  { field: 'bloodGroup' },
  { field: 'emergencyContactName' },
  { field: 'emergencyContactPhone' },
  { field: 'knownAllergies' },
  { field: 'chronicConditions' },
  { field: 'currentMedications' },
];

export { QUESTIONS };

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

function PatientProfileFormInner({ initialData = {}, onSave, onFormChange, mode = 'setup', phone = '' }, ref) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ ...initialData });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData && Object.keys(initialData).length) {
      setForm(prev => ({ ...prev, ...initialData }));
    }
  }, []);

  // Notify parent of form changes
  useEffect(() => {
    onFormChange?.(form, null);
  }, [form]);

  // Expose jumpToQuestion for summary panel (scrolls to field)
  useImperativeHandle(ref, () => ({
    jumpToQuestion: (fieldName) => {
      const el = document.querySelector(`[data-field="${fieldName}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.querySelector('input, select')?.focus();
      }
    },
  }), []);

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
    if (form.email) {
      const r = validateField('email', form.email);
      if (!r.valid) newErrors.email = r.error;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Scroll to first error
      const firstError = Object.keys(newErrors)[0];
      const el = document.querySelector(`[data-field="${firstError}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onSave(form);
  };

  const filledRequired = PATIENT_REQUIRED_FIELDS.filter(f => {
    const v = getVal(form, f);
    return v && (typeof v !== 'string' || v.trim());
  }).length;

  return (
    <div className="space-y-5">
      {/* Row 1: Personal (left) + Address (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-premium border border-gray-100 border-t-4 border-t-saffron-400 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-saffron-50 rounded-lg flex items-center justify-center">
              <User size={14} className="text-saffron-500" />
            </div>
            <h3 className="font-heading font-bold text-dark text-sm">{t('profileSetup.formLabels.personalInfo')}</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div data-field="fullName">
              <VoiceFormField label={t('profileSetup.formLabels.fullName')} name="fullName" value={getVal(form, 'fullName')} onChange={handleChange} required placeholder="e.g., Ramesh Kumar" error={errors.fullName} />
            </div>
            <VoiceFormField label={t('profileSetup.formLabels.phoneNumber')} name="phone" type="tel" value={phone} onChange={() => {}} readOnly />
            <div data-field="dateOfBirth">
              <VoiceFormField label={t('profileSetup.formLabels.dateOfBirth')} name="dateOfBirth" value={getVal(form, 'dateOfBirth')} onChange={handleChange} required placeholder="DD/MM/YYYY" error={errors.dateOfBirth} />
            </div>
            <div data-field="gender">
              <VoiceFormField label={t('profileSetup.formLabels.gender')} name="gender" type="select" options={GENDERS} value={getVal(form, 'gender')} onChange={handleChange} required placeholder="Select gender" error={errors.gender} />
            </div>
            <div data-field="email" className="sm:col-span-2">
              <VoiceFormField label={t('profileSetup.formLabels.email')} name="email" type="email" value={getVal(form, 'email')} onChange={handleChange} placeholder="email@example.com" error={errors.email} />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl shadow-premium border border-gray-100 border-t-4 border-t-saffron-400 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-saffron-50 rounded-lg flex items-center justify-center">
              <MapPin size={14} className="text-saffron-500" />
            </div>
            <h3 className="font-heading font-bold text-dark text-sm">{t('profileSetup.formLabels.address')}</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div data-field="address.district" className="sm:col-span-2">
              <VoiceFormField label={t('profileSetup.formLabels.district')} name="address.district" value={getVal(form, 'address.district')} onChange={handleChange} required placeholder="e.g., Chennai, Patna" error={errors['address.district']} />
            </div>
            <div data-field="address.state">
              <VoiceFormField label={t('profileSetup.formLabels.state')} name="address.state" type="select" options={INDIAN_STATES} value={getVal(form, 'address.state')} onChange={handleChange} required placeholder="Select state" error={errors['address.state']} />
            </div>
            <div data-field="address.pin">
              <VoiceFormField label={t('profileSetup.formLabels.pinCode')} name="address.pin" type="tel" value={getVal(form, 'address.pin')} onChange={handleChange} required placeholder="6-digit PIN code" error={errors['address.pin']} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Health (left) + Emergency (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Health Information */}
        <div className="bg-white rounded-2xl shadow-premium border border-gray-100 border-t-4 border-t-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <Droplets size={14} className="text-red-500" />
            </div>
            <h3 className="font-heading font-bold text-dark text-sm">{t('profileSetup.formLabels.healthInfo')}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-warm-gray font-heading font-medium ml-auto">{t('profileSetup.formLabels.optional')}</span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div data-field="bloodGroup">
              <VoiceFormField label={t('profileSetup.formLabels.bloodGroup')} name="bloodGroup" type="select" options={BLOOD_GROUPS} value={getVal(form, 'bloodGroup')} onChange={handleChange} placeholder="Select blood group" />
            </div>
            <div data-field="knownAllergies">
              <VoiceFormField label={t('profileSetup.formLabels.knownAllergies')} name="knownAllergies" value={getVal(form, 'knownAllergies')} onChange={handleChange} placeholder="e.g., Penicillin, Peanuts" />
            </div>
            <div data-field="chronicConditions">
              <VoiceFormField label={t('profileSetup.formLabels.chronicConditions')} name="chronicConditions" value={getVal(form, 'chronicConditions')} onChange={handleChange} placeholder="e.g., Diabetes, Hypertension" />
            </div>
            <div data-field="currentMedications">
              <VoiceFormField label={t('profileSetup.formLabels.currentMedications')} name="currentMedications" value={getVal(form, 'currentMedications')} onChange={handleChange} placeholder="e.g., Metformin 500mg" />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-2xl shadow-premium border border-gray-100 border-t-4 border-t-india-green overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-india-green/10 rounded-lg flex items-center justify-center">
              <Phone size={14} className="text-india-green" />
            </div>
            <h3 className="font-heading font-bold text-dark text-sm">{t('profileSetup.formLabels.emergencyContact')}</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div data-field="emergencyContactName">
              <VoiceFormField label={t('profileSetup.formLabels.contactName')} name="emergencyContactName" value={getVal(form, 'emergencyContactName')} onChange={handleChange} required placeholder="e.g., Priya Kumar" error={errors.emergencyContactName} />
            </div>
            <div data-field="emergencyContactPhone">
              <VoiceFormField label={t('profileSetup.formLabels.contactPhone')} name="emergencyContactPhone" type="tel" value={getVal(form, 'emergencyContactPhone')} onChange={handleChange} required placeholder="10-digit number" error={errors.emergencyContactPhone} />
            </div>
          </div>
        </div>
      </div>

      {/* Required counter + Submit */}
      <div className="flex items-center justify-between px-1">
        <p className="font-body text-xs text-warm-gray">
          <span className="font-heading font-semibold text-india-green">{filledRequired}</span> / {PATIENT_REQUIRED_FIELDS.length} {t('profileSetup.formLabels.required')}
        </p>
        {filledRequired === PATIENT_REQUIRED_FIELDS.length && (
          <span className="flex items-center gap-1 text-xs text-india-green font-heading font-semibold">
            <CheckCircle size={13} /> {t('profileSetup.formLabels.readyToSave')}
          </span>
        )}
      </div>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleSubmit}
          className="px-12 bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3.5 rounded-xl font-heading font-bold text-sm hover:from-primary-600 hover:to-primary-700 active:scale-[0.99] transition-all shadow-lg shadow-primary-500/20"
        >
          <CheckCircle size={16} className="inline mr-2" />
          {mode === 'setup' ? t('profileSetup.formLabels.saveProfileContinue') : t('profileSetup.formLabels.saveChanges')}
        </button>
      </div>
    </div>
  );
}

const PatientProfileForm = forwardRef(PatientProfileFormInner);
export default PatientProfileForm;
