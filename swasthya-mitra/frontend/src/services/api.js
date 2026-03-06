import axios from 'axios';
import { API_BASE } from '../utils/constants';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 120000, // 2 minutes for long processing (MedScribe)
});

// Lab Samjho API
export async function analyzeLabReport(imageFile, language, userId = 'demo-user') {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('language', language);
  formData.append('user_id', userId);

  const { data } = await api.post('/lab-samjho/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function askLabQuestion(question, analysisContext, language) {
  const { data } = await api.post('/lab-samjho/ask', {
    question,
    analysis_context: JSON.stringify(analysisContext),
    language,
  });
  return data;
}

// Care Guide API
export async function askCareGuide(audioBlob, language, userId = 'demo-user', sessionId = null) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');
  formData.append('language', language);
  formData.append('user_id', userId);
  if (sessionId) formData.append('session_id', sessionId);

  const { data } = await api.post('/care-guide/ask', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function askCareGuideText(text, language, userId = 'demo-user', sessionId = null) {
  const { data } = await api.post('/care-guide/ask-text', {
    text,
    language,
    user_id: userId,
    session_id: sessionId,
  });
  return data;
}

// MedScribe API
export async function processMedScribe(audioBlob, language, doctorId = 'demo-doctor', patientId = null) {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'consultation.webm');
  formData.append('language', language);
  formData.append('doctor_id', doctorId);
  if (patientId) formData.append('patient_id', patientId);

  const { data } = await api.post('/medscribe/process', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function processMedScribeText(text, language, doctorId = 'demo-doctor', patientId = null) {
  const { data } = await api.post('/medscribe/process-text', {
    text,
    language,
    doctor_id: doctorId,
    patient_id: patientId,
  });
  return data;
}

export async function updateMedScribe(interactionId, soapNote, confirmedMedications) {
  const { data } = await api.put(`/medscribe/update/${interactionId}`, {
    soap_note: soapNote,
    confirmed_medications: confirmedMedications,
  });
  return data;
}

// History API
export async function getUserHistory(userId = 'demo-user') {
  const { data } = await api.get(`/history/${userId}`);
  return data;
}

export default api;
