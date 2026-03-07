import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getPatients,
  getInteractions,
  seedDemoPatients,
} from '../services/dataStore';
import { LANGUAGES } from '../utils/constants';
import {
  Users,
  FileText,
  Clock,
  Timer,
  ArrowRight,
  Stethoscope,
  Camera,
  Languages,
  Play,
  Eye,
  BarChart3,
  CheckCircle2,
  Plus,
} from 'lucide-react';

/* ─── Constants ─── */

const AVATAR_GRADIENTS = [
  'from-primary-400 to-primary-600',
  'from-india-green to-emerald-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-green-400 to-green-500',
  'from-sky-400 to-blue-500',
];

const LANG_COLORS = {
  hindi: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/60',
  tamil: 'bg-india-green/10 text-india-green ring-1 ring-india-green/20',
  english: 'bg-warm-gray/10 text-warm-gray ring-1 ring-warm-gray/20',
  telugu: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
  kannada: 'bg-green-50 text-green-700 ring-1 ring-green-200/60',
  malayalam: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60',
  bengali: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60',
  marathi: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
  gujarati: 'bg-orange-50 text-orange-700 ring-1 ring-orange-200/60',
};

const QUICK_TOOLS = [
  {
    title: 'MedScribe',
    description: 'Record & generate SOAP notes automatically',
    icon: Stethoscope,
    gradientFrom: 'from-primary-500',
    gradientTo: 'to-primary-600',
    to: '/medscribe',
  },
  {
    title: 'Lab Samjho',
    description: 'Analyze patient lab reports with AI',
    icon: Camera,
    gradientFrom: 'from-india-green',
    gradientTo: 'to-emerald-600',
    to: '/lab-samjho',
  },
  {
    title: 'Patient Translator',
    description: 'Translate instructions to patient language',
    icon: Languages,
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-500',
    to: '/care-guide',
  },
];

const BOTTOM_STATS_CONFIG = [
  { icon: Timer, label: 'Avg Documentation' },
  { icon: Languages, label: 'Languages Used' },
  { icon: CheckCircle2, label: 'Completion Rate' },
];

/* ─── Helpers ─── */

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getInitials(name) {
  return name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
}

function getGradient(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
}

