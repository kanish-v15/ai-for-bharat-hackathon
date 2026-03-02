import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  MessageSquare,
  Stethoscope,
  Languages,
  ArrowRight,
  Camera,
  Mic,
  Clock,
  Building2,
  Pill,
  Baby,
  ExternalLink,
  Activity,
  TrendingUp,
  Shield,
  Sparkles,
} from 'lucide-react';

/* ─── Data ─── */

const STAT_CARDS = [
  {
    label: 'Reports Analyzed',
    value: 12,
    delta: '+3 this month',
    icon: FileText,
    accent: 'accent-bar-primary',
    iconGradient: 'from-primary-400 to-primary-600',
    iconBg: 'bg-primary-50',
    ring: 'ring-primary-100',
    size: 'large',
  },
  {
    label: 'Questions Asked',
    value: 8,
    delta: '+2 this week',
    icon: MessageSquare,
    accent: 'accent-bar-teal',
    iconGradient: 'from-emerald-400 to-teal-600',
    iconBg: 'bg-emerald-50',
    ring: 'ring-emerald-100',
    size: 'large',
  },
  {
    label: 'Doctor Visits',
    value: 5,
    delta: 'Last: Feb 24',
    icon: Stethoscope,
    accent: 'accent-bar-amber',
    iconGradient: 'from-violet-400 to-purple-600',
    iconBg: 'bg-violet-50',
    ring: 'ring-violet-100',
    size: 'small',
  },
  {
    label: 'Languages Used',
    value: 3,
    delta: 'Hindi, Tamil, English',
    icon: Languages,
    accent: 'accent-bar-rose',
    iconGradient: 'from-rose-400 to-pink-600',
    iconBg: 'bg-rose-50',
    ring: 'ring-rose-100',
    size: 'small',
  },
];

const QUICK_ACTIONS = [
  {
    title: 'Lab Samjho',
    description: 'Upload & understand your lab reports instantly',
    icon: Camera,
    gradient: 'from-primary-500 to-primary-700',
    lightBg: 'bg-primary-50',
    to: '/lab-samjho',
  },
  {
    title: 'Care Guide',
    description: 'Ask health questions in your language',
    icon: Mic,
    gradient: 'from-india-green to-teal-500',
    lightBg: 'bg-emerald-50',
    to: '/care-guide',
  },
  {
    title: 'Health Timeline',
    description: 'View your complete health journey',
    icon: Clock,
    gradient: 'from-violet-500 to-purple-600',
    lightBg: 'bg-violet-50',
    to: '/health-timeline',
  },
];

const ACTIVITY_DATA = [
  {
    type: 'Lab Report',
    typeIcon: FileText,
    typeBg: 'bg-primary-50',
    typeColor: 'text-primary-600',
    description: 'Complete Blood Count (CBC) analyzed',
    date: 'Feb 28, 2026',
    status: 'Analyzed',
    statusColor: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  },
  {
    type: 'Question',
    typeIcon: MessageSquare,
    typeBg: 'bg-emerald-50',
    typeColor: 'text-emerald-600',
    description: '"Is my sugar level normal at 95 mg/dL?"',
    date: 'Feb 26, 2026',
    status: 'Answered',
    statusColor: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  },
  {
    type: 'Visit',
    typeIcon: Stethoscope,
    typeBg: 'bg-violet-50',
    typeColor: 'text-violet-600',
    description: 'Follow-up with Dr. Priya Sharma',
    date: 'Feb 24, 2026',
    status: 'Visited',
    statusColor: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  },
  {
    type: 'Lab Report',
    typeIcon: FileText,
    typeBg: 'bg-primary-50',
    typeColor: 'text-primary-600',
    description: 'Lipid Panel — Cholesterol borderline high',
    date: 'Feb 20, 2026',
    status: 'Flagged',
    statusColor: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  },
  {
    type: 'Question',
    typeIcon: MessageSquare,
    typeBg: 'bg-emerald-50',
    typeColor: 'text-emerald-600',
    description: '"What foods help reduce cholesterol?"',
    date: 'Feb 18, 2026',
    status: 'Answered',
    statusColor: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  },
];

