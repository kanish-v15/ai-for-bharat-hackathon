import { NavLink, Outlet } from 'react-router-dom';
import { FileSearch, MessageCircle, ClipboardList } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

const NAV_ITEMS = [
  { to: '/lab-samjho', label: 'Lab Samjho', icon: FileSearch },
  { to: '/care-guide', label: 'Care Guide', icon: MessageCircle },
  { to: '/medscribe', label: 'MedScribe', icon: ClipboardList },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            SM
          </div>
          <span className="font-bold text-lg text-gray-800">SwasthyaMitra</span>
        </NavLink>
        <LanguageSelector />
      </header>

      {/* Content */}
      <main className="flex-1 p-4 pb-24">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 max-w-lg mx-auto">
        <div className="flex">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-gray-400 hover:text-gray-600'
                }`
              }
            >
              <Icon size={22} />
              <span>{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
