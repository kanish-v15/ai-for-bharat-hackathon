import { useState, useRef } from 'react';
import {
  Upload,
  Camera,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Volume2,
  Download,
  RotateCcw,
  Sparkles,
  Info,
  ImageIcon,
  FileScan,
  ArrowRight,
  Activity,
  TrendingUp,
  Shield,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import { analyzeLabReport } from '../services/api';
import { saveInteraction, getInteractions } from '../services/dataStore';
import AudioPlayer from '../components/AudioPlayer';
import Disclaimer from '../components/Disclaimer';
import LoadingSpinner from '../components/LoadingSpinner';
import { CLASSIFICATION_COLORS } from '../utils/constants';

const LOADING_STEPS = {
  hindi: ['रिपोर्ट अपलोड हो रही है...', 'रिपोर्ट पढ़ी जा रही है...', 'पैरामीटर का विश्लेषण...', 'हिंदी में अनुवाद...', 'ऑडियो बनाया जा रहा है...'],
  tamil: ['அறிக்கை பதிவேற்றப்படுகிறது...', 'அறிக்கை படிக்கப்படுகிறது...', 'அளவுருக்கள் பகுப்பாய்வு...', 'தமிழில் மொழிபெயர்ப்பு...', 'ஆடியோ உருவாக்கப்படுகிறது...'],
  english: ['Uploading report...', 'Reading your report...', 'Analyzing parameters...', 'Translating...', 'Generating audio...'],
  telugu: ['నివేదిక అప్‌లోడ్ అవుతోంది...', 'నివేదిక చదవబడుతోంది...', 'పరామితులు విశ్లేషించబడుతున్నాయి...', 'అనువాదం...', 'ఆడియో తయారు చేస్తోంది...'],
  kannada: ['ವರದಿ ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ...', 'ವರದಿ ಓದಲಾಗುತ್ತಿದೆ...', 'ನಿಯತಾಂಕಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...', 'ಅನುವಾದಿಸುತ್ತಿದೆ...', 'ಆಡಿಯೋ ರಚಿಸುತ್ತಿದೆ...'],
  malayalam: ['റിപ്പോർട്ട് അപ്‌ലോഡ് ചെയ്യുന്നു...', 'റിപ്പോർട്ട് വായിക്കുന്നു...', 'പരാമീറ്ററുകൾ വിശകലനം ചെയ്യുന്നു...', 'വിവർത്തനം ചെയ്യുന്നു...', 'ഓഡിയോ സൃഷ്ടിക്കുന്നു...'],
  bengali: ['রিপোর্ট আপলোড হচ্ছে...', 'রিপোর্ট পড়া হচ্ছে...', 'প্যারামিটার বিশ্লেষণ হচ্ছে...', 'অনুবাদ হচ্ছে...', 'অডিও তৈরি হচ্ছে...'],
  marathi: ['अहवाल अपलोड होत आहे...', 'अहवाल वाचला जात आहे...', 'पॅरामीटर्सचे विश्लेषण...', 'अनुवाद करत आहे...', 'ऑडिओ तयार करत आहे...'],
  gujarati: ['રિપોર્ટ અપલોડ થઈ રહ્યો છે...', 'રિપોર્ટ વાંચાઈ રહ્યો છે...', 'પેરામીટર્સનું વિશ્લેષણ...', 'અનુવાદ થઈ રહ્યો છે...', 'ઓડિયો બનાવાઈ રહ્યો છે...'],
};

const FLOW_STEPS = [
  { num: 1, label: 'Upload' },
  { num: 2, label: 'AI Analysis' },
  { num: 3, label: 'Results' },
  { num: 4, label: 'Audio' },
];

const HOW_IT_WORKS = [
  'Upload or photograph your report',
  'AI extracts text using Amazon Textract',
  'Amazon Bedrock analyzes values',
  'Get explanation in your language',
];

export default function LabSamjho() {
  const { language } = useLanguage();
  const { addNotification } = useNotifications();
  const fileInputRef = useRef(null);
  const previousReports = getInteractions('lab_report').slice(0, 5);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const currentStep = result ? 4 : isLoading ? 2 : previewUrl ? 1 : 0;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) { setError('Please upload a JPEG, PNG, or PDF file.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('File is too large. Maximum size is 10MB.'); return; }
    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;
    setIsLoading(true); setLoadingStep(0); setError(null);
    const stepInterval = setInterval(() => { setLoadingStep((s) => Math.min(s + 1, 4)); }, 3000);
    try {
      const data = await analyzeLabReport(selectedImage, language);
      setResult(data);
      saveInteraction('lab_report', data);
      const paramCount = data.parameters?.length || 0;
      const flagged = data.parameters?.filter(p => p.classification !== 'Normal').length || 0;
      addNotification('Lab report analyzed', `${paramCount} parameters found, ${flagged} flagged`, flagged > 0 ? 'warning' : 'success', '/lab-samjho');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to analyze report. Please try again.');
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null); setPreviewUrl(null); setResult(null); setError(null);
  };

  const normalCount = result?.parameters?.filter(p => p.classification === 'Normal').length || 0;
  const flaggedCount = result?.parameters?.filter(p => p.classification !== 'Normal').length || 0;

  return (
    <div className="animate-slide-up">
      {/* ── Page Header ── */}
      <div className="mb-3 animate-stagger-1">
        <h1 className="font-display text-xl text-dark tracking-tight leading-tight">
          Lab <span className="italic text-primary-500">Samjho</span>
        </h1>
        <p className="font-body text-warm-gray text-xs mt-0.5 max-w-lg">
          Upload your lab report for AI-powered analysis in your language.
        </p>
      </div>

      {/* ── Horizontal Stepper ── */}
      <div className="animate-stagger-2 mb-4">
        <div className="flex items-center justify-center">
          {FLOW_STEPS.map(({ num, label }, i) => {
            const isCompleted = num <= currentStep;
            const isActive = num === currentStep + 1;

            return (
              <div key={num} className="flex items-center">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`
                      w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-heading font-bold
                      transition-all duration-500 ease-out
                      ${isCompleted
                        ? 'bg-india-green text-white shadow-sm shadow-india-green/20'
                        : isActive
                          ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30 ring-2 ring-primary-100'
                          : 'bg-cream-dark text-warm-gray/50'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle size={12} strokeWidth={2.5} />
                    ) : (
                      <span>{num}</span>
                    )}
                  </div>
                  <span
                    className={`
                      text-[9px] font-heading font-semibold tracking-wide uppercase transition-colors duration-300
                      ${isCompleted
                        ? 'text-india-green'
                        : isActive
                          ? 'text-primary-600'
                          : 'text-warm-gray/40'
                      }
                    `}
                  >
                    {label}
                  </span>
                </div>

                {i < FLOW_STEPS.length - 1 && (
                  <div className="relative w-10 sm:w-16 h-0.5 mx-1.5 mb-5">
                    <div className="absolute inset-0 bg-cream-dark rounded-full" />
                    <div
                      className={`
                        absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out
                        ${isCompleted ? 'bg-india-green w-full' : 'bg-cream-dark w-0'}
                      `}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* ── Left Column (2/3) ── */}
        <div className="lg:col-span-2 space-y-3">

          {/* ── Upload Area ── */}
          {!result && !isLoading && (
            <div className="animate-stagger-3">
              <div
                className={`
                  noise card-hover bg-white rounded-2xl overflow-hidden shadow-premium
                  border-2 border-dashed
                  ${previewUrl ? 'border-primary-300 bg-primary-50/10' : 'border-cream-dark hover:border-primary-300'}
                  transition-all duration-300
                `}
              >
                {previewUrl ? (
                  <div className="p-4 space-y-3">
                    {/* Preview */}
                    <div className="relative rounded-xl overflow-hidden bg-cream ring-1 ring-cream-dark">
                      {selectedImage?.type === 'application/pdf' ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2">
                          <FileScan size={36} className="text-primary-500" />
                          <p className="text-xs font-heading font-semibold text-dark">{selectedImage.name}</p>
                          <p className="text-[10px] font-body text-warm-gray">PDF document ready</p>
                        </div>
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Lab report preview"
                          className="w-full max-h-56 object-contain"
                        />
                      )}
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center gap-1 text-[9px] font-heading font-semibold bg-white/90 backdrop-blur-sm text-india-green px-2 py-0.5 rounded-full shadow-sm ring-1 ring-india-green/10">
                          <CheckCircle size={10} />
                          Ready
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={handleAnalyze}
                        disabled={isLoading}
                        className="
                          flex-1 bg-gradient-to-r from-primary-500 to-primary-600 text-white
                          px-4 py-2.5 rounded-xl font-heading font-bold text-xs
                          hover:from-primary-600 hover:to-primary-700
                          active:scale-[0.98] disabled:opacity-50
                          transition-all duration-200
                          flex items-center justify-center gap-2
                          shadow-lg shadow-primary-500/25
                        "
                      >
                        <Sparkles size={14} />
                        Analyze Report
                      </button>
                      <button
                        onClick={handleReset}
                        disabled={isLoading}
                        className="
                          px-3 py-2.5 rounded-xl
                          border border-cream-dark text-warm-gray font-heading font-semibold text-xs
                          hover:bg-cream hover:border-warm-gray/30
                          active:scale-[0.98] disabled:opacity-50
                          transition-all duration-200
                        "
                      >
                        <RotateCcw size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-4 flex flex-col items-center gap-2 cursor-pointer group"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20 group-hover:shadow-lg group-hover:scale-105 transition-all duration-300">
                        <Upload size={16} className="text-white" strokeWidth={1.8} />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-india-green rounded-md flex items-center justify-center shadow-sm">
                        <Sparkles size={8} className="text-white" />
                      </div>
                    </div>

                    <div className="text-center space-y-0.5">
                      <p className="font-heading font-bold text-xs text-dark tracking-tight">
                        Upload Your Lab Report
                      </p>
                      <p className="font-body text-[10px] text-warm-gray">
                        Photo, JPEG, PNG, or PDF
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {[
                        { icon: Camera, label: 'Camera' },
                        { icon: ImageIcon, label: 'Image' },
                        { icon: FileScan, label: 'PDF' },
                      ].map(({ icon: Icon, label }) => (
                        <span
                          key={label}
                          className="
                            inline-flex items-center gap-1
                            text-[9px] font-heading font-medium text-warm-gray
                            bg-cream border border-cream-dark
                            px-1.5 py-0.5 rounded-full
                            group-hover:border-primary-200 group-hover:bg-primary-50/50
                            transition-colors duration-200
                          "
                        >
                          <Icon size={9} className="text-primary-500" />
                          {label}
                        </span>
                      ))}
                    </div>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* ── Loading State ── */}
          {isLoading && (
            <div className="animate-stagger-3">
              <div className="noise bg-white rounded-2xl border border-cream-dark shadow-premium p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/20">
                    <Activity size={14} className="text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-dark text-xs">
                      Analyzing Your Report
                    </h3>
                    <p className="text-[10px] font-body text-warm-gray mt-0.5">
                      AI is reading and interpreting your lab values
                    </p>
                  </div>
                </div>
                <LoadingSpinner steps={LOADING_STEPS[language]} currentStep={loadingStep} />
              </div>
            </div>
          )}

          {/* ── Error State ── */}
          {error && (
            <div className="animate-scale-in">
              <div className="accent-bar-rose bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-3">
                <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-heading font-semibold text-red-700 text-sm">
                    Something went wrong
                  </p>
                  <p className="font-body text-red-600 text-xs mt-0.5">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* ── Results ── */}
          {result && (
            <div className="space-y-5">

              {/* Stat Badges Row */}
              <div className="flex items-center gap-2.5 animate-stagger-1">
                <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-xl shadow-sm">
                  <CheckCircle size={14} />
                  <span className="font-heading font-bold text-sm">{normalCount}</span>
                  <span className="font-body text-xs">Normal</span>
                </div>
                {flaggedCount > 0 && (
                  <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-xl shadow-sm">
                    <AlertTriangle size={14} />
                    <span className="font-heading font-bold text-sm">{flaggedCount}</span>
                    <span className="font-body text-xs">Flagged</span>
                  </div>
                )}
              </div>

              {/* Parameter Table Card */}
              <div className="animate-stagger-2 noise bg-white rounded-2xl border border-cream-dark shadow-premium overflow-hidden">
                {/* Table Header */}
                <div className="px-5 py-4 border-b border-cream-dark flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-india-green to-india-green-light rounded-xl flex items-center justify-center shadow-md shadow-india-green/15">
                      <Activity size={16} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold text-dark text-sm">
                        Analysis Complete
                      </h3>
                      <p className="text-[11px] font-body text-warm-gray mt-0.5">
                        AI-powered lab report analysis
                      </p>
                    </div>
                  </div>
                </div>

                {/* Column Labels */}
                <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-2.5 bg-cream/60 text-[10px] font-heading font-semibold text-warm-gray uppercase tracking-widest border-b border-cream-dark">
                  <div className="col-span-1" />
                  <div className="col-span-3">Parameter</div>
                  <div className="col-span-2">Value</div>
                  <div className="col-span-2">Ref. Range</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-3">Explanation</div>
                </div>

                {/* Parameter Rows */}
                <div className="divide-y divide-cream-dark/60">
                  {result.parameters?.map((param, i) => {
                    const colors = CLASSIFICATION_COLORS[param.classification] || CLASSIFICATION_COLORS.Unclassified;
                    const isNormal = param.classification === 'Normal';
                    const isBorderline = param.classification === 'Borderline';
                    const isCritical = param.classification === 'Abnormal';

                    const staggerClass = i < 6 ? `animate-stagger-${i + 1}` : 'animate-stagger-6';

                    return (
                      <div
                        key={i}
                        className={`
                          ${staggerClass}
                          group grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-start
                          px-5 py-3
                          hover:bg-cream/40 transition-colors duration-200
                          ${isCritical ? 'accent-bar-rose' : isBorderline ? 'accent-bar-amber' : ''}
                        `}
                      >
                        {/* Status Icon */}
                        <div className="col-span-1 flex items-center sm:justify-center pt-0.5">
                          <div
                            className={`
                              w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                              ${isNormal
                                ? 'bg-green-50 ring-1 ring-green-200'
                                : isBorderline
                                  ? 'bg-amber-50 ring-1 ring-amber-200'
                                  : 'bg-red-50 ring-1 ring-red-200'
                              }
                            `}
                          >
                            {isNormal ? (
                              <CheckCircle size={14} className="text-green-600" />
                            ) : (
                              <AlertTriangle
                                size={14}
                                className={isBorderline ? 'text-amber-600' : 'text-red-600'}
                              />
                            )}
                          </div>
                        </div>

                        {/* Parameter Name */}
                        <div className="col-span-3 flex items-center">
                          <h4 className="font-heading font-semibold text-dark text-xs leading-snug">
                            {param.name}
                          </h4>
                        </div>

                        {/* Value + Unit */}
                        <div className="col-span-2 flex items-center">
                          <span className="font-heading text-xs font-bold text-dark tabular-nums">
                            {param.value}
                            <span className="text-[11px] font-body font-normal text-warm-gray ml-1">
                              {param.unit}
                            </span>
                          </span>
                        </div>

                        {/* Reference Range */}
                        <div className="col-span-2 flex items-center">
                          <span className="text-[11px] font-body text-warm-gray tabular-nums">
                            {param.reference_range}
                          </span>
                        </div>

                        {/* Classification Badge */}
                        <div className="col-span-1 flex items-center">
                          <span
                            className={`
                              text-[10px] px-2.5 py-0.5 rounded-full font-heading font-semibold whitespace-nowrap
                              ${isNormal
                                ? 'bg-green-100 text-green-700'
                                : isBorderline
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                              }
                            `}
                          >
                            {param.classification}
                          </span>
                        </div>

                        {/* Explanation */}
                        <div className="col-span-3 flex items-center">
                          <p className="text-[11px] font-body text-warm-gray leading-relaxed line-clamp-2">
                            {param.explanation_translated || param.explanation}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Summary Card */}
              {result.summary && (
                <div className="animate-stagger-3 noise bg-white rounded-2xl border border-cream-dark shadow-premium p-5 relative overflow-hidden">
                  {/* Subtle gradient accent */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-india-green opacity-80" />
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-md shadow-primary-500/15">
                      <Sparkles size={15} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-dark italic">
                        AI Summary
                      </h3>
                    </div>
                  </div>
                  <p className="font-body text-xs text-dark/80 leading-[1.75] pl-[46px]">
                    {result.summary}
                  </p>
                </div>
              )}

              {/* Audio Player Card */}
              {result.audio_url && (
                <div className="animate-stagger-4 noise bg-white rounded-2xl border border-cream-dark shadow-premium p-5 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 to-violet-600 opacity-60" />
                  <div className="flex items-center gap-2.5 mb-4">
                    <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-700 rounded-xl flex items-center justify-center shadow-md shadow-violet-500/15">
                      <Volume2 size={15} className="text-white" />
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-dark italic">
                        Listen in Your Language
                      </h3>
                      <p className="text-[11px] font-body text-warm-gray mt-0.5">
                        Audio explanation powered by Sarvam AI
                      </p>
                    </div>
                  </div>
                  <div className="pl-[46px]">
                    <AudioPlayer audioUrl={result.audio_url} label="Listen to explanation" autoPlay />
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <div className="animate-stagger-5">
                <Disclaimer />
              </div>

              {/* Action Bar */}
              <div className="animate-stagger-6 flex gap-3">
                <button
                  onClick={handleReset}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    py-3 rounded-xl
                    bg-gradient-to-r from-primary-500 to-primary-600 text-white
                    font-heading font-bold text-sm
                    hover:from-primary-600 hover:to-primary-700
                    active:scale-[0.98] transition-all duration-200
                    shadow-lg shadow-primary-500/20
                  "
                >
                  <RotateCcw size={15} />
                  Analyze Another Report
                </button>
                <button
                  className="
                    px-5 py-3 rounded-xl
                    border border-cream-dark text-warm-gray
                    hover:bg-cream hover:border-warm-gray/30 hover:text-dark
                    transition-all duration-200
                  "
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Right Sidebar (1/3) ── */}
        <div className="space-y-3">

          {/* Previous Reports */}
          <div className="animate-stagger-4 noise bg-white rounded-2xl border border-cream-dark shadow-premium p-3">
            <h4 className="font-heading font-bold text-dark text-xs flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-sm shadow-primary-500/15">
                <Clock size={12} className="text-white" />
              </div>
              Previous Reports
            </h4>
            <div className="space-y-1">
              {previousReports.length === 0 ? (
                <p className="text-[11px] font-body text-warm-gray px-2 py-3 text-center">No previous reports</p>
              ) : previousReports.map((report, i) => {
                const staggerClass = `animate-stagger-${Math.min(i + 4, 6)}`;
                const date = new Date(report.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
                return (
                  <div
                    key={report.id}
                    className={`
                      ${staggerClass}
                      flex items-center gap-2 p-2 rounded-lg
                      hover:bg-cream transition-all duration-200 cursor-pointer group
                    `}
                  >
                    <div className="w-7 h-7 bg-cream rounded-lg flex items-center justify-center shrink-0 group-hover:bg-primary-50 group-hover:ring-1 group-hover:ring-primary-200 transition-all duration-200">
                      <FileText size={12} className="text-warm-gray group-hover:text-primary-500 transition-colors" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-heading font-semibold text-dark truncate">
                        {report.title}
                      </p>
                      <p className="text-[9px] font-body text-warm-gray mt-0.5">{date}</p>
                    </div>
                    <ArrowRight
                      size={11}
                      className="text-cream-dark group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all duration-200 shrink-0"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* How It Works */}
          <div className="animate-stagger-5 noise bg-white rounded-2xl border border-cream-dark shadow-premium p-3">
            <h4 className="font-heading font-bold text-dark text-xs flex items-center gap-2 mb-2.5">
              <div className="w-7 h-7 bg-gradient-to-br from-india-green to-india-green-light rounded-lg flex items-center justify-center shadow-sm shadow-india-green/15">
                <Info size={12} className="text-white" />
              </div>
              How It Works
            </h4>
            <div className="space-y-2">
              {HOW_IT_WORKS.map((step, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-primary-50 border border-primary-200 rounded-full flex items-center justify-center text-[9px] font-heading font-bold text-primary-600 shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-[11px] font-body text-dark/70 leading-relaxed pt-0.5">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Powered By - Tech Stack Pills */}
          <div className="animate-stagger-6 noise bg-white rounded-2xl border border-cream-dark shadow-premium p-3">
            <h4 className="font-heading font-bold text-dark text-xs flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-gradient-to-br from-dark to-dark-muted rounded-lg flex items-center justify-center shadow-sm">
                <Shield size={12} className="text-white" />
              </div>
              Powered By
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: 'Amazon Textract', color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100' },
                { label: 'Amazon Bedrock', color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' },
                { label: 'Sarvam AI', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' },
              ].map(({ label, color }) => (
                <span
                  key={label}
                  className={`text-[10px] px-3 py-1.5 rounded-full border font-heading font-semibold transition-colors duration-200 cursor-default ${color}`}
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
