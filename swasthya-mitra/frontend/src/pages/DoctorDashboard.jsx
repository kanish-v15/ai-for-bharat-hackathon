import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
} from 'lucide-react';

/* ─── Data ─── */

const STAT_CARDS = [
  {
    label: 'Patients Today',
    value: '3',
    icon: Users,
    accent: 'accent-bar-primary',
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-500',
    span: 'lg:col-span-1',
  },
  {
    label: 'SOAP Notes',
    value: '89',
    icon: FileText,
    accent: 'accent-bar-teal',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-india-green',
    span: 'lg:col-span-1',
  },
  {
    label: 'Time Saved',
    value: '12h',
    icon: Clock,
    accent: 'accent-bar-amber',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-600',
    span: 'lg:col-span-1',
  },
  {
    label: 'Avg Consultation',
    value: '2.3',
    suffix: 'min',
    icon: Timer,
    accent: 'accent-bar-rose',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    span: 'lg:col-span-1',
  },
];

const AVATAR_GRADIENTS = [
  'from-primary-400 to-primary-600',
  'from-india-green to-emerald-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
];

const PATIENT_QUEUE = [
  {
    initials: 'RK',
    name: 'Ramesh Kumar',
    language: 'Hindi',
    langColor: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/60',
    complaint: 'Follow-up: Viral fever, headache',
    status: 'In Progress',
    statusDot: 'bg-primary-500',
    statusText: 'text-primary-700',
    actionType: 'view',
    gradient: 0,
  },
  {
    initials: 'SP',
    name: 'Sunita Patel',
    language: 'Tamil',
    langColor: 'bg-india-green/8 text-india-green ring-1 ring-india-green/15',
    complaint: 'Persistent cough, 5 days',
    status: 'Waiting',
    statusDot: 'bg-amber-500',
    statusText: 'text-amber-700',
    actionType: 'start',
    gradient: 1,
  },
  {
    initials: 'MR',
    name: 'Meena Rao',
    language: 'English',
    langColor: 'bg-warm-gray/8 text-warm-gray ring-1 ring-warm-gray/15',
    complaint: 'Blood test results review',
    status: 'Waiting',
    statusDot: 'bg-amber-500',
    statusText: 'text-amber-700',
    actionType: 'start',
    gradient: 2,
  },
  {
    initials: 'AV',
    name: 'Arun Verma',
    language: 'Hindi',
    langColor: 'bg-primary-50 text-primary-700 ring-1 ring-primary-200/60',
    complaint: 'Diabetes management check',
    status: 'Completed',
    statusDot: 'bg-emerald-500',
    statusText: 'text-emerald-700',
    actionType: 'view',
    gradient: 3,
  },
];

const QUICK_TOOLS = [
  {
    title: 'MedScribe',
    description: 'Record & generate SOAP notes automatically',
    icon: Stethoscope,
    gradientFrom: 'from-primary-500',
    gradientTo: 'to-primary-600',
    lightBg: 'bg-primary-50',
    to: '/medscribe',
  },
  {
    title: 'Lab Samjho',
    description: 'Analyze patient lab reports with AI',
    icon: Camera,
    gradientFrom: 'from-india-green',
    gradientTo: 'to-emerald-600',
    lightBg: 'bg-emerald-50',
    to: '/lab-samjho',
  },
  {
    title: 'Patient Translator',
    description: 'Translate instructions to patient language',
    icon: Languages,
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-500',
    lightBg: 'bg-amber-50',
    to: '/care-guide',
  },
];

const WEEKLY_DATA = [
  { day: 'Mon', value: 65 },
  { day: 'Tue', value: 45 },
  { day: 'Wed', value: 80 },
  { day: 'Thu', value: 55 },
  { day: 'Fri', value: 90 },
  { day: 'Sat', value: 35 },
  { day: 'Sun', value: 20 },
];

const BOTTOM_STATS = [
  { icon: Timer, label: 'Avg Documentation', value: '4.2 min' },
  { icon: Languages, label: 'Languages Used', value: '3' },
  { icon: CheckCircle2, label: 'Completion Rate', value: '95%' },
];

/* ─── Helpers ─── */

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/* ─── Component ─── */

