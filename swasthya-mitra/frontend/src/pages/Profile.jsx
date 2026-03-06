import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { calculateProfileCompletion, FIELD_LABELS } from '../utils/profileHelpers';
import PatientProfileForm from '../components/profile/PatientProfileForm';
import DoctorProfileForm from '../components/profile/DoctorProfileForm';
import AbhaLinkFlow from '../components/profile/AbhaLinkFlow';
import { getInteractions } from '../services/dataStore';
import {
  User, Heart, FileText, Shield, Building2, Briefcase, Phone, Mail,
  CheckCircle, Droplets, AlertTriangle, Pill, Activity, Calendar,
  ChevronDown, ChevronUp, Edit3, MapPin, UserCheck, Stethoscope,
  Clock, IndianRupee, Languages, BadgeCheck, GraduationCap,
} from 'lucide-react';

/* ── Tab Configurations ── */
const PATIENT_TABS = [
  { key: 'overview', label: 'Overview', icon: User },
  { key: 'health', label: 'Health Info', icon: Heart },
  { key: 'documents', label: 'Documents', icon: FileText },
  { key: 'abha', label: 'ABHA', icon: Shield },
];

const DOCTOR_TABS = [
  { key: 'overview', label: 'Overview', icon: User },
  { key: 'clinic', label: 'Clinic', icon: Building2 },
  { key: 'practice', label: 'Practice', icon: Briefcase },
];

/* ── Info Field Component (like screenshot's field:value rows) ── */
function InfoField({ label, value, icon: Icon }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500 font-body mb-0.5">{label}</p>
      <div className="flex items-center gap-1.5">
        {Icon && value && <Icon size={13} className="text-gray-400 shrink-0" />}
        <p className="text-sm font-body text-dark font-medium truncate">
          {value || <span className="text-gray-300 italic font-normal">Not specified</span>}
        </p>
      </div>
    </div>
  );
}

/* ── Section Card (grouped fields with header) ── */
function SectionCard({ title, children }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-heading font-bold text-dark text-sm mb-4">{title}</h3>
      {children}
    </div>
  );
}

