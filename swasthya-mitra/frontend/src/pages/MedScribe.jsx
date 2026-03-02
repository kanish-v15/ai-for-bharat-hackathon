import { useState } from 'react';
import {
  Printer,
  RotateCcw,
  Mic,
  Sparkles,
  Clock,
  CheckCircle,
  AlertTriangle,
  Pill,
  User,
  FileText,
  Activity,
  Volume2,
  Stethoscope,
  Brain,
  Languages,
  FileCheck,
  ClipboardList,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { processMedScribe } from '../services/api';
import VoiceRecorder from '../components/VoiceRecorder';
import AudioPlayer from '../components/AudioPlayer';
import Disclaimer from '../components/Disclaimer';
import LoadingSpinner from '../components/LoadingSpinner';

/* ── Constants ── */

const LOADING_STEPS = {
  hindi: ['ऑडियो अपलोड हो रही है...', 'बातचीत लिखी जा रही है...', 'SOAP नोट्स बन रहे हैं...', 'दवाइयाँ निकाली जा रही हैं...', 'मरीज़ निर्देश बन रहे हैं...'],
  tamil: ['ஆடியோ பதிவேற்றப்படுகிறது...', 'உரையாடல் எழுதப்படுகிறது...', 'SOAP குறிப்புகள் உருவாக்கப்படுகின்றன...', 'மருந்துகள் பிரிக்கப்படுகின்றன...', 'நோயாளி அறிவுறுத்தல்கள் உருவாக்கப்படுகின்றன...'],
  english: ['Uploading audio...', 'Transcribing conversation...', 'Generating SOAP notes...', 'Extracting medications...', 'Creating patient instructions...'],
};

const SOAP_CONFIG = {
  subjective: { label: 'Subjective', icon: User, accentBar: 'accent-bar-primary', accentColor: 'bg-sky-500', tagBg: 'bg-sky-50', tagText: 'text-sky-700', iconColor: 'text-sky-500' },
  objective: { label: 'Objective', icon: Activity, accentBar: 'accent-bar-primary', accentColor: 'bg-emerald-500', tagBg: 'bg-emerald-50', tagText: 'text-emerald-700', iconColor: 'text-emerald-500' },
  assessment: { label: 'Assessment', icon: FileText, accentBar: 'accent-bar-amber', accentColor: 'bg-amber-500', tagBg: 'bg-amber-50', tagText: 'text-amber-700', iconColor: 'text-amber-500' },
  plan: { label: 'Plan', icon: CheckCircle, accentBar: 'accent-bar-rose', accentColor: 'bg-rose-500', tagBg: 'bg-rose-50', tagText: 'text-rose-700', iconColor: 'text-rose-500' },
};

const FLOW_STEPS = [
  { num: 1, label: 'Record', icon: Mic },
  { num: 2, label: 'Transcribe', icon: FileCheck },
  { num: 3, label: 'SOAP Notes', icon: ClipboardList },
  { num: 4, label: 'Instructions', icon: FileText },
];

const PIPELINE_STEPS = [
  { step: 'Speech-to-Text', tech: 'Sarvam AI STT', color: 'bg-primary-500', ring: 'ring-primary-100' },
  { step: 'SOAP Generation', tech: 'Amazon Bedrock (Claude)', color: 'bg-blue-500', ring: 'ring-blue-100' },
  { step: 'Entity Extraction', tech: 'Comprehend Medical', color: 'bg-emerald-500', ring: 'ring-emerald-100' },
  { step: 'Translation', tech: 'Sarvam AI Translate', color: 'bg-purple-500', ring: 'ring-purple-100' },
  { step: 'Text-to-Speech', tech: 'Sarvam AI TTS', color: 'bg-teal-500', ring: 'ring-teal-100' },
];

const SESSION_STATS = [
  { label: 'Avg Time', value: '2.3 min', bg: 'bg-primary-50', text: 'text-primary-700', icon: Clock },
  { label: 'Accuracy', value: '95%+', bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
  { label: 'Languages', value: '8+', bg: 'bg-blue-50', text: 'text-blue-700', icon: Languages },
  { label: 'Notes Today', value: '3', bg: 'bg-purple-50', text: 'text-purple-700', icon: FileText },
];

/* ── Component ── */

export default function MedScribe() {
  const { language } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const currentStep = result ? 4 : isLoading ? 2 : 0;

  const handleRecordingComplete = async (audioBlob) => {
    setIsLoading(true); setLoadingStep(0); setError(null); setResult(null);
    const stepInterval = setInterval(() => { setLoadingStep((s) => Math.min(s + 1, 4)); }, 4000);
    try {
      const data = await processMedScribe(audioBlob, language);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to process consultation. Please try again.');
    } finally { clearInterval(stepInterval); setIsLoading(false); }
  };

  const handlePrint = () => { window.print(); };
  const handleReset = () => { setResult(null); setError(null); };

  return (
    <div className="animate-slide-up space-y-5">

      {/* ─────────────────────── Horizontal Stepper ─────────────────────── */}
      <div className="flex items-center justify-center gap-0">
        {FLOW_STEPS.map(({ num, label, icon: StepIcon }, i) => {
          const isActive = num <= currentStep + 1;
          const isCompleted = num <= currentStep;
          return (
            <div key={num} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isCompleted
                      ? 'bg-india-green text-white shadow-sm shadow-india-green/30'
                      : isActive
                        ? 'bg-primary-500 text-white shadow-sm shadow-primary-500/30'
                        : 'border-2 border-gray-200 text-gray-400 bg-white'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle size={14} strokeWidth={2.5} />
                  ) : (
                    <StepIcon size={13} strokeWidth={2} />
                  )}
                </div>
                <span
                  className={`text-[10px] font-heading font-semibold tracking-wide transition-colors duration-300 ${
                    isCompleted
                      ? 'text-india-green'
                      : isActive
                        ? 'text-primary-600'
                        : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < FLOW_STEPS.length - 1 && (
                <div
                  className={`w-12 h-[2px] rounded-full mx-2 mb-5 transition-all duration-500 ${
                    isCompleted ? 'bg-india-green' : num <= currentStep ? 'bg-primary-300' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ─────────────────────── Main Grid ─────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* ── Left Column (2/3) ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* ── Patient Info Bar ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden animate-stagger-1">
            <div className="px-4 p-3.5 flex flex-wrap items-center gap-3">
              {/* Avatar */}
              <div className="w-10 h-10 bg-gradient-to-br from-primary-400 via-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-white text-xs font-heading font-bold shadow-sm shrink-0">
                RK
              </div>
              {/* Name & visit */}
              <div className="min-w-0">
                <p className="font-heading font-semibold text-dark text-sm leading-tight">Ramesh Kumar</p>
                <p className="text-[11px] text-warm-gray mt-0.5 font-body">Follow-up Visit</p>
              </div>
              {/* Tags */}
              <div className="flex gap-2 flex-wrap ml-auto">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-600 font-heading font-semibold border border-primary-100">Hindi</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-heading font-semibold border border-blue-100">B+ Blood</span>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-heading font-semibold border border-amber-100">Low Hemoglobin</span>
              </div>
            </div>
          </div>

          {/* ── Recording Section (initial state) ── */}
          {!result && !isLoading && (
            <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-primary-300 hover:bg-primary-50/10 transition-all duration-300 overflow-hidden animate-stagger-2">
              <div className="px-6 py-6 flex flex-col items-center text-center">
                {/* Large mic icon */}
                <div className="relative mb-5">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #4243d4 0%, #6872ff 100%)' }}
                  >
                    <Mic size={26} className="text-white" strokeWidth={1.8} />
                  </div>
                  {/* Decorative ring */}
                  <div className="absolute -inset-2 rounded-full border-2 border-primary-200/50 pointer-events-none" />
                </div>

                <h3 className="font-heading font-bold text-dark text-sm mb-1">Record Consultation</h3>
                <p className="font-body text-xs text-warm-gray mb-6 max-w-md leading-relaxed">
                  Record the doctor-patient conversation and let AI generate structured SOAP notes, medication lists, and patient instructions automatically.
                </p>

                {/* Voice Recorder */}
                <div className="w-full max-w-xs">
                  <VoiceRecorder onRecordingComplete={handleRecordingComplete} maxDuration={300} />
                </div>

                {/* Supported formats hint */}
                <div className="mt-5 flex items-center gap-2.5">
                  {[
                    { icon: Stethoscope, label: 'SOAP Notes' },
                    { icon: Pill, label: 'Medications' },
                    { icon: Languages, label: 'Multi-lingual' },
                  ].map(({ icon: HintIcon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 text-[10px] text-warm-gray bg-gray-50 border border-gray-100 px-2 py-1 rounded-full font-body font-medium"
                    >
                      <HintIcon size={10} />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Loading State ── */}
          {isLoading && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-6 animate-stagger-2">
              <LoadingSpinner steps={LOADING_STEPS[language]} currentStep={loadingStep} />
            </div>
          )}

          {/* ── Error State ── */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700 font-body font-medium flex items-center gap-2 animate-stagger-2">
              <AlertTriangle size={14} className="shrink-0" />
              {error}
            </div>
          )}

          {/* ── Results ── */}
          {result && (
            <div className="space-y-4 print:space-y-2" id="medscribe-results">

              {/* Transcription Card */}
              {result.transcription && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden animate-stagger-1">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center">
                      <Mic size={13} className="text-warm-gray" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-dark text-sm">Transcription</h3>
                      <p className="text-[10px] text-warm-gray font-body mt-0.5">Raw consultation transcript</p>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <p className="font-body text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{result.transcription}</p>
                  </div>
                </div>
              )}

              {/* SOAP Notes — 2x2 Grid with accent bars */}
              {result.soap_note && (
                <div className="animate-stagger-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center">
                      <Sparkles size={13} className="text-primary-500" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-dark text-sm">SOAP Notes</h3>
                      <p className="text-[10px] text-warm-gray font-body mt-0.5">AI-generated clinical documentation</p>
                    </div>
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-warm-gray font-heading font-medium border border-gray-100">
                      AI-generated
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    {Object.entries(SOAP_CONFIG).map(([key, { label, icon: SoapIcon, accentColor, tagBg, tagText, iconColor }], idx) => {
                      const content = result.soap_note[key];
                      if (!content) return null;
                      return (
                        <div
                          key={key}
                          className={`bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden card-hover animate-stagger-${idx + 2}`}
                        >
                          {/* Left accent bar + content */}
                          <div className="flex">
                            <div className={`w-1 shrink-0 ${accentColor}`} />
                            <div className="flex-1 p-4">
                              <div className="flex items-center gap-2 mb-2.5">
                                <div className={`w-6 h-6 ${tagBg} rounded-lg flex items-center justify-center`}>
                                  <SoapIcon size={12} className={iconColor} />
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-heading font-semibold ${tagBg} ${tagText}`}>
                                  {label}
                                </span>
                              </div>
                              <p className="font-body text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {content}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Medications Table */}
              {result.medications?.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-premium overflow-hidden animate-stagger-4">
                  <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-primary-50 rounded-lg flex items-center justify-center">
                      <Pill size={13} className="text-primary-500" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-dark text-sm">Medications</h3>
                      <p className="text-[10px] text-warm-gray font-body mt-0.5">Extracted prescription details</p>
                    </div>
                    <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 font-heading font-bold border border-primary-100">
                      {result.medications.length}
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/80">
                          <th className="px-5 py-2.5 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold w-10">#</th>
                          <th className="px-5 py-2.5 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Medication</th>
                          <th className="px-5 py-2.5 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Dosage</th>
                          <th className="px-5 py-2.5 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Frequency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.medications.map((med, i) => (
                          <tr
                            key={i}
                            className={`border-t border-gray-50 hover:bg-primary-50/30 transition-colors ${
                              i % 2 === 1 ? 'bg-gray-50/40' : ''
                            }`}
                          >
                            <td className="px-5 py-3 text-xs text-warm-gray font-heading font-medium">{i + 1}</td>
                            <td className="px-5 py-3 text-xs font-heading font-semibold text-dark">{med.name}</td>
                            <td className="px-5 py-3 text-xs font-body text-gray-600">{med.dosage || '--'}</td>
                            <td className="px-5 py-3 text-xs font-body text-gray-500">{med.frequency || '--'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Patient Instructions */}
              {result.patient_instructions && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 rounded-2xl overflow-hidden shadow-premium animate-stagger-5">
                  <div className="flex">
                    <div className="w-1 shrink-0 bg-india-green" />
                    <div className="flex-1 p-5">
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-7 h-7 bg-emerald-100 rounded-lg flex items-center justify-center">
                          <CheckCircle size={13} className="text-india-green" />
                        </div>
                        <h3 className="font-heading font-bold text-dark text-sm">Patient Instructions</h3>
                      </div>
                      <p className="font-body text-xs text-gray-700 whitespace-pre-wrap leading-relaxed pl-9">
                        {result.patient_instructions_translated || result.patient_instructions}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Patient Instructions Audio */}
              {result.patient_audio_url && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-4 animate-stagger-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center">
                      <Volume2 size={13} className="text-violet-600" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-dark text-sm">Audio Instructions</h3>
                      <p className="text-[10px] text-warm-gray font-body mt-0.5">In patient's preferred language</p>
                    </div>
                  </div>
                  <div className="pl-9">
                    <AudioPlayer audioUrl={result.patient_audio_url} label="Listen to instructions in patient's language" />
                  </div>
                </div>
              )}

              <Disclaimer />

              {/* Action Buttons */}
              <div className="flex gap-3 print:hidden animate-stagger-6">
                <button
                  onClick={handlePrint}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary-500 text-white font-heading font-bold text-xs hover:bg-primary-600 active:scale-[0.98] transition-all shadow-sm shadow-primary-500/20"
                >
                  <Printer size={14} />
                  Print Notes
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-primary-500 text-primary-600 font-heading font-semibold text-xs hover:bg-primary-50 active:scale-[0.98] transition-all"
                >
                  <RotateCcw size={14} />
                  New Session
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Sidebar (1/3) ── */}
        <div className="space-y-4">

          {/* AI Pipeline */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-4 animate-stagger-3">
            <h4 className="font-heading font-bold text-dark text-sm flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-primary-50 rounded-lg flex items-center justify-center">
                <Brain size={12} className="text-primary-500" />
              </div>
              AI Pipeline
            </h4>
            <div className="space-y-0">
              {PIPELINE_STEPS.map(({ step, tech, color, ring }, i) => (
                <div key={step} className="flex items-start gap-2.5">
                  <div className="flex flex-col items-center">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-heading font-bold text-white ${color} ring-4 ${ring} transition-all`}>
                      {i + 1}
                    </span>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div className="w-[2px] h-5 bg-gray-100 my-0.5" />
                    )}
                  </div>
                  <div className="pt-0.5 pb-2.5">
                    <p className="text-[11px] font-heading font-semibold text-dark leading-tight">{step}</p>
                    <p className="text-[10px] font-body text-warm-gray mt-0.5">{tech}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Session Stats — 2x2 grid */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-4 animate-stagger-4">
            <h4 className="font-heading font-bold text-dark text-sm flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-primary-50 rounded-lg flex items-center justify-center">
                <Clock size={12} className="text-primary-500" />
              </div>
              Session Stats
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              {SESSION_STATS.map(({ label, value, bg, text, icon: StatIcon }) => (
                <div key={label} className={`${bg} rounded-xl p-3 text-center card-hover transition-all`}>
                  <div className="flex items-center justify-center mb-1">
                    <StatIcon size={13} className={text} />
                  </div>
                  <span className={`block font-heading font-bold text-sm ${text}`}>{value}</span>
                  <span className="text-[9px] text-warm-gray font-body font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tech Stack Pills */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-premium p-4 animate-stagger-5">
            <h4 className="font-heading font-bold text-dark text-sm flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 bg-primary-50 rounded-lg flex items-center justify-center">
                <Sparkles size={12} className="text-primary-500" />
              </div>
              Powered By
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Sarvam AI', color: 'bg-primary-50 text-primary-600 border-primary-100' },
                { label: 'Amazon Bedrock', color: 'bg-violet-50 text-violet-600 border-violet-100' },
                { label: 'Comprehend Medical', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                { label: 'Amazon Polly', color: 'bg-sky-50 text-sky-600 border-sky-100' },
              ].map(({ label, color }) => (
                <span
                  key={label}
                  className={`text-[10px] px-2.5 py-1 rounded-full border font-heading font-semibold ${color}`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
