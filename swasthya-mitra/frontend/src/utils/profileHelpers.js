/* ── Profile Helpers ── */

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
  'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman & Nicobar Islands', 'Chandigarh', 'Dadra & Nagar Haveli and Daman & Diu',
  'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const SPECIALIZATIONS = [
  'General Medicine', 'Pediatrics', 'Cardiology', 'Dermatology',
  'Orthopedics', 'Gynecology', 'ENT', 'Ophthalmology',
  'Psychiatry', 'Neurology', 'Pulmonology', 'Gastroenterology',
  'Nephrology', 'Urology', 'Oncology', 'Endocrinology',
  'Rheumatology', 'Dentistry', 'Ayurveda', 'Homeopathy', 'Other',
];

export const REGISTRATION_COUNCILS = [
  'Andhra Pradesh Medical Council', 'Assam Medical Council',
  'Bihar Medical Council', 'Chhattisgarh Medical Council',
  'Delhi Medical Council', 'Goa Medical Council',
  'Gujarat Medical Council', 'Haryana Medical Council',
  'Himachal Pradesh Medical Council', 'Jharkhand Medical Council',
  'Karnataka Medical Council', 'Kerala Medical Council',
  'Madhya Pradesh Medical Council', 'Maharashtra Medical Council',
  'Manipur Medical Council', 'Meghalaya Medical Council',
  'Odisha Medical Council', 'Punjab Medical Council',
  'Rajasthan Medical Council', 'Tamil Nadu Medical Council',
  'Telangana Medical Council', 'Uttar Pradesh Medical Council',
  'West Bengal Medical Council', 'National Medical Commission (NMC)',
];

export const QUALIFICATIONS = [
  'MBBS', 'MD', 'MS', 'MBBS, MD', 'MBBS, MS',
  'BDS', 'MDS', 'BAMS', 'BHMS', 'BUMS',
  'DNB', 'DM', 'MCh', 'Other',
];

/* ── Required fields ── */

export const PATIENT_REQUIRED_FIELDS = [
  'fullName', 'dateOfBirth', 'gender',
  'address.district', 'address.state', 'address.pin',
  'emergencyContactName', 'emergencyContactPhone',
];

export const PATIENT_OPTIONAL_FIELDS = [
  'email', 'bloodGroup', 'knownAllergies', 'chronicConditions',
  'currentMedications', 'familyDoctorName', 'familyDoctorPhone', 'insuranceInfo',
];

export const DOCTOR_REQUIRED_FIELDS = [
  'fullName', 'medicalRegNumber', 'registrationCouncil',
  'specialization', 'qualification', 'email',
  'clinicHospitalName',
  'clinicAddress.district', 'clinicAddress.state', 'clinicAddress.pin',
];

export const DOCTOR_OPTIONAL_FIELDS = [
  'yearsOfExperience', 'consultationFee', 'availableLanguages', 'workingHours',
];

/* ── Default profile objects ── */

export function getProfileDefaults(role) {
  if (role === 'doctor') {
    return {
      fullName: '',
      medicalRegNumber: '',
      registrationCouncil: '',
      specialization: '',
      qualification: '',
      email: '',
      clinicHospitalName: '',
      clinicAddress: { district: '', state: '', pin: '' },
      yearsOfExperience: '',
      consultationFee: '',
      availableLanguages: [],
      workingHours: '',
    };
  }
  return {
    fullName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    address: { district: '', state: '', pin: '' },
    bloodGroup: '',
    knownAllergies: '',
    chronicConditions: '',
    currentMedications: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    familyDoctorName: '',
    familyDoctorPhone: '',
    insuranceInfo: '',
  };
}

/* ── Get nested value ── */

function getNestedValue(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj);
}

/* ── Validation ── */

