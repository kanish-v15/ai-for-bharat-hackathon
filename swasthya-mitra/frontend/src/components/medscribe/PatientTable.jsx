import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight, Edit3, Trash2, Eye,
  User, Stethoscope,
} from 'lucide-react';
import { LANGUAGES } from '../../utils/constants';

const AVATAR_GRADIENTS = [
  'from-primary-400 to-primary-600', 'from-india-green to-emerald-500',
  'from-amber-400 to-orange-500', 'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500', 'from-sky-400 to-blue-500',
];

const LANG_COLORS = {
  hindi: 'bg-primary-50 text-primary-700', tamil: 'bg-india-green/10 text-india-green',
  english: 'bg-warm-gray/10 text-warm-gray', telugu: 'bg-amber-50 text-amber-700',
  kannada: 'bg-violet-50 text-violet-700', malayalam: 'bg-rose-50 text-rose-700',
  bengali: 'bg-sky-50 text-sky-700', marathi: 'bg-emerald-50 text-emerald-700',
  gujarati: 'bg-orange-50 text-orange-700',
};

const getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
const getGradient = (name) => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

export default function PatientTable({ patients, onDelete }) {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (patients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
          <User size={28} className="text-warm-gray/40" />
        </div>
        <p className="font-heading font-bold text-dark text-base mb-1">No patients found</p>
        <p className="font-body text-sm text-warm-gray">Add a patient or adjust your search.</p>
      </div>
    );
  }

  // ─── Mobile: Card Layout ───
  if (isMobile) {
    return (
      <div className="space-y-2.5">
        {patients.map((p) => {
          const langLabel = LANGUAGES[p.language]?.labelEn || p.language || '--';
          const consultCount = p.consultations?.length || 0;

          return (
            <div key={p.id} onClick={() => navigate(`/medscribe/patient/${p.id}`)}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden cursor-pointer hover:border-primary-200 hover:shadow-md transition-all active:scale-[0.99]">
              <div className="px-4 py-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGradient(p.name)} flex items-center justify-center shrink-0 shadow-sm`}>
                  <span className="text-white font-heading font-bold text-xs">{getInitials(p.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-dark text-sm truncate">{p.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-heading font-medium ${LANG_COLORS[p.language] || 'bg-gray-50 text-gray-600'}`}>
                      {langLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    {p.age && <span className="text-[11px] text-warm-gray font-body">{p.age}y</span>}
                    {p.gender && <span className="text-[11px] text-warm-gray font-body">{p.gender}</span>}
                    {p.conditions && <span className="text-[11px] text-warm-gray font-body truncate">{p.conditions}</span>}
                    {consultCount > 0 && (
                      <span className="text-[10px] text-primary-600 font-heading font-medium">{consultCount} visits</span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-warm-gray shrink-0" />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ─── Desktop: Table Layout ───
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-100">
            <th className="px-4 py-3 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Patient</th>
            <th className="px-4 py-3 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Age</th>
            <th className="px-4 py-3 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Gender</th>
            <th className="px-4 py-3 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Language</th>
            <th className="px-4 py-3 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Conditions</th>
            <th className="px-4 py-3 text-left text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Visits</th>
            <th className="px-4 py-3 text-right text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold w-28">Actions</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((p) => {
            const langLabel = LANGUAGES[p.language]?.labelEn || p.language || '--';
            const consultCount = p.consultations?.length || 0;

            return (
              <tr key={p.id} onClick={() => navigate(`/medscribe/patient/${p.id}`)}
                className="border-b border-gray-50 cursor-pointer hover:bg-primary-50/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getGradient(p.name)} flex items-center justify-center shrink-0 shadow-sm`}>
                      <span className="text-white font-heading font-bold text-[10px]">{getInitials(p.name)}</span>
                    </div>
                    <div>
                      <span className="font-heading font-bold text-dark text-xs block">{p.name}</span>
                      {p.phone && <span className="text-[10px] text-warm-gray font-body">{p.phone}</span>}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-body text-dark">{p.age || '--'}</td>
                <td className="px-4 py-3 text-xs font-body text-dark">{p.gender || '--'}</td>
                <td className="px-4 py-3">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-heading font-medium ${LANG_COLORS[p.language] || 'bg-gray-50 text-gray-600'}`}>
                    {langLabel}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-body ${p.conditions ? 'text-dark' : 'text-warm-gray/50'}`}>
                    {p.conditions || '--'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {consultCount > 0 ? (
                    <span className="text-[10px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full font-heading font-bold">{consultCount}</span>
                  ) : (
                    <span className="text-[10px] text-warm-gray/50 font-body">0</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/medscribe/patient/${p.id}`); }}
                      className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center text-primary-500 hover:bg-primary-100 transition-colors"
                      title="View patient">
                      <Eye size={12} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(p.id); }}
                      className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center text-warm-gray hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Delete patient">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
