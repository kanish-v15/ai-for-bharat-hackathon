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

export function clearAllData() {
  localStorage.removeItem(STORAGE_KEY);
}

function generateTitle(type, data) {
  switch (type) {
    case 'lab_report': {
      const params = data.parameters || [];
      if (params.length > 0) {
        const names = params.slice(0, 3).map(p => p.name).join(', ');
        return params.length > 3 ? `${names}...` : names;
      }
      return 'Lab Report Analysis';
    }
    case 'care_guide':
      return (data.answer || data.answer_translated || 'Health Question').substring(0, 60);
    case 'medscribe':
      return data.soap_note?.assessment?.substring(0, 60) || 'Consultation Notes';
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