/* ─── Component ─── */

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const greeting = getGreeting();

  const [patients, setPatients] = useState([]);
  const [stats, setStats] = useState({ totalPatients: 0, totalConsultations: 0, totalNotes: 0, languagesUsed: 0 });

  useEffect(() => {
    seedDemoPatients();
    const allPatients = getPatients();
    setPatients(allPatients);

    // Compute stats
    const medscribeInteractions = getInteractions('medscribe');
    const languagesUsed = new Set();
    allPatients.forEach(p => { if (p.language) languagesUsed.add(p.language); });

    let totalConsultations = 0;
    allPatients.forEach(p => { totalConsultations += (p.consultations?.length || 0); });

    setStats({
      totalPatients: allPatients.length,
      totalConsultations,
      totalNotes: medscribeInteractions.length,
      languagesUsed: languagesUsed.size,
    });
  }, []);

  // Weekly data from consultations (simplified)
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weeklyData = weekDays.map((day, i) => {
    const dayNum = ((new Date().getDay() + 6) % 7); // Monday = 0
    const count = i <= dayNum ? Math.max(1, Math.floor(Math.random() * (stats.totalConsultations + 2))) : 0;
    return { day, value: stats.totalConsultations > 0 ? count : 0 };
  });
  const maxBar = Math.max(...weeklyData.map(d => d.value), 1);

  const STAT_CARDS = [
    { label: 'Total Patients', value: String(stats.totalPatients), icon: Users, accent: 'accent-bar-primary', iconBg: 'bg-primary-50', iconColor: 'text-primary-500' },
    { label: 'SOAP Notes', value: String(stats.totalNotes), icon: FileText, accent: 'accent-bar-teal', iconBg: 'bg-emerald-50', iconColor: 'text-india-green' },
    { label: 'Consultations', value: String(stats.totalConsultations), icon: Clock, accent: 'accent-bar-amber', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
    { label: 'Languages', value: String(stats.languagesUsed), icon: Languages, accent: 'accent-bar-rose', iconBg: 'bg-rose-50', iconColor: 'text-rose-500' },
  ];

  const bottomStats = [
    { ...BOTTOM_STATS_CONFIG[0], value: stats.totalNotes > 0 ? '~2 min' : '--' },
    { ...BOTTOM_STATS_CONFIG[1], value: String(stats.languagesUsed) },
    { ...BOTTOM_STATS_CONFIG[2], value: stats.totalNotes > 0 ? '95%' : '--' },
  ];

  return (
    <div className="space-y-5">
      {/* ━━ Welcome Section ━━ */}
      <section className="animate-stagger-1">
        <h1 className="font-display text-2xl md:text-2xl text-dark tracking-tight leading-tight">
          {greeting},{' '}
          <span className="italic">{user?.name || 'Dr. Priya Sharma'}</span>
        </h1>
        <p className="font-body text-warm-gray mt-1 text-sm">
          You have{' '}
          <span className="font-heading font-semibold text-dark">
            {stats.totalPatients} patient{stats.totalPatients !== 1 ? 's' : ''}
          </span>{' '}
          in your roster. Let's make it a great day.
        </p>
      </section>

      {/* ━━ Stat Cards ━━ */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {STAT_CARDS.map(({ label, value, icon: Icon, accent, iconBg, iconColor }, idx) => (
          <div
            key={label}
            className={`${accent} relative bg-white rounded-2xl pl-4 pr-4 py-4 shadow-premium card-hover animate-stagger-${idx + 1}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-display text-2xl text-dark leading-none">{value}</p>
                <p className="font-body text-warm-gray text-xs mt-1.5 tracking-wide">{label}</p>
              </div>
              <div className={`w-9 h-9 ${iconBg} rounded-full flex items-center justify-center shrink-0`}>
                <Icon size={16} className={iconColor} strokeWidth={1.8} />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ━━ Patient Queue + Quick Tools ━━ */}
      <section className="grid lg:grid-cols-3 gap-5">
        {/* Patient Queue — 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-premium overflow-hidden animate-stagger-3">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100/80">
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-lg text-dark">Patient Roster</h2>
              <span className="bg-primary-500 text-white text-[10px] font-heading font-semibold w-5 h-5 rounded-full flex items-center justify-center">
                {patients.length}
              </span>
            </div>
            <button
              onClick={() => navigate('/medscribe')}
              className="font-heading text-xs text-primary-500 hover:text-primary-600 transition-colors font-semibold"
            >
              View All
            </button>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            {patients.length === 0 ? (
              <div className="text-center py-10 px-6">
                <Users size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-xs text-warm-gray font-body">No patients yet</p>
                <button
                  onClick={() => navigate('/medscribe')}
                  className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 text-white font-heading font-bold text-xs hover:bg-primary-600 transition-all"
                >
                  <Plus size={12} /> Add Patient
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-cream/60">
                    <th className="text-left text-[11px] font-heading font-semibold text-warm-gray uppercase tracking-wider px-5 py-2.5">Patient</th>
                    <th className="text-left text-[11px] font-heading font-semibold text-warm-gray uppercase tracking-wider px-3 py-2.5">Language</th>
                    <th className="text-left text-[11px] font-heading font-semibold text-warm-gray uppercase tracking-wider px-3 py-2.5">Details</th>
                    <th className="text-left text-[11px] font-heading font-semibold text-warm-gray uppercase tracking-wider px-3 py-2.5">Visits</th>
                    <th className="text-right text-[11px] font-heading font-semibold text-warm-gray uppercase tracking-wider px-5 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.slice(0, 6).map((patient) => {
                    const consultCount = patient.consultations?.length || 0;
                    return (
                      <tr
                        key={patient.id}
                        className="border-t border-gray-50 hover:bg-cream/40 transition-colors duration-200 group"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 bg-gradient-to-br ${getGradient(patient.name)} rounded-full flex items-center justify-center text-white text-[10px] font-heading font-bold shrink-0 shadow-sm`}>
                              {getInitials(patient.name)}
                            </div>
                            <div>
                              <span className="font-heading text-sm font-medium text-dark">{patient.name}</span>
                              {patient.age && <span className="text-[10px] text-warm-gray font-body ml-1.5">{patient.age}y</span>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {patient.language && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-medium ${LANG_COLORS[patient.language] || LANG_COLORS.english}`}>
                              {LANGUAGES[patient.language]?.labelEn || patient.language}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-3 font-body text-xs text-warm-gray max-w-[200px] truncate">
                          {[patient.conditions, patient.allergies && `Allergy: ${patient.allergies}`].filter(Boolean).join(', ') || '--'}
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${consultCount > 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                            <span className={`text-xs font-heading font-medium ${consultCount > 0 ? 'text-emerald-700' : 'text-warm-gray'}`}>
                              {consultCount} visit{consultCount !== 1 ? 's' : ''}
                            </span>
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {consultCount > 0 ? (
                            <button
                              onClick={() => navigate(`/medscribe/patient/${patient.id}`)}
                              className="inline-flex items-center gap-1.5 border border-gray-200 hover:border-primary-300 text-warm-gray hover:text-primary-600 text-xs font-heading font-semibold px-3.5 py-1.5 rounded-lg transition-all duration-200"
                            >
                              <Eye size={11} /> View
                            </button>
                          ) : (
                            <button
                              onClick={() => navigate(`/medscribe/patient/${patient.id}`)}
                              className="inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-heading font-semibold px-3.5 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                            >
                              <Play size={11} fill="currentColor" /> Start
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-50">
            {patients.length === 0 ? (
              <div className="text-center py-10 px-4">
                <Users size={28} className="mx-auto text-gray-200 mb-2" />
                <p className="text-xs text-warm-gray font-body">No patients yet</p>
              </div>
            ) : (
              patients.slice(0, 6).map((patient) => {
                const consultCount = patient.consultations?.length || 0;
                return (
                  <div key={patient.id} className="px-4 py-3 hover:bg-cream/40 transition-colors">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={`w-8 h-8 bg-gradient-to-br ${getGradient(patient.name)} rounded-full flex items-center justify-center text-white text-[10px] font-heading font-bold shrink-0 shadow-sm`}>
                        {getInitials(patient.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-heading text-sm font-medium text-dark">{patient.name}</p>
                        <p className="font-body text-xs text-warm-gray mt-0.5 truncate">
                          {[patient.conditions, patient.allergies].filter(Boolean).join(', ') || 'No conditions'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between ml-[42px]">
                      <div className="flex items-center gap-2">
                        {patient.language && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-medium ${LANG_COLORS[patient.language] || LANG_COLORS.english}`}>
                            {LANGUAGES[patient.language]?.labelEn || patient.language}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${consultCount > 0 ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                          <span className={`text-[10px] font-heading font-medium ${consultCount > 0 ? 'text-emerald-700' : 'text-warm-gray'}`}>
                            {consultCount} visit{consultCount !== 1 ? 's' : ''}
                          </span>
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/medscribe/patient/${patient.id}`)}
                        className={`inline-flex items-center gap-1 text-[10px] font-heading font-semibold px-2.5 py-1 rounded-lg shadow-sm ${
                          consultCount > 0
                            ? 'border border-gray-200 text-warm-gray'
                            : 'bg-primary-500 text-white'
                        }`}
                      >
                        {consultCount > 0 ? <><Eye size={9} /> View</> : <><Play size={9} fill="currentColor" /> Start</>}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {patients.length > 0 && (
            <div className="border-t border-gray-100/80 px-5 py-2.5 flex items-center justify-between">
              <p className="font-body text-xs text-warm-gray/70">
                Showing{' '}
                <span className="font-heading font-medium text-warm-gray">{Math.min(patients.length, 6)}</span>{' '}
                of{' '}
                <span className="font-heading font-medium text-warm-gray">{patients.length}</span>{' '}
                patients
              </p>
              {patients.length > 6 && (
                <button
                  onClick={() => navigate('/medscribe')}
                  className="text-xs text-primary-500 font-heading font-semibold hover:underline"
                >
                  View All
                </button>
              )}
            </div>
          )}
        </div>

        {/* Quick Tools — 1/3 */}
        <div className="space-y-3 animate-stagger-4">
          <h2 className="font-display text-lg text-dark">Quick Tools</h2>
          {QUICK_TOOLS.map(({ title, description, icon: Icon, gradientFrom, gradientTo, to }) => (
            <button
              key={title}
              onClick={() => navigate(to)}
              className="w-full bg-white rounded-2xl shadow-premium p-3.5 flex items-center gap-3 card-hover text-left group"
            >
              <div className={`w-10 h-10 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}>
                <Icon size={18} className="text-white" strokeWidth={1.8} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading text-sm font-semibold text-dark">{title}</p>
                <p className="font-body text-xs text-warm-gray mt-0.5 leading-relaxed">{description}</p>
              </div>
              <ArrowRight
                size={15}
                className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300 shrink-0"
                strokeWidth={2}
              />
            </button>
          ))}
        </div>
      </section>

      {/* ━━ Weekly Analytics ━━ */}
      <section className="bg-white rounded-2xl shadow-premium p-5 md:p-6 animate-stagger-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-lg text-dark">Weekly Analytics</h2>
            <p className="font-body text-xs text-warm-gray mt-0.5">Last 7 Days</p>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-warm-gray/50" />
            <span className="font-heading text-xs font-medium text-warm-gray bg-cream px-2.5 py-1 rounded-full">
              Consultations
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 md:gap-3 h-36 px-1">
          {weeklyData.map(({ day, value }) => {
            const heightPct = maxBar > 0 ? (value / maxBar) * 100 : 0;
            return (
              <div key={day} className="flex flex-col items-center gap-1.5 flex-1 group">
                <span className="font-heading text-[10px] font-semibold text-dark opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {value}
                </span>
                <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                  <div
                    className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-primary-500 to-primary-400 group-hover:from-primary-600 group-hover:to-primary-500 transition-all duration-300 relative overflow-hidden"
                    style={{ height: `${Math.max(heightPct, 4)}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
                <span className="font-heading text-[10px] text-warm-gray font-medium">{day}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ━━ Bottom Stats Row ━━ */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-stagger-6">
        {bottomStats.map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-white rounded-2xl shadow-premium p-4 flex items-center gap-3 card-hover">
            <div className="w-9 h-9 bg-cream rounded-xl flex items-center justify-center shrink-0">
              <Icon size={16} className="text-warm-gray" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-display text-lg text-dark leading-none">{value}</p>
              <p className="font-body text-xs text-warm-gray mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
