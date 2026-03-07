import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Globe, ChevronDown, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';

const NAV_LINKS = [
  { href: '#home', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#schemes', label: 'Govt Schemes' },
  { href: '#team', label: 'Team' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, setShowLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleCTA = () => {
    if (user) {
      navigate(user.role === 'doctor' ? '/doctor' : '/patient');
    } else {
      setShowLogin(true);
    }
  };

  const scrollTo = (id) => {
    setMobileOpen(false);
    const el = document.getElementById(id.replace('#', ''));
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 w-[95%] max-w-6xl rounded-2xl ${
      scrolled
        ? 'bg-white/90 backdrop-blur-xl shadow-lg border border-white/50'
        : 'bg-white/70 backdrop-blur-md shadow-sm border border-gray-200/40'
    }`}>
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5">
          <Logo size={42} />
          <span className="font-display font-bold text-lg"><span className="text-saffron-500">Swasthya</span><span className="text-india-green">Mitra</span></span>
        </NavLink>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(({ href, label }) => (
            <button
              key={href}
              onClick={() => scrollTo(href)}
              className="text-sm font-medium text-gray-600 hover:text-saffron-500 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCTA}
            className="bg-saffron-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-saffron-600 transition-colors shadow-md shadow-saffron-500/20"
          >
            {user ? 'Dashboard' : 'Get Started'}
          </button>
          <button
            className="md:hidden text-gray-600"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white rounded-b-2xl border-t border-gray-100 px-6 py-4 space-y-3">
          {NAV_LINKS.map(({ href, label }) => (
            <button
              key={href}
              onClick={() => scrollTo(href)}
              className="block w-full text-left text-sm font-medium text-gray-600 hover:text-saffron-500 py-2"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}