const SCHEMES = [
  {
    icon: Building2,
    name: 'Ayushman Bharat (PM-JAY)',
    description: 'Free treatment up to \u20B95 Lakh per year for eligible families',
    gradient: 'from-primary-500 to-primary-700',
    lightBg: 'bg-gradient-to-br from-primary-50 to-primary-50/60',
  },
  {
    icon: Pill,
    name: 'Jan Aushadhi Yojana',
    description: 'Quality generic medicines at 50-90% lower prices',
    gradient: 'from-white to-gray-100',
    lightBg: 'bg-gradient-to-br from-gray-50 to-stone-100',
    dark: true,
  },
  {
    icon: Baby,
    name: 'Janani Suraksha Yojana',
    description: 'Cash assistance for institutional delivery and maternity care',
    gradient: 'from-india-green to-teal-500',
    lightBg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
  },
];

const DONUT_DATA = {
  normal: 8,
  borderline: 3,
  critical: 1,
  total: 12,
};

/* ─── Component ─── */

export default function PatientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const normalPct = (DONUT_DATA.normal / DONUT_DATA.total) * 100;
  const borderlinePct = (DONUT_DATA.borderline / DONUT_DATA.total) * 100;

  const normalDeg = (DONUT_DATA.normal / DONUT_DATA.total) * 360;
  const borderlineDeg = (DONUT_DATA.borderline / DONUT_DATA.total) * 360;
  const criticalDeg = (DONUT_DATA.critical / DONUT_DATA.total) * 360;

  const donutGradient = `conic-gradient(
    #0D6E6E 0deg ${normalDeg}deg,
    #F59E0B ${normalDeg}deg ${normalDeg + borderlineDeg}deg,
    #EF4444 ${normalDeg + borderlineDeg}deg ${normalDeg + borderlineDeg + criticalDeg}deg
  )`;

  return (
    <div className="space-y-5">
      {/* ── Welcome Section ── */}
      <section className="animate-stagger-1">
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-premium p-5">
          <div className="absolute inset-0 mesh-gradient pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-heading font-medium ring-1 ring-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  All systems healthy
                </span>
              </div>
              <h1 className="font-display text-2xl lg:text-3xl text-dark tracking-tight leading-tight">
                Welcome back,{' '}
                <span className="italic text-primary-500">
                  {user?.name || 'Ramesh'}
                </span>
              </h1>
              <p className="font-body text-warm-gray text-sm mt-1 max-w-lg">
                Review your latest insights, track your progress, and take action
                on what matters most.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-body text-xs text-warm-gray">
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bento Stat Grid ── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {STAT_CARDS.map(
          (
            { label, value, delta, icon: Icon, accent, iconGradient, iconBg, ring },
            index
          ) => (
            <div
              key={label}
              className={`
                relative overflow-hidden rounded-xl bg-white ${accent}
                shadow-premium card-hover p-4
                animate-stagger-${index + 1}
              `}
            >
              <div
                className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${iconGradient} opacity-[0.04] rounded-full -translate-y-8 translate-x-8`}
              />

              <div className="relative">
                <div
                  className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center mb-3 ring-1 ${ring}`}
                >
                  <Icon size={16} className={`bg-gradient-to-br ${iconGradient} bg-clip-text`} style={{ color: 'inherit' }} />
                </div>
                <p className="font-display text-2xl text-dark tracking-tight">
                  {value}
                </p>
                <p className="font-heading font-medium text-xs text-dark/70 mt-0.5">
                  {label}
                </p>
                <p className="font-body text-[11px] text-warm-gray mt-1">
                  {delta}
                </p>
              </div>
            </div>
          )
        )}
      </section>

      {/* ── Health Overview + Quick Actions ── */}
      <section className="grid lg:grid-cols-5 gap-4 lg:gap-5">
        {/* Health Overview — spans 3 cols */}
        <div className="lg:col-span-3 animate-stagger-3">
          <div className="relative overflow-hidden rounded-xl bg-white shadow-premium p-5 lg:p-6 h-full">
            <div className="relative">
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-display text-xl text-dark">
                    Health Overview
                  </h2>
                  <p className="font-body text-xs text-warm-gray mt-0.5">
                    Summary of your lab report results
                  </p>
                </div>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 ring-1 ring-emerald-200/60 flex items-center justify-center">
                  <Activity size={15} className="text-india-green" />
                </div>
              </div>

              {/* Chart + Legend */}
              <div className="flex flex-col sm:flex-row items-center gap-8">
                {/* Donut Chart */}
                <div className="relative w-40 h-40 shrink-0">
                  <div
                    className="w-40 h-40 rounded-full shadow-lg"
                    style={{ background: donutGradient }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 bg-white rounded-full shadow-inner flex flex-col items-center justify-center">
                      <span className="font-display text-2xl text-dark">
                        {DONUT_DATA.total}
                      </span>
                      <span className="font-heading text-[10px] text-warm-gray font-medium uppercase tracking-wider">
                        Total
                      </span>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col gap-4 flex-1">
                  {[
                    {
                      color: 'bg-india-green',
                      ring: 'ring-emerald-200',
                      count: DONUT_DATA.normal,
                      label: 'Normal',
                      pct: normalPct,
                      desc: 'All values within healthy range',
                    },
                    {
                      color: 'bg-amber-500',
                      ring: 'ring-amber-200',
                      count: DONUT_DATA.borderline,
                      label: 'Borderline',
                      pct: borderlinePct,
                      desc: 'Slightly outside normal range',
                    },
                    {
                      color: 'bg-red-500',
                      ring: 'ring-red-200',
                      count: DONUT_DATA.critical,
                      label: 'Critical',
                      pct: 100 - normalPct - borderlinePct,
                      desc: 'Needs medical attention',
                    },
                  ].map(({ color, ring, count, label, pct, desc }) => (
                    <div key={label} className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 w-3 h-3 rounded-full ${color} ring-2 ${ring} shrink-0`}
                      />
                      <div className="flex-1">
                        <div className="flex items-baseline justify-between">
                          <span className="font-heading font-semibold text-xs text-dark">
                            {count} {label}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-gray-100 text-[10px] font-heading font-medium text-warm-gray">
                            {Math.round(pct)}%
                          </span>
                        </div>
                        <p className="font-body text-[11px] text-warm-gray mt-0.5">
                          {desc}
                        </p>
                        <div className="mt-1.5 h-1 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${color}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions — spans 2 cols */}
        <div className="lg:col-span-2 animate-stagger-4">
          <div className="flex flex-col h-full gap-3">
            <div className="flex items-center justify-between mb-0.5">
              <h2 className="font-display text-xl text-dark">Quick Actions</h2>
              <Sparkles size={15} className="text-primary-400" />
            </div>

            {QUICK_ACTIONS.map(
              ({ title, description, icon: Icon, gradient, lightBg, to }, index) => (
                <button
                  key={title}
                  onClick={() => navigate(to)}
                  className={`
                    group relative w-full overflow-hidden rounded-xl bg-white
                    shadow-premium card-hover p-3.5 flex items-center gap-3
                    text-left animate-stagger-${index + 3}
                  `}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`}
                  />

                  <div className="relative">
                    <div
                      className={`w-9 h-9 ${lightBg} rounded-lg flex items-center justify-center ring-1 ring-black/[0.04]`}
                    >
                      <Icon size={18} className="text-dark/70" />
                    </div>
                  </div>
                  <div className="relative flex-1 min-w-0">
                    <p className="font-heading font-semibold text-sm text-dark">
                      {title}
                    </p>
                    <p className="font-body text-[11px] text-warm-gray mt-0.5 leading-relaxed">
                      {description}
                    </p>
                  </div>
                  <div className="relative w-7 h-7 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-primary-50 transition-colors shrink-0">
                    <ArrowRight
                      size={13}
                      className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all"
                    />
                  </div>
                </button>
              )
            )}
          </div>
        </div>
      </section>

      {/* ── Recent Activity ── */}
      <section className="animate-stagger-5">
        <div className="relative overflow-hidden rounded-xl bg-white shadow-premium">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-violet-50 ring-1 ring-violet-200/60 flex items-center justify-center">
                <TrendingUp size={14} className="text-violet-600" />
              </div>
              <div>
                <h2 className="font-display text-lg text-dark">
                  Recent Activity
                </h2>
                <p className="font-body text-[11px] text-warm-gray">
                  Your latest health interactions
                </p>
              </div>
            </div>
            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 hover:bg-primary-50 text-xs font-heading font-medium text-warm-gray hover:text-primary-600 transition-all group">
              View All
              <ArrowRight
                size={12}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </button>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr className="bg-cream/60">
                  <th className="text-left text-[11px] font-heading font-semibold text-warm-gray uppercase tracking-wider px-5 py-2.5">
                    Type
                  </th>
                  <th className="text-left text-[11px] font-heading font-semibold text-warm-gray uppercase tracking-wider px-5 py-2.5">
                    Description
                  </th>
                  <th className="text-left text-[11px] font-heading font-semibold text-warm-gray uppercase tracking-wider px-5 py-2.5">
                    Date
                  </th>
                  <th className="text-left text-[11px] font-heading font-semibold text-warm-gray uppercase tracking-wider px-5 py-2.5">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {ACTIVITY_DATA.map((item, index) => {
                  const TypeIcon = item.typeIcon;
                  return (
                    <tr
                      key={index}
                      className="border-t border-gray-100/60 hover:bg-cream/40 transition-colors group cursor-default"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 ${item.typeBg} rounded-md flex items-center justify-center ring-1 ring-black/[0.03]`}
                          >
                            <TypeIcon size={13} className={item.typeColor} />
                          </div>
                          <span className="font-heading font-medium text-xs text-dark">
                            {item.type}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-body text-xs text-dark/70 group-hover:text-dark transition-colors">
                          {item.description}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className="font-body text-xs text-warm-gray">
                          {item.date}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-heading font-medium ${item.statusColor}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden divide-y divide-gray-100/60">
            {ACTIVITY_DATA.map((item, index) => {
              const TypeIcon = item.typeIcon;
              return (
                <div
                  key={index}
                  className="px-4 py-3 flex items-start gap-3 hover:bg-cream/30 transition-colors"
                >
                  <div
                    className={`w-8 h-8 ${item.typeBg} rounded-lg flex items-center justify-center shrink-0 ring-1 ring-black/[0.03]`}
                  >
                    <TypeIcon size={14} className={item.typeColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-medium text-xs text-dark leading-snug">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="font-body text-[11px] text-warm-gray">
                        {item.date}
                      </span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-heading font-medium ${item.statusColor}`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Government Schemes ── */}
      <section className="animate-stagger-6">
        <div className="relative overflow-hidden rounded-xl bg-white shadow-premium p-5 lg:p-6">
          <div className="relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-xl text-dark">
                  Government Schemes
                </h2>
                <p className="font-body text-xs text-warm-gray mt-0.5">
                  Healthcare benefits you may be eligible for
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary-50 ring-1 ring-primary-200/60 flex items-center justify-center">
                <Shield size={15} className="text-primary-500" />
              </div>
            </div>

            {/* Scheme Cards */}
            <div className="grid sm:grid-cols-3 gap-3">
              {SCHEMES.map(
                ({ icon: Icon, name, description, gradient, lightBg, dark }) => (
                  <div
                    key={name}
                    className={`group relative overflow-hidden rounded-xl ${lightBg} p-4 card-hover border border-black/[0.04]`}
                  >
                    <div
                      className={`absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br ${gradient} opacity-[0.12] blur-xl`}
                    />

                    <div className="relative">
                      <div
                        className={`w-9 h-9 rounded-lg bg-gradient-to-br ${gradient} flex items-center justify-center shadow-sm mb-3`}
                      >
                        <Icon
                          size={16}
                          className={dark ? 'text-dark/80' : 'text-white'}
                        />
                      </div>
                      <p className="font-heading font-semibold text-xs text-dark leading-snug">
                        {name}
                      </p>
                      <p className="font-body text-[11px] text-warm-gray mt-1 leading-relaxed">
                        {description}
                      </p>
                      <button className="inline-flex items-center gap-1 mt-3 text-[11px] font-heading font-semibold text-primary-500 hover:text-primary-600 transition-colors group/link">
                        Learn More
                        <ExternalLink
                          size={10}
                          className="group-hover/link:translate-x-0.5 transition-transform"
                        />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
