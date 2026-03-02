import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Heart, Mic, FileText, ArrowRight, CheckCircle, Smartphone,
  MessageSquare, UserCheck, Languages, Shield, User, Stethoscope,
  Clock, Building2, Baby, Pill, Syringe, Monitor, Brain, Volume2,
  Zap, Database, CreditCard, Video, Activity, MapPin, Droplets, Star
} from 'lucide-react';

/* ─── Section Label ─── */
function SectionLabel({ text }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      <span className="w-2.5 h-2.5 bg-saffron-500 rounded-full shadow-lg shadow-saffron-500/30"></span>
      <span className="text-xs font-extrabold text-saffron-600 uppercase tracking-[0.15em] font-display">{text}</span>
    </div>
  );
}

/* ─── Hero ─── */
function HeroSection({ onGetStarted }) {
  return (
    <section id="home" className="relative pt-32 pb-20 overflow-hidden">
      {/* Rich background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-gradient-to-br from-saffron-500/8 to-transparent rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-gradient-to-tl from-india-green/6 to-transparent rounded-full blur-3xl translate-x-1/4 translate-y-1/4"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-saffron-500/3 via-transparent to-india-green/3 rounded-full blur-3xl"></div>
        {/* Floating circles */}
        <div className="absolute top-32 right-20 w-3 h-3 bg-saffron-400/30 rounded-full animate-float"></div>
        <div className="absolute top-60 left-20 w-2 h-2 bg-india-green/30 rounded-full animate-float-delay"></div>
        <div className="absolute bottom-40 right-40 w-4 h-4 bg-saffron-300/20 rounded-full animate-float"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative">
        {/* Left: Content */}
        <div className="animate-slide-up">
          <div className="inline-flex items-center gap-2.5 bg-white border border-saffron-100 rounded-full px-5 py-2 mb-8 shadow-sm">
            <span className="w-2 h-2 bg-saffron-500 rounded-full animate-pulse shadow-lg shadow-saffron-500/50"></span>
            <span className="text-xs font-bold text-saffron-700 tracking-wide">Powered by AI | Made in India</span>
          </div>

          <h1 className="font-display font-extrabold text-[3.2rem] lg:text-[3.8rem] text-dark leading-[1.1] mb-7 tracking-tight">
            Your AI Health<br />
            Companion for{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-saffron-500 to-saffron-600 bg-clip-text text-transparent">Bharat</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 10" fill="none">
                <path d="M0 8C40 0 80 0 100 4C120 8 160 2 200 6" stroke="#FF6B00" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
              </svg>
            </span>
            <span className="inline-flex items-center gap-1.5 ml-3 align-middle">
              <span className="w-8 h-8 bg-saffron-50 rounded-lg flex items-center justify-center"><Heart size={16} className="text-saffron-500" /></span>
              <span className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center"><Mic size={16} className="text-green-600" /></span>
              <span className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><FileText size={16} className="text-blue-600" /></span>
            </span>
          </h1>

          <p className="text-gray-500 text-lg leading-relaxed mb-10 max-w-lg">
            Breaking language barriers in healthcare. Get lab reports explained, ask health questions
            by voice, and enable doctors with AI documentation — all in your native language.
          </p>

          <div className="flex flex-wrap gap-4">
            <button onClick={onGetStarted} className="bg-gradient-to-r from-saffron-500 to-saffron-600 text-white px-8 py-4 rounded-full font-bold text-base hover:shadow-xl hover:shadow-saffron-500/30 hover:-translate-y-0.5 transition-all flex items-center gap-2.5">
              Get Started Free <ArrowRight size={18} />
            </button>
            <a href="#services" className="px-8 py-4 rounded-full font-bold text-gray-600 border-2 border-gray-200 hover:border-saffron-400 hover:text-saffron-600 hover:shadow-lg transition-all bg-white/80 backdrop-blur-sm">
              Explore Services
            </a>
          </div>
        </div>

        {/* Right: Phone Mockup */}
        <div className="relative flex justify-center overflow-visible">
          <div className="relative mr-4">
            {/* Phone */}
            <div className="w-[260px] bg-gradient-to-b from-gray-900 to-dark rounded-[2.8rem] p-3 shadow-2xl shadow-dark/40 animate-float relative z-10">
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-dark rounded-b-2xl z-20"></div>
              <div className="bg-cream rounded-[2.2rem] overflow-hidden">
                <div className="bg-gradient-to-r from-saffron-500 to-saffron-600 px-5 py-3.5 flex items-center justify-between text-white">
                  <span className="flex items-center gap-2 font-bold text-sm">
                    <Heart size={14} fill="currentColor" /> SwasthyaMitra
                  </span>
                  <Mic size={14} />
                </div>
                <div className="p-4 space-y-3 min-h-[300px] bg-gradient-to-b from-white to-cream">
                  <div className="bg-white rounded-2xl rounded-bl-md px-3.5 py-2.5 text-xs text-gray-700 shadow-sm max-w-[85%] border border-gray-50">
                    Namaste! How can I help you today?
                  </div>
                  <div className="bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-2xl rounded-br-md px-3.5 py-2.5 text-xs ml-auto max-w-[75%] shadow-md shadow-saffron-500/20">
                    Mera lab report samjhao
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-md px-3.5 py-2.5 text-xs text-gray-700 shadow-sm max-w-[85%] border border-gray-50">
                    Sure! Upload your report photo...
                  </div>
                  <div className="bg-gradient-to-r from-saffron-500 to-saffron-600 text-white rounded-2xl rounded-br-md px-3.5 py-2.5 text-xs ml-auto max-w-[55%] shadow-md shadow-saffron-500/20">
                    📸 report.jpg
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm max-w-[35%] border border-gray-50">
                    <div className="flex gap-1.5 items-center justify-center">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Cards */}
            <div className="absolute -top-8 -left-44 glass rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-2.5 animate-float-delay z-20">
              <div className="w-8 h-8 bg-saffron-50 rounded-lg flex items-center justify-center">
                <Languages size={16} className="text-saffron-500" />
              </div>
              <span className="text-xs font-bold text-dark">8+ Languages</span>
            </div>
            <div className="absolute bottom-20 -left-44 glass rounded-2xl px-4 py-2.5 shadow-xl flex items-center gap-2.5 animate-float z-20">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <Shield size={16} className="text-india-green" />
              </div>
              <span className="text-xs font-bold text-dark">HIPAA Secure</span>
            </div>

            {/* Glow behind phone */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gradient-to-r from-saffron-500/10 to-india-green/10 rounded-full blur-3xl -z-10"></div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-5xl mx-auto mt-20 px-6">
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl px-10 py-6 flex flex-wrap justify-around gap-8 shadow-xl shadow-gray-900/5 border border-white/50">
          {[
            { num: '8+', label: 'Indian Languages' },
            { num: '3', label: 'AI Services' },
            { num: '100%', label: 'Free for Citizens' },
            { num: '24/7', label: 'Always Available' },
          ].map(({ num, label }, i, arr) => (
            <div key={i} className="flex items-center gap-6">
              <div className="text-center">
                <span className="block font-display font-extrabold text-3xl bg-gradient-to-r from-saffron-500 to-saffron-600 bg-clip-text text-transparent">{num}</span>
                <span className="text-xs text-gray-400 font-medium">{label}</span>
              </div>
              {i < arr.length - 1 && <div className="hidden sm:block w-px h-10 bg-gray-200"></div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Initiative Banner ─── */
function InitiativeBanner() {
  return (
    <section className="bg-gradient-to-r from-dark via-gray-900 to-dark py-5">
      <div className="max-w-6xl mx-auto px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center text-saffron-400 font-display font-bold text-sm shadow-lg">PM</div>
          <div>
            <h3 className="text-white font-display font-bold text-sm">Digital India | Ayushman Bharat</h3>
            <p className="text-gray-400 text-xs">Empowering 1.4 Billion Indians with AI-Powered Healthcare</p>
          </div>
        </div>
        <div className="flex gap-0 h-7 w-14 rounded-sm overflow-hidden shadow-md">
          <div className="flex-1 bg-saffron-500"></div>
          <div className="flex-1 bg-white flex items-center justify-center text-[8px] text-blue-900">&#9784;</div>
          <div className="flex-1 bg-india-green"></div>
        </div>
      </div>
    </section>
  );
}

/* ─── About ─── */
function AboutSection() {
  return (
    <section id="about" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <SectionLabel text="About SwasthyaMitra" />
        <h2 className="font-display font-extrabold text-4xl lg:text-[2.8rem] text-dark leading-tight mb-12">
          AI Healthcare,<br />Built for Every Indian
        </h2>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Main dark card */}
          <div className="lg:col-span-3 bg-gradient-to-br from-gray-900 via-dark to-gray-900 rounded-[2rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-dark/30">
            <div className="absolute top-0 right-0 w-60 h-60 bg-saffron-500/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-india-green/5 rounded-full blur-3xl"></div>

            <div className="inline-flex items-center gap-2.5 bg-white/10 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 bg-india-green rounded-full animate-pulse shadow-lg shadow-india-green/50"></span>
              <span className="text-xs font-semibold text-gray-300">Serving All of Bharat</span>
            </div>

            <div className="flex justify-center my-8">
              <svg viewBox="0 0 200 230" className="w-52 h-52" fill="none">
                <path d="M100 25 L140 40 L160 70 L175 100 L170 130 L150 160 L130 185 L110 200 L100 210 L90 200 L70 185 L50 160 L30 130 L25 100 L40 70 L60 40 Z"
                  stroke="rgba(255,107,0,0.3)" strokeWidth="1.5" fill="rgba(255,107,0,0.03)" strokeDasharray="4,4" />
                <circle cx="100" cy="75" r="4" fill="#FF6B00"><animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite" /></circle>
                <circle cx="75" cy="125" r="4" fill="#138808"><animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite" begin="0.5s" /></circle>
                <circle cx="125" cy="100" r="4" fill="#FF6B00"><animate attributeName="r" values="3;7;3" dur="2s" repeatCount="indefinite" begin="1s" /></circle>
                <circle cx="90" cy="175" r="3" fill="#138808"><animate attributeName="r" values="2;5;2" dur="2s" repeatCount="indefinite" begin="1.5s" /></circle>
                <circle cx="140" cy="140" r="3" fill="#FF6B00"><animate attributeName="r" values="2;5;2" dur="2s" repeatCount="indefinite" begin="0.7s" /></circle>
              </svg>
            </div>

            <div className="flex justify-around mt-8 border-t border-white/10 pt-6">
              <div className="text-center">
                <span className="block font-display font-extrabold text-3xl text-saffron-400">28+</span>
                <span className="text-xs text-gray-500">States Covered</span>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="text-center">
                <span className="block font-display font-extrabold text-3xl text-saffron-400">24/7</span>
                <span className="text-xs text-gray-500">Available Always</span>
              </div>
            </div>
          </div>

          {/* Side cards */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-[1.5rem] p-7 border border-gray-100 shadow-lg shadow-gray-900/5">
              <h3 className="font-display font-bold text-xl text-dark mb-3">Our Mission</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                SwasthyaMitra bridges the gap between advanced healthcare and the common citizen.
                Whether you're a patient in a remote village or a doctor in a busy hospital,
                our AI speaks your language and understands your needs.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Mic, label: 'Voice-First Design', color: 'bg-saffron-50' },
                { icon: Languages, label: '8+ Indian Languages', color: 'bg-blue-50' },
                { icon: Smartphone, label: 'Works on Basic Phones', color: 'bg-green-50' },
                { icon: Shield, label: 'Data Privacy & Security', color: 'bg-purple-50' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 flex flex-col items-center text-center gap-3 shadow-md shadow-gray-900/5 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center`}>
                    <Icon size={20} className="text-saffron-500" />
                  </div>
                  <span className="text-xs font-bold text-gray-700">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorks() {
  const steps = [
    { icon: Smartphone, num: '01', title: 'Enter Phone Number', desc: 'Sign up with just your mobile number. No email or password needed.' },
    { icon: MessageSquare, num: '02', title: 'Verify with OTP', desc: 'Receive a one-time password on your phone. Quick & secure.' },
    { icon: UserCheck, num: '03', title: 'Select Your Role', desc: 'Choose Patient or Doctor. Each role gets tailored features.' },
    { icon: Languages, num: '04', title: 'Choose Language', desc: 'Select your preferred language. The entire app adapts to your choice.' },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <SectionLabel text="How It Works" />
          <h2 className="font-display font-extrabold text-4xl text-dark">Simple Steps to Get Started</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ icon: Icon, num, title, desc }) => (
            <div key={num} className="relative bg-gradient-to-b from-cream to-white rounded-[1.5rem] p-7 border border-gray-100 group hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className="w-14 h-14 bg-gradient-to-br from-saffron-50 to-saffron-100 rounded-2xl flex items-center justify-center mb-5 group-hover:shadow-lg group-hover:shadow-saffron-500/20 transition-shadow">
                <Icon size={24} className="text-saffron-500" />
              </div>
              <span className="absolute top-5 right-5 font-display font-extrabold text-4xl text-saffron-500/8">{num}</span>
              <h3 className="font-display font-bold text-lg text-dark mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Services ─── */
function ServicesSection() {
  const services = [
    {
      icon: FileText, num: '01', title: 'Lab Samjho', tagline: 'Lab Report Interpreter',
      desc: 'Upload a photo of your lab report. Our AI reads it, understands every value, and explains what it means in your language — with audio too!',
      tags: ['Photo Upload', 'OCR Reading', 'AI Analysis', 'Audio Summary'],
      roles: ['Patient', 'Doctor'],
      gradient: 'from-blue-50 to-white', border: 'border-blue-100',
      iconBg: 'bg-gradient-to-br from-blue-100 to-blue-200', iconColor: 'text-blue-600',
    },
    {
      icon: Mic, num: '02', title: 'Care Guide', tagline: 'Voice Health Q&A',
      desc: 'Just speak your health question in any Indian language. Our AI listens, understands, and responds with helpful guidance — by voice.',
      tags: ['Voice Input', 'Multi-Language', 'AI Response', 'Audio Reply'],
      roles: ['Patient'], featured: true,
      gradient: 'from-saffron-50 to-white', border: 'border-saffron-200',
      iconBg: 'bg-gradient-to-br from-saffron-100 to-saffron-200', iconColor: 'text-saffron-600',
    },
    {
      icon: Stethoscope, num: '03', title: 'MedScribe', tagline: 'Doctor Documentation AI',
      desc: 'Record your consultation. AI generates SOAP notes, extracts medical entities, and creates patient instructions in the native language.',
      tags: ['Audio Recording', 'SOAP Notes', 'Entity Extraction', 'Patient Instructions'],
      roles: ['Doctor'],
      gradient: 'from-emerald-50 to-white', border: 'border-emerald-100',
      iconBg: 'bg-gradient-to-br from-emerald-100 to-emerald-200', iconColor: 'text-emerald-600',
    },
  ];

  return (
    <section id="services" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <SectionLabel text="Our Services" />
        <h2 className="font-display font-extrabold text-4xl lg:text-[2.8rem] text-dark leading-tight mb-4">
          Three Powerful AI<br />Healthcare Tools
        </h2>
        <p className="text-gray-400 mb-12 max-w-xl text-lg">
          Each tool is designed for a specific healthcare need, accessible to both patients and doctors.
        </p>

        <div className="grid lg:grid-cols-3 gap-7">
          {services.map(({ icon: Icon, num, title, tagline, desc, tags, roles, featured, gradient, border, iconBg, iconColor }) => (
            <div key={title} className={`bg-gradient-to-b ${gradient} ${border} border-2 rounded-[1.5rem] p-7 transition-all hover:shadow-2xl hover:-translate-y-2 ${featured ? 'ring-2 ring-saffron-500/20 shadow-xl shadow-saffron-500/10' : 'shadow-lg shadow-gray-900/5'}`}>
              <div className="flex items-center justify-between mb-5">
                <div className={`w-14 h-14 ${iconBg} rounded-2xl flex items-center justify-center shadow-sm`}>
                  <Icon size={24} className={iconColor} />
                </div>
                <span className="font-display font-extrabold text-sm text-gray-300">({num})</span>
              </div>
              <h3 className="font-display font-extrabold text-xl text-dark">{title}</h3>
              <p className="text-sm font-medium text-gray-400 mb-3">{tagline}</p>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">{desc}</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {tags.map(tag => (
                  <span key={tag} className="text-[10px] px-3 py-1 rounded-full bg-white/80 text-gray-500 font-semibold border border-gray-100">{tag}</span>
                ))}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex gap-2">
                  {roles.map(role => (
                    <span key={role} className={`text-[10px] px-3 py-1.5 rounded-full font-bold ${
                      role === 'Patient' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>{role}</span>
                  ))}
                </div>
                <div className="w-9 h-9 bg-saffron-50 rounded-xl flex items-center justify-center hover:bg-saffron-100 transition-colors cursor-pointer">
                  <ArrowRight size={16} className="text-saffron-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Roles ─── */
function RolesSection({ onGetStarted }) {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <SectionLabel text="Who Can Use" />
          <h2 className="font-display font-extrabold text-4xl text-dark">Designed for Everyone</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            { role: 'Patient', icon: User, color: 'from-blue-50 to-blue-100/30', border: 'border-blue-200', iconBg: 'bg-blue-100', iconColor: 'text-blue-600',
              desc: 'Access healthcare guidance in your own language, anytime, anywhere.',
              features: ['Lab Samjho - Understand lab reports', 'Care Guide - Ask health questions by voice', 'View history of all interactions', 'Government health scheme information'] },
            { role: 'Doctor', icon: Stethoscope, color: 'from-purple-50 to-purple-100/30', border: 'border-purple-200', iconBg: 'bg-purple-100', iconColor: 'text-purple-600',
              desc: 'Reduce documentation burden and communicate better with patients.',
              features: ['MedScribe - AI consultation notes', 'Lab Samjho - Quick report analysis', 'Patient instructions in native language', 'Medical entity extraction'] },
          ].map(({ role, icon: Icon, color, border, iconBg, iconColor, desc, features }) => (
            <div key={role} className={`bg-gradient-to-br ${color} ${border} border-2 rounded-[2rem] p-9 hover:shadow-2xl hover:-translate-y-1 transition-all`}>
              <div className={`w-16 h-16 ${iconBg} rounded-2xl flex items-center justify-center mb-5 shadow-sm`}>
                <Icon size={30} className={iconColor} />
              </div>
              <h3 className="font-display font-extrabold text-2xl text-dark mb-2">For {role}s</h3>
              <p className="text-sm text-gray-500 mb-6">{desc}</p>
              <ul className="space-y-3 mb-8">
                {features.map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-gray-600">
                    <CheckCircle size={18} className="text-india-green mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button onClick={onGetStarted} className="w-full bg-gradient-to-r from-saffron-500 to-saffron-600 text-white px-6 py-3.5 rounded-full font-bold hover:shadow-lg hover:shadow-saffron-500/25 transition-all">
                Join as {role}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Health Card ─── */
function HealthCardSection() {
  return (
    <section className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <SectionLabel text="Unified Health Record" />
        <h2 className="font-display font-extrabold text-4xl lg:text-[2.8rem] text-dark leading-tight mb-4">
          One Card. One Patient.<br />All Services Connected.
        </h2>
        <p className="text-gray-400 mb-14 max-w-2xl text-lg">
          Every interaction across Lab Samjho, Care Guide, and MedScribe feeds into a single patient profile — linked to ABHA.
        </p>

        <div className="grid lg:grid-cols-2 gap-14 items-start">
          <div className="flex justify-center">
            <div className="relative" style={{ perspective: '1000px' }}>
              <div className="w-[340px] bg-gradient-to-br from-gray-900 via-dark to-gray-800 rounded-[1.8rem] p-7 text-white shadow-2xl shadow-dark/50 relative overflow-hidden" style={{ transform: 'rotateY(-5deg) rotateX(2deg)' }}>
                <div className="tricolor rounded-full mb-5"></div>
                <div className="flex items-center justify-between mb-7">
                  <div className="flex items-center gap-2.5">
                    <Heart size={18} className="text-saffron-400" fill="currentColor" />
                    <span className="font-display font-bold">SwasthyaMitra</span>
                  </div>
                  <div className="flex gap-0 h-4 w-10 rounded-sm overflow-hidden">
                    <div className="flex-1 bg-saffron-500"></div>
                    <div className="flex-1 bg-white"></div>
                    <div className="flex-1 bg-india-green"></div>
                  </div>
                </div>
                <div className="flex items-center gap-4 mb-7">
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-600 to-gray-700 rounded-xl flex items-center justify-center shadow-inner">
                    <User size={24} className="text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">Ramesh Kumar</h3>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5"><CreditCard size={11} /> ABHA: 91-XXXX-XXXX-XXXX</p>
                  </div>
                </div>
                <div className="flex gap-2 mb-5">
                  {[{ icon: Languages, label: 'Hindi' }, { icon: Droplets, label: 'B+' }, { icon: MapPin, label: 'Bihar' }].map(({ icon: Icon, label }) => (
                    <span key={label} className="text-[10px] bg-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm"><Icon size={10} /> {label}</span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                  {[{ n: '12', l: 'Lab Reports' }, { n: '8', l: 'Q&A Sessions' }, { n: '5', l: 'Doctor Visits' }].map(({ n, l }) => (
                    <div key={l} className="text-center">
                      <span className="block font-display font-extrabold text-lg text-saffron-400">{n}</span>
                      <span className="text-[9px] text-gray-500">{l}</span>
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-7 right-7 w-10 h-7 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-sm opacity-40 shadow-inner">
                  <div className="flex flex-col gap-0.5 p-1.5"><span className="block h-px bg-yellow-300/50"></span><span className="block h-px bg-yellow-300/50"></span><span className="block h-px bg-yellow-300/50"></span></div>
                </div>
              </div>
              <div className="absolute -bottom-4 left-4 right-4 h-8 bg-dark/20 rounded-[1.5rem] blur-xl -z-10"></div>
            </div>
          </div>

          <div>
            <h3 className="font-display font-bold text-xl text-dark mb-8">How Your Records Stay Connected</h3>
            <div className="space-y-1">
              {[
                { icon: FileText, color: 'bg-blue-100 text-blue-600', title: 'Lab Samjho', desc: 'Upload report → AI reads → Result stored. Next time, AI compares with past reports automatically.' },
                { icon: Mic, color: 'bg-green-100 text-green-600', title: 'Care Guide', desc: '"Is my sugar normal?" → AI pulls your latest lab report and gives a personalized answer by voice.' },
                { icon: Stethoscope, color: 'bg-purple-100 text-purple-600', title: 'MedScribe', desc: 'Doctor sees your full history — past reports, Q&A concerns, prior prescriptions. No repetition needed.' },
                { icon: Clock, color: 'bg-saffron-100 text-saffron-600', title: 'Health Timeline', desc: 'Every interaction creates a unified record. Patient and doctor both see the complete picture.' },
              ].map(({ icon: Icon, color, title, desc }, i) => (
                <div key={title} className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} shrink-0 shadow-sm`}>
                      <Icon size={20} />
                    </div>
                    {i < 3 && <div className="w-0.5 flex-1 bg-gradient-to-b from-gray-200 to-transparent my-2"></div>}
                  </div>
                  <div className="pb-6">
                    <h4 className="font-display font-bold text-dark text-lg">{title}</h4>
                    <p className="text-sm text-gray-400 leading-relaxed mt-1">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Schemes ─── */
function SchemesSection() {
  const schemes = [
    { icon: Building2, title: 'Ayushman Bharat (PM-JAY)', desc: 'Free health coverage up to Rs. 5 lakh per family per year for secondary & tertiary care.', tag: 'Health Insurance' },
    { icon: Baby, title: 'Janani Suraksha Yojana', desc: 'Cash assistance for institutional delivery to reduce maternal and infant mortality.', tag: 'Maternity Care' },
    { icon: Pill, title: 'PM Bhartiya Janaushadhi', desc: 'Quality generic medicines at affordable prices through dedicated stores across India.', tag: 'Affordable Medicine' },
    { icon: Heart, title: 'National Health Mission', desc: 'Strengthening healthcare delivery across rural and urban India with focus on primary health centres.', tag: 'Rural Healthcare' },
    { icon: Syringe, title: 'Mission Indradhanush', desc: 'Full immunization coverage for children and pregnant women across India.', tag: 'Immunization' },
    { icon: Monitor, title: 'Ayushman Bharat Digital Mission', desc: 'Creating digital health IDs and health records for every citizen under ABDM.', tag: 'Digital Health' },
  ];

  return (
    <section id="schemes" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <SectionLabel text="Government Initiatives" />
        <h2 className="font-display font-extrabold text-4xl lg:text-[2.8rem] text-dark leading-tight mb-4">
          Healthcare Schemes<br />for Every Citizen
        </h2>
        <p className="text-gray-400 mb-12 max-w-xl text-lg">Know your rights. Access government healthcare schemes designed for your welfare.</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map(({ icon: Icon, title, desc, tag }) => (
            <div key={title} className="bg-white rounded-[1.5rem] p-7 border border-gray-100 shadow-lg shadow-gray-900/5 hover:shadow-2xl hover:-translate-y-1 transition-all group">
              <div className="w-13 h-13 bg-gradient-to-br from-saffron-50 to-saffron-100 rounded-2xl flex items-center justify-center mb-5 w-14 h-14 group-hover:shadow-lg group-hover:shadow-saffron-500/15 transition-shadow">
                <Icon size={24} className="text-saffron-500" />
              </div>
              <h3 className="font-display font-bold text-dark text-lg mb-2">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">{desc}</p>
              <span className="inline-block text-[10px] px-3.5 py-1.5 rounded-full bg-saffron-50 text-saffron-600 font-bold">{tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Tech Stack ─── */
function TechSection() {
  const techs = [
    { icon: Brain, label: 'Amazon Bedrock' }, { icon: FileText, label: 'Amazon Textract' },
    { icon: Mic, label: 'Amazon Transcribe' }, { icon: Languages, label: 'Amazon Translate' },
    { icon: Volume2, label: 'Amazon Polly' }, { icon: Stethoscope, label: 'Comprehend Medical' },
    { icon: Zap, label: 'AWS Lambda' }, { icon: Database, label: 'DynamoDB' },
  ];

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 mb-10">
        <div className="text-center">
          <SectionLabel text="Technology" />
          <h2 className="font-display font-extrabold text-4xl text-dark">Powered by AWS</h2>
          <p className="text-gray-400 mt-3 text-lg">Built on world-class cloud infrastructure for reliability, scale, and security.</p>
        </div>
      </div>
      <div className="relative overflow-hidden py-4">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10"></div>
        <div className="marquee-track">
          {[...techs, ...techs].map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-3 bg-cream px-6 py-3.5 rounded-full border border-gray-100 shrink-0 shadow-sm hover:shadow-md transition-shadow">
              <Icon size={20} className="text-saffron-500" />
              <span className="text-sm font-bold text-dark whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Team ─── */
function TeamSection() {
  const members = [
    { initial: 'K', name: 'Kanish', role: 'Lab Samjho Lead', desc: 'Building the AI-powered lab report interpretation engine with OCR and multilingual summaries.', tag: 'Lab Samjho', color: 'from-blue-400 to-blue-600' },
    { initial: 'S', name: 'Sharmi', role: 'Care Guide Lead', desc: 'Designing the voice-first health Q&A system with natural language understanding.', tag: 'Care Guide', color: 'from-saffron-400 to-saffron-600' },
    { initial: 'S', name: 'Saravana', role: 'MedScribe Lead', desc: 'Creating the AI documentation assistant for doctors with SOAP notes and entity extraction.', tag: 'MedScribe', color: 'from-emerald-400 to-emerald-600' },
  ];

  return (
    <section id="team" className="py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <SectionLabel text="Our Team" />
          <h2 className="font-display font-extrabold text-4xl text-dark">The Minds Behind SwasthyaMitra</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {members.map(({ initial, name, role, desc, tag, color }) => (
            <div key={name} className="bg-white rounded-[2rem] p-8 border border-gray-100 text-center shadow-lg shadow-gray-900/5 hover:shadow-2xl hover:-translate-y-2 transition-all">
              <div className={`w-18 h-18 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mx-auto mb-5 w-[4.5rem] h-[4.5rem] shadow-lg`}>
                <span className="text-white font-display font-extrabold text-2xl">{initial}</span>
              </div>
              <h3 className="font-display font-extrabold text-dark text-xl">{name}</h3>
              <p className="text-sm text-saffron-500 font-bold mb-3">{role}</p>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">{desc}</p>
              <span className="inline-block text-[10px] px-4 py-1.5 rounded-full bg-saffron-50 text-saffron-600 font-bold">{tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTASection({ onGetStarted }) {
  return (
    <section className="py-24">
      <div className="max-w-4xl mx-auto px-6">
        <div className="bg-gradient-to-br from-saffron-500 via-saffron-600 to-saffron-700 rounded-[2rem] p-12 lg:p-20 text-center text-white relative overflow-hidden shadow-2xl shadow-saffron-500/30">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-6 left-6 w-40 h-40 border-2 border-white/30 rounded-full"></div>
            <div className="absolute bottom-6 right-6 w-56 h-56 border-2 border-white/30 rounded-full"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-white/20 rounded-full"></div>
          </div>
          <div className="relative">
            <h2 className="font-display font-extrabold text-4xl lg:text-5xl mb-5 leading-tight">
              Ready to Experience<br />AI Healthcare?
            </h2>
            <p className="text-white/70 mb-10 max-w-lg mx-auto text-lg">
              Join thousands of Indians already using SwasthyaMitra for better health understanding.
            </p>
            <button onClick={onGetStarted} className="bg-white text-saffron-600 px-10 py-5 rounded-full font-extrabold text-lg hover:shadow-2xl hover:shadow-white/30 hover:-translate-y-1 transition-all">
              Start Now — It's Free
            </button>
            <p className="text-sm text-white/50 mt-5">No email needed. Just your phone number.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Main Home ─── */
export default function Home() {
  const { setShowLogin, user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate(user.role === 'doctor' ? '/doctor' : '/patient');
    } else {
      setShowLogin(true);
    }
  };

  return (
    <div>
      <HeroSection onGetStarted={handleGetStarted} />
      <InitiativeBanner />
      <AboutSection />
      <HowItWorks />
      <ServicesSection />
      <RolesSection onGetStarted={handleGetStarted} />
      <HealthCardSection />
      <SchemesSection />
      <TechSection />
      <TeamSection />
      <CTASection onGetStarted={handleGetStarted} />
    </div>
  );
}
