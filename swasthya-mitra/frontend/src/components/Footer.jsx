import Logo from './Logo';

const SERVICE_LINKS = [
  { label: 'Lab Samjho', href: '#services' },
  { label: 'Care Guide', href: '#services' },
  { label: 'MedScribe', href: '#services' },
];

const QUICK_LINKS = [
  { label: 'About', href: '#about' },
  { label: 'Govt Schemes', href: '#schemes' },
  { label: 'Team', href: '#team' },
];

const SUPPORT_LINKS = [
  { label: 'Help Center', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
];

export default function Footer() {
  return (
    <footer className="bg-dark text-white pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Logo size={42} />
              <span className="font-display font-bold text-lg"><span className="text-saffron-400">Swasthya</span><span className="text-green-400">Mitra</span></span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">
              AI-powered healthcare assistant for every Indian citizen. Breaking language barriers, one conversation at a time.
            </p>
            <div className="flex gap-0 h-1.5 w-16 rounded-full overflow-hidden">
              <div className="flex-1 bg-saffron-500"></div>
              <div className="flex-1 bg-white"></div>
              <div className="flex-1 bg-india-green"></div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-gray-300 uppercase tracking-wider">Services</h4>
            <div className="space-y-3">
              {SERVICE_LINKS.map(({ label, href }) => (
                <a key={label} href={href} className="block text-sm text-gray-400 hover:text-saffron-400 transition-colors">{label}</a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-gray-300 uppercase tracking-wider">Quick Links</h4>
            <div className="space-y-3">
              {QUICK_LINKS.map(({ label, href }) => (
                <a key={label} href={href} className="block text-sm text-gray-400 hover:text-saffron-400 transition-colors">{label}</a>
              ))}
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-semibold text-sm mb-4 text-gray-300 uppercase tracking-wider">Support</h4>
            <div className="space-y-3">
              {SUPPORT_LINKS.map(({ label, href }) => (
                <a key={label} href={href} className="block text-sm text-gray-400 hover:text-saffron-400 transition-colors">{label}</a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 space-y-3">
          <p className="text-sm text-gray-500 text-center">
            &copy; 2026 <span className="text-saffron-400">Swasthya</span><span className="text-green-400">Mitra</span>. Made with &#10084; in India. All rights reserved.
          </p>
          <p className="text-xs text-gray-600 text-center max-w-2xl mx-auto">
            Disclaimer: <span className="text-saffron-400">Swasthya</span><span className="text-green-400">Mitra</span> provides AI-assisted health information. Always consult a qualified healthcare professional for medical decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
