import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Heart, LayoutDashboard, FileText, Mic, Clock,
         Stethoscope, Languages, HelpCircle, LogOut, X, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const PATIENT_NAV = [
  { to: '/patient', icon: LayoutDashboard, labelKey: 'common.dashboard', fallback: 'Dashboard', exact: true },
  { to: '/lab-samjho', icon: FileText, labelKey: 'common.labSamjho', fallback: 'Lab Samjho' },
  { to: '/care-guide', icon: Mic, labelKey: 'common.careGuide', fallback: 'Care Guide' },
  { to: '/health-timeline', icon: Clock, labelKey: 'common.healthTimeline', fallback: 'Health Timeline' },
  { to: '/profile', icon: User, labelKey: 'common.profile', fallback: 'Profile' },
];

const DOCTOR_NAV = [
  { to: '/doctor', icon: LayoutDashboard, labelKey: 'common.dashboard', fallback: 'Dashboard', exact: true },
  { to: '/medscribe', icon: Stethoscope, labelKey: 'common.medscribe', fallback: 'MedScribe' },
  { to: '/lab-samjho', icon: FileText, labelKey: 'common.labSamjho', fallback: 'Lab Samjho' },
  { to: '/care-guide', icon: Languages, labelKey: 'common.careGuide', fallback: 'Care Guide' },
  { to: '/profile', icon: User, labelKey: 'common.profile', fallback: 'Profile' },
];

export default function AppSidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const navItems = user?.role === 'doctor' ? DOCTOR_NAV : PATIENT_NAV;
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.to;
    return location.pathname.startsWith(item.to);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    onClose?.();
  };

  const handleNav = () => { onClose?.(); };

  const sidebar = (
    <aside className="h-screen w-[248px] bg-surface border-r border-gray-200/60 flex flex-col">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white">
            <Heart size={15} fill="currentColor" />
          </div>
          <div>
            <span className="font-heading font-semibold text-dark text-[13px] tracking-tight block leading-tight">SwasthyaMitra</span>
            <span className="text-[9px] text-warm-gray font-medium tracking-wide uppercase">AI Health</span>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden w-7 h-7 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center text-warm-gray">
          <X size={14} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto sidebar-scroll px-3 py-1 space-y-0.5">
        <p className="text-[9px] font-heading font-semibold text-warm-gray/50 uppercase tracking-[0.1em] px-3 mb-2 mt-1">Menu</p>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={handleNav}
              className={`group flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                active
                  ? 'bg-white text-primary-600 shadow-sm border border-gray-200/80 font-semibold'
                  : 'text-gray-500 hover:bg-white/60 hover:text-dark'
              }`}
            >
              <Icon size={16} className={active ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-600 transition-colors'} />
              <span>{t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.fallback}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Help */}
      <div className="px-5 py-2">
        <button className="flex items-center gap-2 text-[11px] text-warm-gray/50 hover:text-primary-500 transition-colors font-medium">
          <HelpCircle size={13} />
          <span>Help & Support</span>
        </button>
      </div>

      {/* User Profile */}
      <div className="mx-3 mb-3 p-2.5 bg-white rounded-xl border border-gray-200/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-dark truncate">{user?.name || 'User'}</p>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold uppercase ${
              user?.role === 'doctor' ? 'bg-emerald-50 text-emerald-600' : 'bg-primary-50 text-primary-600'
            }`}>
              {user?.role === 'doctor' ? 'Doctor' : 'Patient'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-all shrink-0"
            title={t('common.logout') !== 'common.logout' ? t('common.logout') : 'Logout'}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 z-40">
        {sidebar}
      </div>

      {/* Mobile overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose}></div>
          <div className="relative z-10 animate-slide-up" style={{ animationDuration: '0.25s' }}>
            {sidebar}
          </div>
        </div>
      )}
    </>
  );
}
