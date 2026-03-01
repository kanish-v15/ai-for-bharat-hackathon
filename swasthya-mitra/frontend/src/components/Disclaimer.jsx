import { AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { DISCLAIMERS } from '../utils/constants';

export default function Disclaimer() {
  const { language } = useLanguage();

  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
      <AlertTriangle size={18} className="shrink-0 mt-0.5" />
      <p>{DISCLAIMERS[language]}</p>
    </div>
  );
}
