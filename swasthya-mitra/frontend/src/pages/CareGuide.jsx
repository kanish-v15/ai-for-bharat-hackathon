import { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { askCareGuide, askCareGuideText } from '../services/api';
import VoiceRecorder from '../components/VoiceRecorder';
import AudioPlayer from '../components/AudioPlayer';
import Disclaimer from '../components/Disclaimer';
import LoadingSpinner from '../components/LoadingSpinner';

const LOADING_STEPS = {
  hindi: ['आवाज़ रिकॉर्ड हो रही है...', 'भाषा समझी जा रही है...', 'उत्तर तैयार हो रहा है...', 'हिंदी में अनुवाद...', 'ऑडियो बनाया जा रहा है...'],
  tamil: ['குரல் பதிவாகிறது...', 'மொழி புரிந்துகொள்ளப்படுகிறது...', 'பதில் தயாராகிறது...', 'தமிழில் மொழிபெயர்ப்பு...', 'ஆடியோ உருவாக்கப்படுகிறது...'],
  english: ['Recording received...', 'Understanding your question...', 'Preparing answer...', 'Translating...', 'Generating audio...'],
};

const PLACEHOLDERS = {
  hindi: 'अपना सवाल टाइप करें...',
  tamil: 'உங்கள் கேள்வியை தட்டச்சு செய்யவும்...',
  english: 'Type your health question...',
};

export default function CareGuide() {
  const { language } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleResponse = (data) => {
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: data.answer_translated || data.answer,
        audio_url: data.audio_url,
        is_emergency: data.is_emergency,
      },
    ]);
    if (data.session_id) setSessionId(data.session_id);
    scrollToBottom();
  };

  const handleVoiceSubmit = async (audioBlob) => {
    setMessages((prev) => [...prev, { role: 'user', text: '🎙️ Voice message', isVoice: true }]);
    setIsLoading(true);
    setLoadingStep(0);
    scrollToBottom();

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, 4));
    }, 3000);

    try {
      const data = await askCareGuide(audioBlob, language, 'demo-user', sessionId);
      // Show transcribed user message
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'user', text: data.transcription || '🎙️ Voice message', isVoice: true };
        return updated;
      });
      handleResponse(data);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: err.response?.data?.message || 'Something went wrong. Please try again.', isError: true },
      ]);
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!textInput.trim() || isLoading) return;

    const question = textInput.trim();
    setTextInput('');
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setIsLoading(true);
    setLoadingStep(0);
    scrollToBottom();

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, 4));
    }, 3000);

    try {
      const data = await askCareGuideText(question, language, 'demo-user', sessionId);
      handleResponse(data);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: err.response?.data?.message || 'Something went wrong. Please try again.', isError: true },
      ]);
    } finally {
      clearInterval(stepInterval);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Care Guide</h1>
        <p className="text-sm text-gray-500">Ask any health question using voice or text</p>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {messages.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-lg mb-1">👋</p>
            <p className="text-sm">Ask your first health question</p>
            <p className="text-xs mt-1">Speak or type in your language</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-sm'
                  : msg.isError
                  ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
                  : msg.is_emergency
                  ? 'bg-red-50 text-red-800 border-2 border-red-300 rounded-bl-sm'
                  : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm'
              }`}
            >
              {msg.is_emergency && (
                <div className="text-xs font-bold text-red-600 mb-1">⚠️ EMERGENCY - Call 108 / 112</div>
              )}
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.audio_url && (
                <div className="mt-2">
                  <AudioPlayer audioUrl={msg.audio_url} label="Listen" compact />
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && <LoadingSpinner steps={LOADING_STEPS[language]} currentStep={loadingStep} />}

        <div ref={messagesEndRef} />
      </div>

      {/* Disclaimer */}
      <Disclaimer />

      {/* Input Area */}
      <div className="pt-3 space-y-3">
        <VoiceRecorder onRecordingComplete={handleVoiceSubmit} maxDuration={60} disabled={isLoading} />

        <form onSubmit={handleTextSubmit} className="flex gap-2">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={PLACEHOLDERS[language]}
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || isLoading}
            className="px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
