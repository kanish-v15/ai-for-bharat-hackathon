import { useState, useEffect } from 'react';
import {
  Clock,
  FileText,
  Mic,
  Stethoscope,
  Activity,
  ChevronRight,
  Calendar,
  Filter,
  Search,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { getUserHistory } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getInteractions } from '../services/dataStore';

const TYPE_CONFIG = {
  lab_report: {
    icon: FileText,
    label: 'Lab Report',
    color: 'bg-sky-50 text-sky-600 border-sky-200',
    iconColor: 'text-sky-500',
    gradient: 'from-sky-400 to-sky-600',
  },
  care_guide: {
    icon: Mic,
    label: 'Care Guide',
    color: 'bg-violet-50 text-violet-600 border-violet-200',
    iconColor: 'text-violet-500',
    gradient: 'from-violet-400 to-violet-600',
  },
  medscribe: {
    icon: Stethoscope,
    label: 'MedScribe',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    iconColor: 'text-emerald-500',
    gradient: 'from-emerald-400 to-emerald-600',
  },
};

// No mock data - uses dataStore

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function HealthTimeline() {
  const { user } = useAuth();
  // Primary: localStorage data from dataStore, enhanced with API data
  const [history, setHistory] = useState(() => getInteractions());
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    // Load local data first (instant)
    const localData = getInteractions();
    setHistory(localData);

    // Try to enhance with API data
    async function fetchHistory() {
      try {
        const data = await getUserHistory(user?.phone || 'demo-user');
        if (data?.interactions?.length) {
          // Merge API data with local data (local takes priority)
          const localIds = new Set(localData.map(i => i.id));
          const apiItems = data.interactions
            .filter(i => !localIds.has(i.id))
            .map(i => ({ ...i, status: 'completed' }));
          if (apiItems.length > 0) {
            setHistory([...localData, ...apiItems].sort((a, b) => new Date(b.date) - new Date(a.date)));
          }
        }
      } catch {
        // API failed - local data is still shown
        if (localData.length === 0) setApiError(true);
      }
    }
    fetchHistory();
  }, [user]);

  const filtered = filter === 'all' ? history : history.filter(h => h.type === filter);

  const stats = {
    total: history.length,
    lab: history.filter(h => h.type === 'lab_report').length,
    care: history.filter(h => h.type === 'care_guide').length,
    medscribe: history.filter(h => h.type === 'medscribe').length,
  };

  return (
    <div className="animate-slide-up">
      {/* Page Header */}
      <div className="mb-6 animate-stagger-1">
        <h1 className="font-display text-2xl text-dark tracking-tight leading-tight">
          Health <span className="italic text-primary-500">Timeline</span>
        </h1>
        <p className="font-body text-warm-gray text-sm mt-1 max-w-lg">
          Your complete health journey — all interactions, reports, and consultations in one place.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-stagger-2">
        {[
          { label: 'Total', value: stats.total, icon: Activity, color: 'from-primary-400 to-primary-600' },
          { label: 'Lab Reports', value: stats.lab, icon: FileText, color: 'from-sky-400 to-sky-600' },
          { label: 'Care Guide', value: stats.care, icon: Mic, color: 'from-violet-400 to-violet-600' },
          { label: 'MedScribe', value: stats.medscribe, icon: Stethoscope, color: 'from-emerald-400 to-emerald-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="noise bg-white rounded-xl border border-cream-dark shadow-sm p-3 flex items-center gap-3">
            <div className={`w-9 h-9 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center shadow-sm`}>
              <Icon size={15} className="text-white" />
            </div>
            <div>
              <p className="font-heading font-bold text-dark text-lg leading-tight">{value}</p>
              <p className="text-[10px] font-body text-warm-gray">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-5 animate-stagger-3 overflow-x-auto pb-1">
        {[
          { key: 'all', label: 'All' },
          { key: 'lab_report', label: 'Lab Reports' },
          { key: 'care_guide', label: 'Care Guide' },
          { key: 'medscribe', label: 'MedScribe' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`
              text-xs font-heading font-semibold px-4 py-2 rounded-lg whitespace-nowrap
              transition-all duration-200
              ${filter === key
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20'
                : 'bg-white text-warm-gray border border-cream-dark hover:border-primary-200 hover:text-primary-600'
              }
            `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="space-y-3 animate-stagger-4">
        {loading ? (
          <div className="noise bg-white rounded-2xl border border-cream-dark shadow-premium p-8 text-center">
            <div className="w-10 h-10 border-2 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="font-body text-sm text-warm-gray">Loading your health history...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="noise bg-white rounded-2xl border border-cream-dark shadow-premium p-8 text-center">
            <div className="w-12 h-12 bg-cream rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Clock size={20} className="text-warm-gray" />
            </div>
            <p className="font-heading font-bold text-dark text-sm">No interactions yet</p>
            <p className="font-body text-xs text-warm-gray mt-1">
              Your health interactions will appear here after you use Lab Samjho, Care Guide, or MedScribe.
            </p>
          </div>
        ) : (
          filtered.map((item, i) => {
            const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.care_guide;
            const Icon = config.icon;
            const stagger = i < 6 ? `animate-stagger-${i + 1}` : '';

            return (
              <div
                key={item.id}
                className={`
                  ${stagger}
                  noise bg-white rounded-xl border border-cream-dark shadow-sm
                  hover:shadow-md hover:border-primary-200
                  transition-all duration-200 cursor-pointer group
                `}
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center shadow-sm shrink-0`}>
                    <Icon size={17} className="text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-heading font-semibold text-dark text-sm truncate">
                        {item.title}
                      </h3>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-heading font-semibold border ${config.color} shrink-0`}>
                        {config.label}
                      </span>
                    </div>
                    <p className="font-body text-xs text-warm-gray line-clamp-1">
                      {item.summary}
                    </p>
                  </div>

                  {/* Date & Arrow */}
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-heading font-medium text-dark">{formatDate(item.date)}</p>
                      <p className="text-[10px] font-body text-warm-gray">{formatTime(item.date)}</p>
                    </div>
                    <ChevronRight size={16} className="text-cream-dark group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* API Error Note */}
      {apiError && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 animate-stagger-5">
          <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs font-body text-amber-700">
            Could not load history from server. Showing sample data instead.
          </p>
        </div>
      )}
    </div>
  );
}
