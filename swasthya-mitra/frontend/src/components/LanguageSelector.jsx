import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../utils/constants';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      {Object.entries(LANGUAGES).map(([key, config]) => (
        <button
          key={key}
          onClick={() => setLanguage(key)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            language === key
              ? 'bg-white text-emerald-700 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {config.label}
        </button>
      ))}
    </div>
  );
}
