import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../utils/constants';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const currentConfig = LANGUAGES[language];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 text-sm font-heading font-semibold hover:bg-primary-100 transition-colors"
      >
        {currentConfig?.label || 'Language'}
        <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 animate-fade-in">
          {Object.entries(LANGUAGES).map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                setLanguage(key);
                setOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-primary-50 transition-colors ${
                language === key ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
              }`}
            >
              <span className="flex flex-col items-start">
                <span className="font-heading font-semibold">{config.label}</span>
                <span className="text-xs text-gray-400 font-body">{config.labelEn}</span>
              </span>
              {language === key && <Check size={16} className="text-primary-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
