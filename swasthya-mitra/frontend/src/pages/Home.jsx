import { useNavigate } from 'react-router-dom';
import { FileSearch, MessageCircle, ClipboardList } from 'lucide-react';

const FEATURES = [
  {
    to: '/lab-samjho',
    icon: FileSearch,
    title: 'Lab Samjho',
    subtitle: 'Lab Report Interpreter',
    description: 'Upload your lab report photo. Hear results explained in your language.',
    color: 'bg-blue-50 border-blue-200',
    iconColor: 'text-blue-600',
  },
  {
    to: '/care-guide',
    icon: MessageCircle,
    title: 'Care Guide',
    subtitle: 'Health Assistant',
    description: 'Ask any health question using your voice. Get answers in your language.',
    color: 'bg-orange-50 border-orange-200',
    iconColor: 'text-orange-600',
  },
  {
    to: '/medscribe',
    icon: ClipboardList,
    title: 'MedScribe',
    subtitle: 'Doctor Documentation',
    description: 'Doctors: Record consultation. Get SOAP notes & patient instructions automatically.',
    color: 'bg-emerald-50 border-emerald-200',
    iconColor: 'text-emerald-600',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gray-800">SwasthyaMitra</h1>
        <p className="text-gray-500 mt-1">Your voice-first health companion</p>
      </div>

      <div className="space-y-4">
        {FEATURES.map((feature) => (
          <button
            key={feature.to}
            onClick={() => navigate(feature.to)}
            className={`w-full text-left p-5 rounded-2xl border-2 ${feature.color} transition-all hover:shadow-md active:scale-[0.98]`}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl bg-white shadow-sm ${feature.iconColor}`}>
                <feature.icon size={28} />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg text-gray-800">{feature.title}</h2>
                <p className="text-sm font-medium text-gray-500">{feature.subtitle}</p>
                <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <p className="text-xs text-center text-gray-400 pt-4">
        Powered by AWS Bedrock & Sarvam AI | AI for Bharat Hackathon
      </p>
    </div>
  );
}