/* ── Patient Overview Tab (ALL sections) ── */
function PatientOverviewTab({ profile, phone }) {
  return (
    <div className="space-y-5">
      <SectionCard title="Personal Information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <InfoField label="Full Name" value={profile.fullName} />
          <InfoField label="Date of Birth" value={profile.dateOfBirth} />
          <InfoField label="Gender" value={profile.gender} />
          <InfoField label="Email" value={profile.email} icon={Mail} />
          <InfoField label="Phone" value={phone ? `+91 ${phone}` : ''} icon={Phone} />
        </div>
      </SectionCard>

      <SectionCard title="Address">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <InfoField label="District" value={profile.address?.district} />
          <InfoField label="State" value={profile.address?.state} />
          <InfoField label="PIN Code" value={profile.address?.pin} />
        </div>
      </SectionCard>

      <SectionCard title="Health Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <InfoField label="Blood Group" value={profile.bloodGroup} icon={Droplets} />
          <InfoField label="Known Allergies" value={profile.knownAllergies} icon={AlertTriangle} />
          <InfoField label="Chronic Conditions" value={profile.chronicConditions} icon={Activity} />
          <InfoField label="Current Medications" value={profile.currentMedications} icon={Pill} />
        </div>
      </SectionCard>

      <SectionCard title="Emergency Contact">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <InfoField label="Contact Name" value={profile.emergencyContactName} />
          <InfoField label="Contact Phone" value={profile.emergencyContactPhone} icon={Phone} />
        </div>
      </SectionCard>

      <SectionCard title="Additional Information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <InfoField label="Family Doctor" value={profile.familyDoctorName} />
          <InfoField label="Doctor Phone" value={profile.familyDoctorPhone} icon={Phone} />
          <InfoField label="Insurance Info" value={profile.insuranceInfo} />
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Patient Health Tab (only health-specific fields) ── */
function PatientHealthTab({ profile }) {
  return (
    <div className="space-y-5">
      <SectionCard title="Health Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <InfoField label="Blood Group" value={profile.bloodGroup} icon={Droplets} />
          <InfoField label="Known Allergies" value={profile.knownAllergies} icon={AlertTriangle} />
          <InfoField label="Chronic Conditions" value={profile.chronicConditions} icon={Activity} />
          <InfoField label="Current Medications" value={profile.currentMedications} icon={Pill} />
        </div>
      </SectionCard>

      <SectionCard title="Emergency Contact">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <InfoField label="Contact Name" value={profile.emergencyContactName} />
          <InfoField label="Contact Phone" value={profile.emergencyContactPhone} icon={Phone} />
          <InfoField label="Family Doctor" value={profile.familyDoctorName} />
          <InfoField label="Doctor Phone" value={profile.familyDoctorPhone} icon={Phone} />
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Doctor Overview Tab (ALL sections) ── */
function DoctorOverviewTab({ profile, phone }) {
  return (
    <div className="space-y-5">
      <SectionCard title="Personal Information">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <InfoField label="Full Name" value={profile.fullName} />
          <InfoField label="Email" value={profile.email} icon={Mail} />
          <InfoField label="Phone" value={phone ? `+91 ${phone}` : ''} icon={Phone} />
        </div>
      </SectionCard>

      <SectionCard title="Registration & Credentials">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <InfoField label="Medical Reg. Number" value={profile.medicalRegNumber} icon={BadgeCheck} />
          <InfoField label="Registration Council" value={profile.registrationCouncil} />
          <InfoField label="Specialization" value={profile.specialization} icon={Stethoscope} />
          <InfoField label="Qualification" value={profile.qualification} icon={GraduationCap} />
        </div>
      </SectionCard>

      <SectionCard title="Clinic / Hospital">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <InfoField label="Name" value={profile.clinicHospitalName} icon={Building2} />
          <InfoField label="District" value={profile.clinicAddress?.district} icon={MapPin} />
          <InfoField label="State" value={profile.clinicAddress?.state} />
          <InfoField label="PIN Code" value={profile.clinicAddress?.pin} />
        </div>
      </SectionCard>

      <SectionCard title="Practice Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <InfoField label="Years of Experience" value={profile.yearsOfExperience ? `${profile.yearsOfExperience} years` : ''} icon={Clock} />
          <InfoField label="Consultation Fee" value={profile.consultationFee ? `Rs. ${profile.consultationFee}` : ''} icon={IndianRupee} />
          <InfoField label="Languages Spoken" value={profile.availableLanguages} icon={Languages} />
          <InfoField label="Working Hours" value={profile.workingHours} icon={Calendar} />
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Doctor Clinic Tab (only clinic fields) ── */
function DoctorClinicTab({ profile }) {
  return (
    <div className="space-y-5">
      <SectionCard title="Clinic / Hospital">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <InfoField label="Name" value={profile.clinicHospitalName} icon={Building2} />
          <InfoField label="District" value={profile.clinicAddress?.district} icon={MapPin} />
          <InfoField label="State" value={profile.clinicAddress?.state} />
          <InfoField label="PIN Code" value={profile.clinicAddress?.pin} />
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Doctor Practice Tab (only practice fields) ── */
function DoctorPracticeTab({ profile }) {
  return (
    <div className="space-y-5">
      <SectionCard title="Practice Details">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
          <InfoField label="Years of Experience" value={profile.yearsOfExperience ? `${profile.yearsOfExperience} years` : ''} icon={Clock} />
          <InfoField label="Consultation Fee" value={profile.consultationFee ? `Rs. ${profile.consultationFee}` : ''} icon={IndianRupee} />
          <InfoField label="Languages Spoken" value={profile.availableLanguages} icon={Languages} />
          <InfoField label="Working Hours" value={profile.workingHours} icon={Calendar} />
        </div>
      </SectionCard>
    </div>
  );
}

/* ── Documents Tab ── */
function DocumentsTab() {
  const reports = getInteractions('lab_report') || [];
  const [expandedId, setExpandedId] = useState(null);

  if (reports.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileText size={24} className="text-gray-300" />
        </div>
        <h3 className="font-heading font-bold text-dark text-sm">No Documents Yet</h3>
        <p className="font-body text-xs text-gray-500 mt-1">
          Upload a lab report in Lab Samjho to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <div key={report.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <button
            onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
            className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 bg-primary-50 rounded-lg flex items-center justify-center shrink-0">
              <FileText size={16} className="text-primary-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading font-bold text-sm text-dark truncate">{report.title || 'Lab Report'}</p>
              <p className="text-[11px] text-gray-500 font-body">
                {report.date ? new Date(report.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
                {report.data?.parameters && ` · ${report.data.parameters.length} parameters`}
              </p>
            </div>
            {expandedId === report.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {expandedId === report.id && report.summary && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <p className="text-xs font-body text-gray-500 mt-3 leading-relaxed">{report.summary}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ── ABHA Tab ── */
function AbhaTab({ user, linkAbha, updateProfile }) {
  const [showFlow, setShowFlow] = useState(false);

  const handleAbhaComplete = (abhaId, data) => {
    linkAbha(abhaId);
    if (data) updateProfile(data);
    setShowFlow(false);
  };

  if (user?.abhaLinked) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4 ring-emerald-100">
          <CheckCircle size={28} className="text-india-green" />
        </div>
        <h3 className="font-heading font-bold text-dark text-base">ABHA Linked</h3>
        <p className="font-body text-sm text-gray-500 mt-1">ID: {user.abhaId}</p>
        <p className="font-body text-xs text-gray-500 mt-2">
          Your Ayushman Bharat Health Account is connected
        </p>
      </div>
    );
  }

  if (showFlow) {
    return (
      <AbhaLinkFlow
        onComplete={handleAbhaComplete}
        onSkip={() => setShowFlow(false)}
        userPhone={user?.phone || ''}
      />
    );
  }

  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4 ring-primary-100">
        <Shield size={28} className="text-primary-500" />
      </div>
      <h3 className="font-heading font-bold text-dark text-base">Link Your ABHA ID</h3>
      <p className="font-body text-xs text-gray-500 mt-1 max-w-sm mx-auto">
        Connect your Ayushman Bharat Health Account to auto-fill your profile and access unified health records
      </p>
      <button
        onClick={() => setShowFlow(true)}
        className="mt-5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-heading font-bold text-sm hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg shadow-primary-500/20"
      >
        <Shield size={14} className="inline mr-2" />
        Link ABHA Now
      </button>
    </div>
  );
}

/* ── Main Profile Page ── */
export default function Profile() {
  const { user, updateProfile, linkAbha } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [editing, setEditing] = useState(false);

  const isDoctor = user?.role === 'doctor';
  const completion = calculateProfileCompletion(user?.role, user?.profile);
  const tabs = isDoctor ? DOCTOR_TABS : PATIENT_TABS;
  const profile = user?.profile || {};

  const handleSave = (formData) => {
    updateProfile(formData);
    setEditing(false);
  };

  const renderTabContent = () => {
    // Edit mode — show voice-based form
    if (editing && activeTab === 'overview') {
      if (isDoctor) {
        return (
          <DoctorProfileForm
            initialData={profile}
            onSave={handleSave}
            mode="edit"
            phone={user?.phone || ''}
          />
        );
      }
      return (
        <PatientProfileForm
          initialData={profile}
          onSave={handleSave}
          mode="edit"
          phone={user?.phone || ''}
        />
      );
    }

    if (isDoctor) {
      switch (activeTab) {
        case 'overview':
          return <DoctorOverviewTab profile={profile} phone={user?.phone} />;
        case 'clinic':
          return <DoctorClinicTab profile={profile} />;
        case 'practice':
          return <DoctorPracticeTab profile={profile} />;
        default:
          return null;
      }
    }

    // Patient tabs
    switch (activeTab) {
      case 'overview':
        return <PatientOverviewTab profile={profile} phone={user?.phone} />;
      case 'health':
        return <PatientHealthTab profile={profile} />;
      case 'documents':
        return <DocumentsTab />;
      case 'abha':
        return <AbhaTab user={user} linkAbha={linkAbha} updateProfile={updateProfile} />;
      default:
        return null;
    }
  };

  return (
    <div className="-mx-4 sm:-mx-6 -my-5 min-h-[calc(100vh-64px)] flex flex-col bg-white">
      {/* ── Header ── */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md">
              {(profile.fullName || user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-heading font-bold text-dark text-lg">
                  {profile.fullName || user?.name || 'Your Profile'}
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-heading font-semibold">
                  Active
                </span>
              </div>
              <div className="flex items-center gap-3 mt-0.5">
                {user?.phone && (
                  <span className="text-xs text-gray-500 font-body flex items-center gap-1">
                    <Phone size={11} /> +91 {user.phone}
                  </span>
                )}
                {profile.email && (
                  <span className="text-xs text-gray-500 font-body flex items-center gap-1">
                    <Mail size={11} /> {profile.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {activeTab === 'overview' && !editing && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-500 text-white font-heading font-semibold text-xs hover:bg-primary-600 transition-colors shadow-sm"
              >
                <Edit3 size={13} />
                Edit Profile
              </button>
            )}
            {editing && (
              <button
                onClick={() => setEditing(false)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 text-gray-600 font-heading font-semibold text-xs hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Completion bar */}
        <div className="mt-3 flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-xs">
            <div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${completion.percentage}%` }}
            />
          </div>
          <span className="text-[11px] font-heading font-semibold text-gray-500">
            {completion.percentage}% complete
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-heading font-semibold uppercase">
            {user?.role}
          </span>
        </div>
      </div>

      {/* ── Body: Vertical Tabs + Content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Tabs */}
        <div className="w-48 shrink-0 border-r border-gray-200 py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setEditing(false); }}
                className={`w-full flex items-center gap-2.5 px-5 py-2.5 text-left text-sm font-heading font-medium transition-all ${
                  isActive
                    ? 'bg-primary-50 text-primary-700 border-l-3 border-primary-500 font-semibold'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-dark border-l-3 border-transparent'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Right Content Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}
