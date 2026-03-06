import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Search, Menu } from 'lucide-react';
import AppSidebar from './AppSidebar';
import LanguageSelector from './LanguageSelector';
import NotificationPanel from './NotificationPanel';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const PAGE_TITLES = {
  '/patient': 'Dashboard',
  '/doctor': 'Dashboard',
  '/lab-samjho': 'Lab Samjho',
  '/care-guide': 'Care Guide',
  '/medscribe': 'MedScribe',
  '/medscribe/patient': 'Patient Record',
  '/settings': 'Settings',
  '/health-timeline': 'Health Timeline',
  '/profile-setup': 'Profile Setup',
  '/profile': 'My Profile',
};

const PAGE_SUBTITLES = {
  '/patient': 'Your health at a glance',
  '/doctor': 'Today\'s overview',
  '/lab-samjho': 'Understand your lab reports',
  '/care-guide': 'AI health companion',
  '/medscribe': 'Smart documentation',
  '/medscribe/patient': 'Details, consultations & documents',
  '/health-timeline': 'Your complete health journey',
  '/profile-setup': 'Complete your health profile',
  '/profile': 'View and edit your details',
};

const NO_GUARD_ROUTES = ['/profile-setup', '/profile'];

// Match dynamic routes for title lookups
const getRouteKey = (pathname) => {
  if (pathname.startsWith('/medscribe/patient/')) return '/medscribe/patient';
  return pathname;
};

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Redirect to profile-setup if profile is incomplete
  useEffect(() => {
    if (user && !user.profileComplete && !NO_GUARD_ROUTES.includes(location.pathname)) {
      navigate('/profile-setup', { replace: true });
    }
  }, [user, location.pathname, navigate]);

  const PAGE_TITLE_KEYS = {
    '/patient': 'common.dashboard', '/doctor': 'common.dashboard',
    '/lab-samjho': 'common.labSamjho', '/care-guide': 'common.careGuide',
    '/medscribe': 'common.medscribe', '/settings': 'common.settings',
    '/health-timeline': 'common.healthTimeline',
    '/profile-setup': 'profile.setupTitle', '/profile': 'profile.title',
  };
  const PAGE_SUBTITLE_KEYS = {
    '/patient': 'dashboard.yourHealth', '/doctor': 'dashboard.todayOverview',
    '/lab-samjho': 'labSamjho.subtitle', '/care-guide': 'careGuide.subtitle',
    '/medscribe': 'medscribe.subtitle', '/health-timeline': 'healthTimeline.subtitle',
    '/profile-setup': 'profile.setupSubtitle', '/profile': 'profile.subtitle',
  };
  const routeKey = getRouteKey(location.pathname);
  const titleKey = PAGE_TITLE_KEYS[routeKey];
  const subtitleKey = PAGE_SUBTITLE_KEYS[routeKey];
  const pageTitle = titleKey ? t(titleKey) : (PAGE_TITLES[routeKey] || 'SwasthyaMitra');
  const pageSubtitle = subtitleKey ? t(subtitleKey) : PAGE_SUBTITLES[routeKey];

  return (
    <div className="min-h-screen bg-cream flex">
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 lg:ml-[248px] flex flex-col min-h-screen">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden w-9 h-9 rounded-lg bg-white flex items-center justify-center text-gray-500 hover:text-primary-500 transition-colors border border-gray-200/60"
            >
              <Menu size={16} />
            </button>
            <div>
              <h1 className="font-heading font-semibold text-base text-dark tracking-tight">{pageTitle}</h1>
              {pageSubtitle && (
                <p className="text-[10px] text-warm-gray font-medium mt-0.5">{pageSubtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Search */}
            <div className="hidden md:flex items-center bg-gray-50 border border-gray-200/60 rounded-lg px-3 py-2 gap-2 w-48 focus-within:ring-2 focus-within:ring-primary-500/15 focus-within:border-primary-400 transition-all">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm text-dark outline-none w-full placeholder-gray-400 font-body"
              />
            </div>

            <LanguageSelector />

            <NotificationPanel />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