export default function DoctorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const greeting = getGreeting();
  const maxBar = Math.max(...WEEKLY_DATA.map((d) => d.value));

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
            3 patients
          </span>{' '}
          scheduled for today. Let's make it a great day.
        </p>
      </section>

      {/* ━━ Stat Cards — Bento Grid ━━ */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {STAT_CARDS.map(
          (
            { label, value, suffix, icon: Icon, accent, iconBg, iconColor, span },
            idx
          ) => (
            <div
              key={label}
              className={`${span} ${accent} relative bg-white rounded-2xl pl-4 pr-4 py-4 shadow-premium card-hover animate-stagger-${idx + 1}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-display text-2xl text-dark leading-none">
                    {value}
                    {suffix && (
                      <span className="text-sm text-warm-gray ml-1 font-body">
                        {suffix}
                      </span>
                    )}
                  </p>
                  <p className="font-body text-warm-gray text-xs mt-1.5 tracking-wide">
                    {label}
                  </p>
                </div>
                <div
                  className={`w-9 h-9 ${iconBg} rounded-full flex items-center justify-center shrink-0`}
                >
                  <Icon size={16} className={iconColor} strokeWidth={1.8} />
                </div>
              </div>
            </div>
          )
        )}
      </section>

      {/* ━━ Patient Queue + Quick Tools ━━ */}
      <section className="grid lg:grid-cols-3 gap-5">
        {/* Patient Queue — 2/3 */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-premium overflow-hidden animate-stagger-3">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100/80">
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-lg text-dark">
                Today's Patient Queue
              </h2>
              <span className="bg-primary-500 text-white text-[10px] font-heading font-semibold w-5 h-5 rounded-full flex items-center justify-center">
                {PATIENT_QUEUE.length}
              </span>
            </div>
            <button className="font-heading text-xs text-warm-gray hover:text-primary-500 transition-colors font-medium">
              View All
            </button>
          </div>

          {/* ── Desktop Table ── */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="bg-cream/60">
                  <th className="text-left text-[11px] font-heading font-semibold text-warm-gray uppercase tracking-wider px-5 py-2.5">
                    Patient
                  </th>
                  <th className="text-left text-[11px] font-heading font-semibold text-warm-gray uppercase tracking-wider px-3 py-2.5">
                    Language
                  </th>
                  <th className="text-left text-[11px] font-heading font-semibold text-warm-gray uppercase tracking-wider px-3 py-2.5">
                    Chief Complaint
                  </th>
                  <th className="text-left text-[11px] font-heading font-semibold text-warm-gray uppercase tracking-wider px-3 py-2.5">
                    Status
                  </th>
                  <th className="text-right text-[11px] font-heading font-semibold text-warm-gray uppercase tracking-wider px-5 py-2.5">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {PATIENT_QUEUE.map((patient, idx) => (
                  <tr
                    key={patient.name}
                    className="border-t border-gray-50 hover:bg-cream/40 transition-colors duration-200 group"
                  >
                    {/* Patient */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 bg-gradient-to-br ${AVATAR_GRADIENTS[patient.gradient]} rounded-full flex items-center justify-center text-white text-[10px] font-heading font-bold shrink-0 shadow-sm`}
                        >
                          {patient.initials}
                        </div>
                        <span className="font-heading text-sm font-medium text-dark">
                          {patient.name}
                        </span>
                      </div>
                    </td>
                    {/* Language */}
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-medium ${patient.langColor}`}
                      >
                        {patient.language}
                      </span>
                    </td>
                    {/* Complaint */}
                    <td className="px-3 py-3 font-body text-xs text-warm-gray max-w-[200px] truncate">
                      {patient.complaint}
                    </td>
                    {/* Status */}
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${patient.statusDot}`}
                        />
                        <span
                          className={`text-xs font-heading font-medium ${patient.statusText}`}
                        >
                          {patient.status}
                        </span>
                      </span>
                    </td>
                    {/* Action */}
                    <td className="px-5 py-3 text-right">
                      {patient.actionType === 'start' ? (
                        <button
                          onClick={() => navigate('/medscribe')}
                          className="inline-flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-heading font-semibold px-3.5 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                        >
                          <Play size={11} fill="currentColor" /> Start
                        </button>
                      ) : (
                        <button className="inline-flex items-center gap-1.5 border border-gray-200 hover:border-primary-300 text-warm-gray hover:text-primary-600 text-xs font-heading font-semibold px-3.5 py-1.5 rounded-lg transition-all duration-200">
                          <Eye size={11} /> View
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="md:hidden divide-y divide-gray-50">
            {PATIENT_QUEUE.map((patient) => (
              <div
                key={patient.name}
                className="px-4 py-3 hover:bg-cream/40 transition-colors"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div
                    className={`w-8 h-8 bg-gradient-to-br ${AVATAR_GRADIENTS[patient.gradient]} rounded-full flex items-center justify-center text-white text-[10px] font-heading font-bold shrink-0 shadow-sm`}
                  >
                    {patient.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading text-sm font-medium text-dark">
                      {patient.name}
                    </p>
                    <p className="font-body text-xs text-warm-gray mt-0.5 truncate">
                      {patient.complaint}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between ml-[42px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-medium ${patient.langColor}`}
                    >
                      {patient.language}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${patient.statusDot}`}
                      />
                      <span
                        className={`text-[10px] font-heading font-medium ${patient.statusText}`}
                      >
                        {patient.status}
                      </span>
                    </span>
                  </div>
                  {patient.actionType === 'start' ? (
                    <button
                      onClick={() => navigate('/medscribe')}
                      className="inline-flex items-center gap-1 bg-primary-500 text-white text-[10px] font-heading font-semibold px-2.5 py-1 rounded-lg shadow-sm"
                    >
                      <Play size={9} fill="currentColor" /> Start
                    </button>
                  ) : (
                    <button className="inline-flex items-center gap-1 border border-gray-200 text-warm-gray text-[10px] font-heading font-semibold px-2.5 py-1 rounded-lg">
                      <Eye size={9} /> View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100/80 px-5 py-2.5 flex items-center justify-between">
            <p className="font-body text-xs text-warm-gray/70">
              Showing{' '}
              <span className="font-heading font-medium text-warm-gray">
                {PATIENT_QUEUE.length}
              </span>{' '}
              of{' '}
              <span className="font-heading font-medium text-warm-gray">
                {PATIENT_QUEUE.length}
              </span>{' '}
              patients
            </p>
            <div className="flex gap-1">
              {[...Array(3)].map((_, i) => (
                <span
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${
                    i === 0 ? 'bg-primary-500' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Quick Tools — 1/3 ── */}
        <div className="space-y-3 animate-stagger-4">
          <h2 className="font-display text-lg text-dark">Quick Tools</h2>
          {QUICK_TOOLS.map(
            ({ title, description, icon: Icon, gradientFrom, gradientTo, lightBg, to }, idx) => (
              <button
                key={title}
                onClick={() => navigate(to)}
                className="w-full bg-white rounded-2xl shadow-premium p-3.5 flex items-center gap-3 card-hover text-left group"
              >
                <div
                  className={`w-10 h-10 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl flex items-center justify-center shrink-0 shadow-sm`}
                >
                  <Icon size={18} className="text-white" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-sm font-semibold text-dark">
                    {title}
                  </p>
                  <p className="font-body text-xs text-warm-gray mt-0.5 leading-relaxed">
                    {description}
                  </p>
                </div>
                <ArrowRight
                  size={15}
                  className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-300 shrink-0"
                  strokeWidth={2}
                />
              </button>
            )
          )}
        </div>
      </section>

      {/* ━━ Weekly Analytics ━━ */}
      <section className="bg-white rounded-2xl shadow-premium p-5 md:p-6 animate-stagger-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-lg text-dark">
              Weekly Analytics
            </h2>
            <p className="font-body text-xs text-warm-gray mt-0.5">
              Last 7 Days
            </p>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-warm-gray/50" />
            <span className="font-heading text-xs font-medium text-warm-gray bg-cream px-2.5 py-1 rounded-full">
              Consultations
            </span>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="flex items-end justify-between gap-2 md:gap-3 h-36 px-1">
          {WEEKLY_DATA.map(({ day, value }) => {
            const heightPct = (value / maxBar) * 100;
            return (
              <div
                key={day}
                className="flex flex-col items-center gap-1.5 flex-1 group"
              >
                {/* Value label */}
                <span className="font-heading text-[10px] font-semibold text-dark opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {value}%
                </span>
                {/* Bar container */}
                <div
                  className="w-full flex items-end justify-center"
                  style={{ height: '100%' }}
                >
                  <div
                    className="w-full max-w-[40px] rounded-t-lg bg-gradient-to-t from-primary-500 to-primary-400 group-hover:from-primary-600 group-hover:to-primary-500 transition-all duration-300 relative overflow-hidden"
                    style={{ height: `${heightPct}%` }}
                  >
                    {/* Shimmer overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                </div>
                {/* Day label */}
                <span className="font-heading text-[10px] text-warm-gray font-medium">
                  {day}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* ━━ Bottom Stats Row ━━ */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-stagger-6">
        {BOTTOM_STATS.map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="bg-white rounded-2xl shadow-premium p-4 flex items-center gap-3 card-hover"
          >
            <div className="w-9 h-9 bg-cream rounded-xl flex items-center justify-center shrink-0">
              <Icon size={16} className="text-warm-gray" strokeWidth={1.8} />
            </div>
            <div>
              <p className="font-display text-lg text-dark leading-none">
                {value}
              </p>
              <p className="font-body text-xs text-warm-gray mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
