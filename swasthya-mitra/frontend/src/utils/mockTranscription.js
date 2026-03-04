/* ── Mock Transcription Engine ── */
/* Simulates speech-to-text for voice form fill. Returns plausible Indian values per field. */

const MOCK_RESPONSES = {
  fullName: ['Ramesh Kumar', 'Anita Patel', 'Suresh Sharma', 'Priya Verma', 'Vikram Singh', 'Lakshmi Nair'],
  dateOfBirth: ['1985-06-15', '1990-03-22', '1978-11-08', '1995-01-30', '1988-07-14'],
  gender: ['male', 'female', 'male', 'female'],
  email: ['ramesh.kumar@gmail.com', 'anita.patel@yahoo.com', 'suresh.sharma@outlook.com'],
  'address.district': ['Pune', 'Chennai', 'Bengaluru', 'Jaipur', 'Lucknow', 'Hyderabad', 'Kochi', 'Patna'],
  'address.state': ['Maharashtra', 'Tamil Nadu', 'Karnataka', 'Rajasthan', 'Uttar Pradesh', 'Kerala', 'Bihar'],
  'address.pin': ['411001', '600001', '560001', '302001', '226001', '682001', '800001'],
  bloodGroup: ['B+', 'A+', 'O+', 'AB+', 'O-', 'A-'],
  knownAllergies: ['Penicillin', 'Dust allergy', 'No known allergies', 'Sulfa drugs', 'Peanuts'],
  chronicConditions: ['Type 2 Diabetes', 'Hypertension', 'None', 'Asthma', 'Thyroid'],
  currentMedications: ['Metformin 500mg', 'None', 'Amlodipine 5mg', 'Levothyroxine 50mcg'],
  emergencyContactName: ['Sunita Kumar', 'Rajesh Patel', 'Meena Sharma', 'Arun Verma'],
  emergencyContactPhone: ['9876543211', '9845123456', '9912345678', '9765432100'],
  familyDoctorName: ['Dr. Anil Gupta', 'Dr. Meera Reddy', 'Dr. Sanjay Joshi', ''],
  familyDoctorPhone: ['9876500001', '9845100002', '9912300003', ''],
  insuranceInfo: ['PMJAY - Ayushman Bharat', 'Star Health Insurance', 'None', 'ICICI Lombard'],
  medicalRegNumber: ['MH-12345', 'TN-67890', 'KA-11223', 'DL-44556'],
  registrationCouncil: ['Maharashtra Medical Council', 'Tamil Nadu Medical Council', 'Karnataka Medical Council'],
  specialization: ['General Medicine', 'Pediatrics', 'Cardiology', 'Dermatology', 'Orthopedics'],
  qualification: ['MBBS', 'MBBS, MD', 'MBBS, MS', 'BDS', 'BAMS'],
  clinicHospitalName: ['City Hospital', 'Apollo Clinic', 'Fortis Healthcare', 'Government PHC'],
  'clinicAddress.district': ['Mumbai', 'Chennai', 'Bengaluru', 'Delhi', 'Pune'],
  'clinicAddress.state': ['Maharashtra', 'Tamil Nadu', 'Karnataka', 'Delhi', 'Maharashtra'],
  'clinicAddress.pin': ['400001', '600002', '560002', '110001', '411002'],
  yearsOfExperience: ['5', '12', '8', '20', '3'],
  consultationFee: ['500', '300', '800', '1000', '200'],
  workingHours: ['9:00 AM - 5:00 PM', '10:00 AM - 6:00 PM', '8:00 AM - 2:00 PM', '4:00 PM - 9:00 PM'],
};

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Simulate speech-to-text transcription for a specific form field.
 * Returns a plausible mock value after a simulated delay.
 */
export function simulateTranscription(fieldName, delay = 1500) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const responses = MOCK_RESPONSES[fieldName];
      if (responses) {
        resolve(randomPick(responses));
      } else {
        resolve('');
      }
    }, delay);
  });
}

/** Voice assistant prompts per field */
export const VOICE_PROMPTS = {
  fullName: 'Please tell me your full name',
  dateOfBirth: 'What is your date of birth?',
  gender: 'What is your gender?',
  email: 'What is your email address?',
  'address.district': 'Which district do you live in?',
  'address.state': 'Which state are you from?',
  'address.pin': 'What is your area PIN code?',
  bloodGroup: 'Do you know your blood group?',
  knownAllergies: 'Do you have any known allergies?',
  chronicConditions: 'Do you have any chronic conditions like diabetes or blood pressure?',
  currentMedications: 'Are you currently taking any medications?',
  emergencyContactName: 'Who should we contact in an emergency?',
  emergencyContactPhone: "What is your emergency contact's phone number?",
  familyDoctorName: "What is your family doctor's name?",
  familyDoctorPhone: "What is your family doctor's phone number?",
  insuranceInfo: 'Do you have any health insurance?',
  medicalRegNumber: 'What is your medical registration number?',
  registrationCouncil: 'Which medical council are you registered with?',
  specialization: 'What is your specialization?',
  qualification: 'What is your highest medical qualification?',
  clinicHospitalName: 'What is the name of your clinic or hospital?',
  'clinicAddress.district': 'Which district is your clinic located in?',
  'clinicAddress.state': 'Which state is your clinic in?',
  'clinicAddress.pin': "What is your clinic's PIN code?",
  yearsOfExperience: 'How many years of experience do you have?',
  consultationFee: 'What is your consultation fee?',
  workingHours: 'What are your working hours?',
};
