const STORAGE_KEY = 'swasthya-interactions';

export function saveInteraction(type, data) {
  // type: 'lab_report' | 'care_guide' | 'medscribe'
  // data: the API response object
  const interactions = getInteractions();
  const interaction = {
    id: data.interaction_id || data.session_id || Date.now().toString(),
    type,
    title: generateTitle(type, data),
    summary: generateSummary(type, data),
    date: new Date().toISOString(),
    data, // full response for detail views
  };
  interactions.unshift(interaction);
  // Keep max 100 interactions
  localStorage.setItem(STORAGE_KEY, JSON.stringify(interactions.slice(0, 100)));
  return interaction;
}

export function getInteractions(type = null) {
  const raw = localStorage.getItem(STORAGE_KEY);
  const interactions = raw ? JSON.parse(raw) : [];
  if (type) return interactions.filter(i => i.type === type);
  return interactions;
}

export function getDashboardStats() {
  const all = getInteractions();
  const labReports = all.filter(i => i.type === 'lab_report');
  const questions = all.filter(i => i.type === 'care_guide');
  const consultations = all.filter(i => i.type === 'medscribe');

  // Count flagged parameters from lab reports
  let normalCount = 0, borderlineCount = 0, criticalCount = 0;
  labReports.forEach(r => {
    (r.data?.parameters || []).forEach(p => {
      if (p.classification === 'Normal') normalCount++;
      else if (p.classification === 'Borderline') borderlineCount++;
      else if (p.classification === 'Abnormal') criticalCount++;
    });
  });

  return {
    totalReports: labReports.length,
    totalQuestions: questions.length,
    totalConsultations: consultations.length,
    totalInteractions: all.length,
    recentActivity: all.slice(0, 5),
    chartData: { normal: normalCount, borderline: borderlineCount, critical: criticalCount },
  };
}

export function getLastLabReport() {
  const reports = getInteractions('lab_report');
  return reports.length > 0 ? reports[0] : null;
}

export function deleteInteraction(id) {
  const interactions = getInteractions();
  const filtered = interactions.filter(i => i.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(PATIENTS_KEY);
}

/* ═══════════════════════════════════════════
   Patient Management (Doctor's patient roster)
   ═══════════════════════════════════════════ */
const PATIENTS_KEY = 'swasthya-patients';

export function getPatients() {
  const raw = localStorage.getItem(PATIENTS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function getPatient(id) {
  return getPatients().find(p => p.id === id) || null;
}

export function savePatient(patient) {
  const patients = getPatients();
  if (patient.id) {
    // Update existing
    const idx = patients.findIndex(p => p.id === patient.id);
    if (idx >= 0) {
      patients[idx] = { ...patients[idx], ...patient };
      localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
      return patients[idx];
    }
  }
  // Create new
  const newPatient = {
    ...patient,
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    consultations: patient.consultations || [],
    labReports: patient.labReports || [],
    createdAt: new Date().toISOString(),
  };
  patients.unshift(newPatient);
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients.slice(0, 50)));
  return newPatient;
}

export function deletePatientRecord(id) {
  const patients = getPatients().filter(p => p.id !== id);
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
}

export function addConsultationToPatient(patientId, data) {
  const patients = getPatients();
  const patient = patients.find(p => p.id === patientId);
  if (!patient) return null;

  const consultation = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
    date: new Date().toISOString(),
    soap_note: data.soap_note,
    medications: data.medications,
    patient_instructions: data.patient_instructions,
    patient_instructions_translated: data.patient_instructions_translated,
    patient_audio_url: data.patient_audio_url,
    transcription: data.transcription,
    language: data.language,
    interaction_id: data.interaction_id,
  };
  if (!patient.consultations) patient.consultations = [];
  patient.consultations.unshift(consultation);
  // Keep max 50 consultations per patient
  patient.consultations = patient.consultations.slice(0, 50);
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
  return consultation;
}

export function getPatientConsultations(patientId) {
  const patient = getPatient(patientId);
  return patient?.consultations || [];
}

export function addLabReportToPatient(patientId, reportData) {
  const patients = getPatients();
  const patient = patients.find(p => p.id === patientId);
  if (!patient) return null;
  const report = {
    id: reportData.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString()),
    date: reportData.date || new Date().toISOString(),
    title: reportData.title || 'Lab Report',
    summary: reportData.summary || '',
    parameters: reportData.data?.parameters || reportData.parameters || [],
    data: reportData.data || reportData,
  };
  if (!patient.labReports) patient.labReports = [];
  patient.labReports.unshift(report);
  patient.labReports = patient.labReports.slice(0, 30);
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
  return report;
}

export function removeLabReportFromPatient(patientId, reportId) {
  const patients = getPatients();
  const patient = patients.find(p => p.id === patientId);
  if (!patient) return;
  patient.labReports = (patient.labReports || []).filter(r => r.id !== reportId);
  localStorage.setItem(PATIENTS_KEY, JSON.stringify(patients));
}

export function seedDemoPatients() {
  if (getPatients().length > 0) return;
  const demo = [
    { name: 'Ramesh Kumar', age: 45, gender: 'Male', phone: '9876543210', language: 'hindi', bloodGroup: 'B+', allergies: 'Penicillin', conditions: 'Hypertension', medications: 'Amlodipine 5mg' },
    { name: 'Sunita Patel', age: 32, gender: 'Female', phone: '9876543211', language: 'tamil', bloodGroup: 'O+', allergies: '', conditions: '', medications: '' },
    { name: 'Meena Rao', age: 58, gender: 'Female', phone: '9876543212', language: 'english', bloodGroup: 'A+', allergies: '', conditions: 'Diabetes Type 2', medications: 'Metformin 500mg' },
  ];
  demo.forEach(p => savePatient(p));
}

function generateTitle(type, data) {
  switch (type) {
    case 'lab_report': {
      // Prefer file name, then parameter names
      if (data.fileName) return data.fileName;
      const params = data.parameters || [];
      if (params.length > 0) {
        const names = params.slice(0, 3).map(p => p.name).join(', ');
        return params.length > 3 ? `${names}...` : names;
      }
      return 'Lab Report';
    }
    case 'care_guide':
      return (data.answer || data.answer_translated || 'Health Question').substring(0, 60);
    case 'medscribe': {
      // Show patient name + assessment
      const patient = data.patient_name || '';
      const assessment = data.soap_note?.assessment?.substring(0, 40) || 'Consultation';
      return patient ? `${patient} — ${assessment}` : assessment;
    }
    default:
      return 'Interaction';
  }
}

function generateSummary(type, data) {
  switch (type) {
    case 'lab_report':
      return data.summary || `${(data.parameters || []).length} parameters analyzed`;
    case 'care_guide':
      return (data.answer_translated || data.answer || '').substring(0, 100);
    case 'medscribe':
      return data.soap_note?.subjective?.substring(0, 100) || 'Consultation documented';
    default:
      return '';
  }
}
