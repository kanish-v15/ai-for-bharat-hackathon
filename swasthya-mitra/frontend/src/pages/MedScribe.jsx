import { useState } from 'react';
import { Printer, RotateCcw } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { processMedScribe } from '../services/api';
import VoiceRecorder from '../components/VoiceRecorder';
import AudioPlayer from '../components/AudioPlayer';
import Disclaimer from '../components/Disclaimer';
import LoadingSpinner from '../components/LoadingSpinner';

const LOADING_STEPS = {
  hindi: ['ऑडियो अपलोड हो रही है...', 'बातचीत लिखी जा रही है...', 'SOAP नोट्स बन रहे हैं...', 'दवाइयाँ निकाली जा रही हैं...', 'मरीज़ निर्देश बन रहे हैं...'],
  tamil: ['ஆடியோ பதிவேற்றப்படுகிறது...', 'உரையாடல் எழுதப்படுகிறது...', 'SOAP குறிப்புகள் உருவாக்கப்படுகின்றன...', 'மருந்துகள் பிரிக்கப்படுகின்றன...', 'நோயாளி அறிவுறுத்தல்கள் உருவாக்கப்படுகின்றன...'],
  english: ['Uploading audio...', 'Transcribing conversation...', 'Generating SOAP notes...', 'Extracting medications...', 'Creating patient instructions...'],
};

const SECTION_LABELS = {
  subjective: { label: 'Subjective', icon: '🗣️', color: 'bg-blue-50 border-blue-200' },
  objective: { label: 'Objective', icon: '🔍', color: 'bg-green-50 border-green-200' },
  assessment: { label: 'Assessment', icon: '📋', color: 'bg-yellow-50 border-yellow-200' },
  plan: { label: 'Plan', icon: '💊', color: 'bg-purple-50 border-purple-200' },
};

export default function MedScribe() {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleRecordingComplete = async (audioBlob) => {
    setIsLoading(true);
    setLoadingStep(0);
    setError(null);
    setResult(null);

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, 4));
    }, 4000);

    try {
      const data = await processMedScribe(audioBlob, language);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process consultation. Please try again.');
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">MedScribe</h1>
        <p className="text-sm text-gray-500">Record consultation to generate SOAP notes</p>
      </div>

      {/* Recording Section */}
      {!result && !isLoading && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600 mb-1">Record the doctor-patient conversation</p>
            <p className="text-xs text-gray-400">Max 5 minutes per recording</p>
          </div>
          <VoiceRecorder onRecordingComplete={handleRecordingComplete} maxDuration={300} />
        </div>
      )}

      {/* Loading */}
      {isLoading && <LoadingSpinner steps={LOADING_STEPS[language]} currentStep={loadingStep} />}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4 print:space-y-2" id="medscribe-results">
          {/* Transcription */}
          {result.transcription && (
            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm">Transcription</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{result.transcription}</p>
            </div>
          )}

          {/* SOAP Notes */}
          {result.soap_note && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-800">SOAP Notes</h3>
              {Object.entries(SECTION_LABELS).map(([key, { label, icon, color }]) => {
                const content = result.soap_note[key];
                if (!content) return null;
                return (
                  <div key={key} className={`${color} border rounded-xl p-4`}>
                    <h4 className="font-semibold text-gray-800 text-sm mb-1">
                      {icon} {label}
                    </h4>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{content}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Medications */}
          {result.medications?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Medications</h3>
              <div className="space-y-2">
                {result.medications.map((med, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-emerald-600 mt-0.5">💊</span>
                    <div>
                      <span className="font-medium text-gray-800">{med.name}</span>
                      {med.dosage && <span className="text-gray-500"> — {med.dosage}</span>}
                      {med.frequency && <span className="text-gray-400"> ({med.frequency})</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patient Instructions */}
          {result.patient_instructions && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Patient Instructions</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {result.patient_instructions_translated || result.patient_instructions}
              </p>
            </div>
          )}

          {/* Patient Instructions Audio */}
          {result.patient_audio_url && (
            <AudioPlayer audioUrl={result.patient_audio_url} label="Listen to instructions" />
          )}

          {/* Disclaimer */}
          <Disclaimer />

          {/* Actions */}
          <div className="flex gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
            >
              <Printer size={18} />
              Print Notes
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-emerald-600 text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors"
            >
              <RotateCcw size={18} />
              New
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