export function validateField(fieldName, value) {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, error: 'This field is required' };
  }
  const v = typeof value === 'string' ? value.trim() : value;

  if (fieldName.includes('Phone') || fieldName === 'emergencyContactPhone' || fieldName === 'familyDoctorPhone') {
    if (!/^\d{10}$/.test(v)) return { valid: false, error: 'Enter a valid 10-digit phone number' };
  }
  if (fieldName === 'address.pin' || fieldName === 'clinicAddress.pin') {
    if (!/^\d{6}$/.test(v)) return { valid: false, error: 'Enter a valid 6-digit PIN code' };
  }
  if (fieldName === 'email') {
    if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { valid: false, error: 'Enter a valid email address' };
  }
  if (fieldName === 'dateOfBirth') {
    // Support DD/MM/YYYY format
    const ddmmyyyy = /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/.exec(v);
    let d;
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      // Verify the date components match (catches invalid dates like 31/02/2000)
      if (d.getDate() !== parseInt(day) || d.getMonth() !== parseInt(month) - 1) {
        return { valid: false, error: 'Enter a valid date (DD/MM/YYYY)' };
      }
    } else {
      d = new Date(v);
    }
    if (isNaN(d.getTime())) return { valid: false, error: 'Enter a valid date (DD/MM/YYYY)' };
    if (d > new Date()) return { valid: false, error: 'Date cannot be in the future' };
    if (d < new Date('1900-01-01')) return { valid: false, error: 'Date seems too old' };
  }
  return { valid: true, error: '' };
}

/* ── Completion calculation ── */

export function calculateProfileCompletion(role, profile) {
  if (!profile) return { percentage: 0, filledCount: 0, totalCount: 0, missingRequired: [] };

  const requiredFields = role === 'doctor' ? DOCTOR_REQUIRED_FIELDS : PATIENT_REQUIRED_FIELDS;
  const optionalFields = role === 'doctor' ? DOCTOR_OPTIONAL_FIELDS : PATIENT_OPTIONAL_FIELDS;
  const allFields = [...requiredFields, ...optionalFields];

  let filledCount = 0;
  const missingRequired = [];

  allFields.forEach(field => {
    const val = getNestedValue(profile, field);
    if (val && (typeof val !== 'string' || val.trim())) {
      filledCount++;
    } else if (requiredFields.includes(field)) {
      missingRequired.push(field);
    }
  });

  return {
    percentage: Math.round((filledCount / allFields.length) * 100),
    filledCount,
    totalCount: allFields.length,
    missingRequired,
  };
}

export function isProfileComplete(role, profile) {
  if (!profile) return false;
  const requiredFields = role === 'doctor' ? DOCTOR_REQUIRED_FIELDS : PATIENT_REQUIRED_FIELDS;
  return requiredFields.every(field => {
    const val = getNestedValue(profile, field);
    return val && (typeof val !== 'string' || val.trim());
  });
}

/* ── Field display labels ── */

export const FIELD_LABELS = {
  fullName: 'Full Name',
  dateOfBirth: 'Date of Birth',
  gender: 'Gender',
  email: 'Email',
  'address.district': 'District',
  'address.state': 'State',
  'address.pin': 'PIN Code',
  bloodGroup: 'Blood Group',
  knownAllergies: 'Known Allergies',
  chronicConditions: 'Chronic Conditions',
  currentMedications: 'Current Medications',
  emergencyContactName: 'Emergency Contact Name',
  emergencyContactPhone: 'Emergency Contact Phone',
  familyDoctorName: 'Family Doctor Name',
  familyDoctorPhone: 'Family Doctor Phone',
  insuranceInfo: 'Insurance Info (PMJAY / Private)',
  medicalRegNumber: 'Medical Registration Number',
  registrationCouncil: 'Registration Council',
  specialization: 'Specialization',
  qualification: 'Qualification',
  clinicHospitalName: 'Clinic / Hospital Name',
  'clinicAddress.district': 'Clinic District',
  'clinicAddress.state': 'Clinic State',
  'clinicAddress.pin': 'Clinic PIN Code',
  yearsOfExperience: 'Years of Experience',
  consultationFee: 'Consultation Fee',
  availableLanguages: 'Available Languages',
  workingHours: 'Working Hours',
};
