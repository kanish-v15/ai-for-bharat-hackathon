import { useState, useEffect } from 'react';
import { User, Building2, GraduationCap, Briefcase, CheckCircle } from 'lucide-react';
import VoiceFormField from './VoiceFormField';
import { useLanguage } from '../../context/LanguageContext';
import {
  SPECIALIZATIONS, REGISTRATION_COUNCILS, QUALIFICATIONS,
  INDIAN_STATES, DOCTOR_REQUIRED_FIELDS, validateField,
} from '../../utils/profileHelpers';

function getVal(obj, path) {
  return path.split('.').reduce((acc, k) => acc?.[k], obj) ?? '';
}

function setVal(obj, path, value) {
  const result = { ...obj };
  const keys = path.split('.');
  if (keys.length === 1) { result[keys[0]] = value; }
  else { result[keys[0]] = { ...result[keys[0]], [keys[1]]: value }; }
  return result;
}

export default function DoctorProfileForm({ initialData = {}, onSave, mode = 'setup', phone = '' }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({ ...initialData });
  const [errors, setErrors] = useState({});

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
    if (form.email) {
      const r = validateField('email', form.email);
      if (!r.valid) newErrors.email = r.error;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = Object.keys(newErrors)[0];
      const el = document.querySelector(`[data-field="${firstError}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onSave(form);
  };

  const filledRequired = DOCTOR_REQUIRED_FIELDS.filter(f => {
    const v = getVal(form, f); return v && (typeof v !== 'string' || v.trim());
  }).length;

  return (
    <div className="space-y-5">
      {/* Row 1: Personal (left) + Medical Registration (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden border-t-4 border-t-saffron-400">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
              <User size={14} className="text-primary-500" />
            </div>
            <h3 className="font-heading font-bold text-dark text-sm">{t('profileSetup.formLabels.personalInfo')}</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div data-field="fullName">
              <VoiceFormField label={t('profileSetup.formLabels.fullName')} name="fullName" value={getVal(form, 'fullName')} onChange={handleChange} required placeholder="Dr. Full Name" error={errors.fullName} />
            </div>
            <VoiceFormField label={t('profileSetup.formLabels.phoneNumber')} name="phone" type="tel" value={phone} onChange={() => {}} readOnly />
            <div data-field="email" className="sm:col-span-2">
              <VoiceFormField label={t('profileSetup.formLabels.email')} name="email" type="email" value={getVal(form, 'email')} onChange={handleChange} required placeholder="doctor@hospital.com" error={errors.email} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden border-t-4 border-t-saffron-400">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-saffron-50 rounded-lg flex items-center justify-center">
              <GraduationCap size={14} className="text-saffron-500" />
            </div>
            <h3 className="font-heading font-bold text-dark text-sm">{t('profileSetup.formLabels.medicalRegistration')}</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div data-field="medicalRegNumber">
              <VoiceFormField label={t('profileSetup.formLabels.registrationNumber')} name="medicalRegNumber" value={getVal(form, 'medicalRegNumber')} onChange={handleChange} required placeholder="e.g., MCI-12345" error={errors.medicalRegNumber} />
            </div>
            <div data-field="registrationCouncil">
              <VoiceFormField label={t('profileSetup.formLabels.registrationCouncil')} name="registrationCouncil" type="select" options={REGISTRATION_COUNCILS} value={getVal(form, 'registrationCouncil')} onChange={handleChange} required placeholder="Select council" error={errors.registrationCouncil} />
            </div>
            <div data-field="specialization">
              <VoiceFormField label={t('profileSetup.formLabels.specialization')} name="specialization" type="select" options={SPECIALIZATIONS} value={getVal(form, 'specialization')} onChange={handleChange} required placeholder="Select specialization" error={errors.specialization} />
            </div>
            <div data-field="qualification">
              <VoiceFormField label={t('profileSetup.formLabels.qualification')} name="qualification" type="select" options={QUALIFICATIONS} value={getVal(form, 'qualification')} onChange={handleChange} required placeholder="Select qualification" error={errors.qualification} />
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Clinic (left) + Additional Info (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden border-t-4 border-t-india-green">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-india-green/10 rounded-lg flex items-center justify-center">
              <Building2 size={14} className="text-india-green" />
            </div>
            <h3 className="font-heading font-bold text-dark text-sm">{t('profileSetup.formLabels.clinicHospital')}</h3>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2" data-field="clinicHospitalName">
              <VoiceFormField label={t('profileSetup.formLabels.clinicHospitalName')} name="clinicHospitalName" value={getVal(form, 'clinicHospitalName')} onChange={handleChange} required placeholder="e.g., City Hospital" error={errors.clinicHospitalName} />
            </div>
            <div data-field="clinicAddress.district">
              <VoiceFormField label={t('profileSetup.formLabels.district')} name="clinicAddress.district" value={getVal(form, 'clinicAddress.district')} onChange={handleChange} required placeholder="Enter district" error={errors['clinicAddress.district']} />
            </div>
            <div data-field="clinicAddress.state">
              <VoiceFormField label={t('profileSetup.formLabels.state')} name="clinicAddress.state" type="select" options={INDIAN_STATES} value={getVal(form, 'clinicAddress.state')} onChange={handleChange} required placeholder="Select state" error={errors['clinicAddress.state']} />
            </div>
            <div data-field="clinicAddress.pin">
              <VoiceFormField label={t('profileSetup.formLabels.pinCode')} name="clinicAddress.pin" type="tel" value={getVal(form, 'clinicAddress.pin')} onChange={handleChange} required placeholder="6-digit PIN" error={errors['clinicAddress.pin']} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-premium border border-gray-100 overflow-hidden border-t-4 border-t-india-green">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-india-green/10 rounded-lg flex items-center justify-center">
              <Briefcase size={14} className="text-india-green" />
            </div>
            <h3 className="font-heading font-bold text-dark text-sm">{t('profileSetup.formLabels.additionalInfo')}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-warm-gray font-heading font-medium ml-auto">{t('profileSetup.formLabels.optional')}</span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <VoiceFormField label={t('profileSetup.formLabels.yearsOfExperience')} name="yearsOfExperience" type="tel" value={getVal(form, 'yearsOfExperience')} onChange={handleChange} placeholder="e.g., 12" />
            <VoiceFormField label={t('profileSetup.formLabels.consultationFee')} name="consultationFee" type="tel" value={getVal(form, 'consultationFee')} onChange={handleChange} placeholder="e.g., 500" />
            <VoiceFormField label={t('profileSetup.formLabels.languagesSpoken')} name="availableLanguages" value={getVal(form, 'availableLanguages')} onChange={handleChange} placeholder="e.g., Hindi, English" />
            <VoiceFormField label={t('profileSetup.formLabels.workingHours')} name="workingHours" value={getVal(form, 'workingHours')} onChange={handleChange} placeholder="e.g., Mon-Sat 9AM-5PM" />
          </div>
        </div>
      </div>

      {/* Required counter + Submit */}
      <div className="flex items-center justify-center gap-6">
        <p className="font-body text-xs text-warm-gray">
          <span className="font-heading font-semibold text-india-green">{filledRequired}</span> / {DOCTOR_REQUIRED_FIELDS.length} {t('profileSetup.formLabels.required')}
        </p>
        {filledRequired === DOCTOR_REQUIRED_FIELDS.length && (
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
          {mode === 'setup' ? t('profileSetup.formLabels.completeProfileContinue') : t('profileSetup.formLabels.saveChanges')}
        </button>
      </div>
    </div>
  );
}
