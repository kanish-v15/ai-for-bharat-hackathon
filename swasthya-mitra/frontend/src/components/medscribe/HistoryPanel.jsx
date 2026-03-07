import { useState } from 'react';
import {
  ChevronDown, ChevronRight, Clock, Pill, Stethoscope,
  User, Activity, FileText, CheckCircle, Volume2, Languages,
} from 'lucide-react';
import { LANGUAGES } from '../../utils/constants';
import AudioPlayer from '../AudioPlayer';

const SOAP_CONFIG = {
  subjective: { label: 'Subjective', icon: User, tagBg: 'bg-sky-50', tagText: 'text-sky-700', iconColor: 'text-sky-500', accentColor: 'bg-sky-500' },
  objective: { label: 'Objective', icon: Activity, tagBg: 'bg-emerald-50', tagText: 'text-emerald-700', iconColor: 'text-emerald-500', accentColor: 'bg-emerald-500' },
  assessment: { label: 'Assessment', icon: FileText, tagBg: 'bg-amber-50', tagText: 'text-amber-700', iconColor: 'text-amber-500', accentColor: 'bg-amber-500' },
  plan: { label: 'Plan', icon: CheckCircle, tagBg: 'bg-rose-50', tagText: 'text-rose-700', iconColor: 'text-rose-500', accentColor: 'bg-rose-500' },
};

const LANG_COLORS = {
  hindi: 'bg-primary-50 text-primary-700', tamil: 'bg-india-green/10 text-india-green',
  english: 'bg-warm-gray/10 text-warm-gray', telugu: 'bg-amber-50 text-amber-700',
  kannada: 'bg-green-50 text-green-700', malayalam: 'bg-rose-50 text-rose-700',
  bengali: 'bg-sky-50 text-sky-700', marathi: 'bg-emerald-50 text-emerald-700',
  gujarati: 'bg-orange-50 text-orange-700',
};

export default function HistoryPanel({ consultations = [] }) {
  const [expandedId, setExpandedId] = useState(null);

  if (consultations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
          <Clock size={22} className="text-warm-gray/50" />
        </div>
        <p className="font-heading font-bold text-dark text-sm mb-1">No Consultations Yet</p>
        <p className="font-body text-xs text-warm-gray max-w-xs">Record a consultation in the Consult tab to see it here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-heading font-semibold text-warm-gray uppercase tracking-wider px-1">
        {consultations.length} consultation{consultations.length !== 1 ? 's' : ''}
      </p>
      {consultations.map((c) => {
        const isExpanded = expandedId === c.id;
        const date = new Date(c.date);
        const dateStr = date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        const langLabel = LANGUAGES[c.language]?.labelEn || c.language;
        const medCount = c.medications?.length || 0;
        const assessment = c.soap_note?.assessment;

        return (
          <div key={c.id} className={`bg-white rounded-xl border transition-all ${isExpanded ? 'border-primary-200 shadow-md' : 'border-gray-100 shadow-sm hover:border-gray-200'}`}>
            <button onClick={() => setExpandedId(isExpanded ? null : c.id)}
              className="w-full px-4 py-3 flex items-center gap-3 text-left">
              <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                <Stethoscope size={15} className="text-primary-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-bold text-dark text-xs">{dateStr}</span>
                  <span className="text-[10px] text-warm-gray font-body">{timeStr}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-heading font-medium ${LANG_COLORS[c.language] || 'bg-gray-50 text-gray-600'}`}>
                    {langLabel}
                  </span>
                </div>
                {assessment && (
                  <p className="text-[11px] text-gray-500 font-body truncate mt-0.5">{assessment.substring(0, 80)}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {medCount > 0 && (
                  <span className="flex items-center gap-1 text-[10px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full font-heading font-medium">
                    <Pill size={10} />{medCount}
                  </span>
                )}
                {isExpanded ? <ChevronDown size={14} className="text-warm-gray" /> : <ChevronRight size={14} className="text-warm-gray" />}
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
                {/* SOAP Grid */}
                {c.soap_note && (
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {Object.entries(SOAP_CONFIG).map(([key, { label, icon: SIcon, accentColor, tagBg, tagText, iconColor }]) => {
                      const content = c.soap_note[key];
                      if (!content) return null;
                      return (
                        <div key={key} className="bg-gray-50/60 rounded-xl border border-gray-100 overflow-hidden">
                          <div className="flex">
                            <div className={`w-1 shrink-0 ${accentColor}`} />
                            <div className="flex-1 p-3">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <div className={`w-5 h-5 ${tagBg} rounded-md flex items-center justify-center`}><SIcon size={10} className={iconColor} /></div>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-heading font-semibold ${tagBg} ${tagText}`}>{label}</span>
                              </div>
                              <p className="font-body text-[11px] text-gray-600 whitespace-pre-wrap leading-relaxed">{content}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Medications */}
                {medCount > 0 && (
                  <div className="bg-gray-50/60 rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
                      <Pill size={12} className="text-primary-500" />
                      <span className="font-heading font-bold text-dark text-[11px]">Medications</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead><tr className="bg-gray-50">
                          <th className="px-3 py-1.5 text-left text-[9px] text-warm-gray uppercase tracking-wider font-heading font-semibold w-8">#</th>
                          <th className="px-3 py-1.5 text-left text-[9px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Medicine</th>
                          <th className="px-3 py-1.5 text-left text-[9px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Dosage</th>
                          <th className="px-3 py-1.5 text-left text-[9px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Frequency</th>
                        </tr></thead>
                        <tbody>
                          {c.medications.map((med, i) => (
                            <tr key={i} className="border-t border-gray-50">
                              <td className="px-3 py-2 text-[11px] text-warm-gray font-heading">{i + 1}</td>
                              <td className="px-3 py-2 text-[11px] font-heading font-semibold text-dark">{med.name}</td>
                              <td className="px-3 py-2 text-[11px] font-body text-gray-600">{med.dosage || '--'}</td>
                              <td className="px-3 py-2 text-[11px] font-body text-gray-500">{med.frequency || '--'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Patient Instructions */}
                {c.patient_instructions && (
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <CheckCircle size={12} className="text-india-green" />
                      <span className="font-heading font-bold text-dark text-[11px]">Patient Instructions</span>
                    </div>
                    <p className="font-body text-[11px] text-gray-600 whitespace-pre-wrap leading-relaxed pl-5">
                      {c.patient_instructions_translated || c.patient_instructions}
                    </p>
                  </div>
                )}

                {/* Audio */}
                {c.patient_audio_url && (
                  <div className="flex items-center gap-2 px-1">
                    <Volume2 size={12} className="text-green-500 shrink-0" />
                    <div className="flex-1"><AudioPlayer audioUrl={c.patient_audio_url} label="Audio Instructions" /></div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
