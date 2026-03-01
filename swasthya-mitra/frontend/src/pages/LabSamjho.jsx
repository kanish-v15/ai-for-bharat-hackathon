import { useState, useRef } from 'react';
import { Upload, Camera } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { analyzeLabReport } from '../services/api';
import AudioPlayer from '../components/AudioPlayer';
import Disclaimer from '../components/Disclaimer';
import LoadingSpinner from '../components/LoadingSpinner';
import { CLASSIFICATION_COLORS } from '../utils/constants';

const LOADING_STEPS = {
  hindi: ['रिपोर्ट अपलोड हो रही है...', 'रिपोर्ट पढ़ी जा रही है...', 'पैरामीटर का विश्लेषण...', 'हिंदी में अनुवाद...', 'ऑडियो बनाया जा रहा है...'],
  tamil: ['அறிக்கை பதிவேற்றப்படுகிறது...', 'அறிக்கை படிக்கப்படுகிறது...', 'அளவுருக்கள் பகுப்பாய்வு...', 'தமிழில் மொழிபெயர்ப்பு...', 'ஆடியோ உருவாக்கப்படுகிறது...'],
  english: ['Uploading report...', 'Reading your report...', 'Analyzing parameters...', 'Translating...', 'Generating audio...'],
};

export default function LabSamjho() {
  const { language } = useLanguage();
  const fileInputRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPEG, PNG, or PDF file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File is too large. Maximum size is 10MB.');
      return;
    }

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setResult(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsLoading(true);
    setLoadingStep(0);
    setError(null);

    // Simulate step progress (actual API is one call but we show steps)
    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, 4));
    }, 3000);

    try {
      const data = await analyzeLabReport(selectedImage, language);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze report. Please try again.');
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Lab Samjho</h1>
        <p className="text-sm text-gray-500">Upload your lab report to understand your results</p>
      </div>

      {/* Upload Section */}
      {!result && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6">
          {previewUrl ? (
            <div className="space-y-4">
              <img src={previewUrl} alt="Lab report" className="w-full rounded-lg max-h-64 object-contain" />
              <div className="flex gap-3">
                <button onClick={handleAnalyze} disabled={isLoading} className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors">
                  {isLoading ? 'Analyzing...' : 'Analyze Report'}
                </button>
                <button onClick={handleReset} disabled={isLoading} className="px-4 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                  Change
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center gap-3 py-8"
            >
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
                <Camera size={32} className="text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700">Upload Lab Report</p>
                <p className="text-sm text-gray-400">Take a photo or choose from gallery</p>
                <p className="text-xs text-gray-300 mt-1">JPEG, PNG, or PDF (max 10MB)</p>
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
        <div className="space-y-4">
          {/* Parameters */}
          <div className="space-y-3">
            {result.parameters?.map((param, i) => {
              const colors = CLASSIFICATION_COLORS[param.classification] || CLASSIFICATION_COLORS.Unclassified;
              return (
                <div key={i} className={`${colors.bg} border ${colors.border} rounded-xl p-4`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-gray-800">
                      {colors.icon} {param.name}
                    </span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                      {param.classification}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">
                    Value: <strong>{param.value} {param.unit}</strong> | Range: {param.reference_range}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {param.explanation_translated || param.explanation}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          {result.summary && (
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Summary</h3>
              <p className="text-sm text-gray-600">{result.summary}</p>
            </div>
          )}

          {/* Audio */}
          {result.audio_url && (
            <AudioPlayer audioUrl={result.audio_url} label="Listen to explanation" />
          )}

          {/* Disclaimer */}
          <Disclaimer />

          {/* New Report Button */}
          <button onClick={handleReset} className="w-full py-3 rounded-xl border-2 border-emerald-600 text-emerald-700 font-semibold hover:bg-emerald-50 transition-colors">
            Analyze Another Report
          </button>
        </div>
      )}
    </div>
  );
}
