import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, User, Stethoscope, Clock, FileText, Edit3, Download,
  Phone, Heart, Shield, Pill, Activity, Trash2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getPatient, savePatient, deletePatientRecord, getPatientConsultations } from '../services/dataStore';
import { generatePatientPDF } from '../utils/generatePDF';
import { LANGUAGES } from '../utils/constants';
import ConsultPanel from '../components/medscribe/ConsultPanel';
import HistoryPanel from '../components/medscribe/HistoryPanel';
import DocumentsPanel from '../components/medscribe/DocumentsPanel';
import PatientModal from '../components/medscribe/PatientModal';

const AVATAR_GRADIENTS = [
  'from-primary-400 to-primary-600', 'from-india-green to-emerald-500',
  'from-amber-400 to-orange-500', 'from-rose-400 to-pink-500',
  'from-violet-400 to-purple-500', 'from-sky-400 to-blue-500',
];

const getInitials = (name) => name ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) : '??';
const getGradient = (name) => {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_GRADIENTS[Math.abs(hash) % AVATAR_GRADIENTS.length];
};

const TABS = [
  { id: 'details', label: 'Details', icon: User },
  { id: 'consult', label: 'Consult', icon: Stethoscope },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'documents', label: 'Documents', icon: FileText },
];

export default function PatientView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const [patient, setPatient] = useState(null);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'details');
  const [pdfMode, setPdfMode] = useState('latest');
  const [showEditModal, setShowEditModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    const p = getPatient(id);
    setPatient(p);
    setRefreshKey((k) => k + 1);
  }, [id]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!patient) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
          <User size={28} className="text-warm-gray/40" />
        </div>
        <p className="font-heading font-bold text-dark text-lg mb-2">Patient not found</p>
        <button onClick={() => navigate('/medscribe')}
          className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-heading font-bold text-xs hover:bg-primary-600 transition-all">
          <ArrowLeft size={14} /> Back to Patients
        </button>
      </div>
    );
  }

  const consultations = getPatientConsultations(patient.id);
  const langLabel = LANGUAGES[patient.language]?.labelEn || patient.language || '--';

  const handleGeneratePDF = () => {
    generatePatientPDF({
      patient,
      doctor: user?.profile || {},
      consultations,
      includeAllConsultations: pdfMode === 'all',
    });
  };

  const handleSavePatient = (form) => {
    savePatient(form);
    refresh();
    setShowEditModal(false);
    addNotification('Patient Updated', `${form.name} saved`, 'success');
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete ${patient.name}? This cannot be undone.`)) return;
    deletePatientRecord(patient.id);
    addNotification('Patient Deleted', `${patient.name} removed`, 'info');
    navigate('/medscribe');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Top Bar */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/medscribe')}
          className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-warm-gray hover:text-primary-500 hover:border-primary-300 transition-colors shadow-sm">
          <ArrowLeft size={16} />
        </button>
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getGradient(patient.name)} flex items-center justify-center shadow-md`}>
          <span className="text-white font-heading font-bold text-sm">{getInitials(patient.name)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-heading font-bold text-dark text-lg tracking-tight truncate">{patient.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {patient.age && <span className="text-xs text-warm-gray font-body">{patient.age} years</span>}
            {patient.gender && <span className="text-xs text-warm-gray font-body">{patient.gender}</span>}
            <span className="text-[10px] px-2 py-0.5 rounded-full font-heading font-medium bg-primary-50 text-primary-700">{langLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => setShowEditModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 text-warm-gray hover:text-primary-500 hover:border-primary-300 font-heading font-semibold text-xs transition-colors shadow-sm">
            <Edit3 size={13} /> Edit
          </button>
          <button onClick={handleDelete}
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-warm-gray hover:text-red-500 hover:border-red-300 transition-colors shadow-sm">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex border-b border-gray-100 px-3 pt-1 gap-0.5 overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-lg text-xs font-heading font-semibold transition-all whitespace-nowrap
                ${activeTab === id
                  ? 'bg-white text-primary-600 border border-gray-100 border-b-white -mb-px shadow-sm'
                  : 'text-warm-gray hover:text-dark hover:bg-gray-50/60'}`}>
              <Icon size={14} />
              {label}
              {id === 'history' && consultations.length > 0 && (
                <span className="text-[9px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-full font-bold">{consultations.length}</span>
              )}
              {id === 'documents' && (patient.labReports?.length || 0) > 0 && (
                <span className="text-[9px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-full font-bold">{patient.labReports.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {/* ─── Details Tab ─── */}
          {activeTab === 'details' && (
            <div className="space-y-5">
              {/* Patient Info Grid */}
              <div>
                <h3 className="font-heading font-bold text-dark text-sm mb-3">Patient Information</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { label: 'Age', value: patient.age ? `${patient.age} years` : '--', icon: User },
                    { label: 'Gender', value: patient.gender || '--', icon: User },
                    { label: 'Phone', value: patient.phone || '--', icon: Phone },
                    { label: 'Language', value: langLabel, icon: Activity },
                    { label: 'Blood Group', value: patient.bloodGroup || '--', icon: Heart },
                  ].map(({ label, value, icon: InfoIcon }) => (
                    <div key={label} className="bg-gray-50/60 rounded-xl px-3.5 py-3 border border-gray-100/60">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <InfoIcon size={11} className="text-warm-gray/60" />
                        <span className="text-[9px] text-warm-gray uppercase tracking-wider font-heading font-semibold">{label}</span>
                      </div>
                      <p className="font-heading font-bold text-dark text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Medical Info */}
              <div>
                <h3 className="font-heading font-bold text-dark text-sm mb-3">Medical History</h3>
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Allergies', value: patient.allergies, icon: Shield, emptyText: 'None reported', bgColor: 'bg-red-50/50', borderColor: 'border-red-100/60', iconColor: 'text-red-500' },
                    { label: 'Medical Conditions', value: patient.conditions, icon: Activity, emptyText: 'None reported', bgColor: 'bg-amber-50/50', borderColor: 'border-amber-100/60', iconColor: 'text-amber-500' },
                    { label: 'Current Medications', value: patient.medications, icon: Pill, emptyText: 'None reported', bgColor: 'bg-primary-50/50', borderColor: 'border-primary-100/60', iconColor: 'text-primary-500' },
                  ].map(({ label, value, icon: MedIcon, emptyText, bgColor, borderColor, iconColor }) => (
                    <div key={label} className={`${bgColor} rounded-xl px-3.5 py-3 border ${borderColor}`}>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <MedIcon size={12} className={iconColor} />
                        <span className="text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">{label}</span>
                      </div>
                      <p className={`font-body text-xs leading-relaxed ${value ? 'text-dark' : 'text-warm-gray/50 italic'}`}>
                        {value || emptyText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-center">
                  <p className="font-heading font-bold text-dark text-xl">{consultations.length}</p>
                  <p className="text-[10px] text-warm-gray font-heading font-medium mt-0.5">Consultations</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-center">
                  <p className="font-heading font-bold text-dark text-xl">{patient.labReports?.length || 0}</p>
                  <p className="text-[10px] text-warm-gray font-heading font-medium mt-0.5">Lab Reports</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-center">
                  <p className="font-heading font-bold text-dark text-xl">
                    {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '--'}
                  </p>
                  <p className="text-[10px] text-warm-gray font-heading font-medium mt-0.5">Since</p>
                </div>
              </div>

              {/* PDF Generation */}
              <div className="bg-gradient-to-r from-primary-50 to-blue-50/50 rounded-xl border border-primary-100/60 p-4">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h4 className="font-heading font-bold text-dark text-sm mb-1">Generate Patient PDF</h4>
                    <p className="text-[11px] text-warm-gray font-body">Download patient record with your clinic letterhead.</p>
                    <div className="flex items-center gap-3 mt-2.5">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="pdfMode" checked={pdfMode === 'latest'} onChange={() => setPdfMode('latest')}
                          className="w-3.5 h-3.5 text-primary-500 focus:ring-primary-300" />
                        <span className="text-[11px] font-heading font-medium text-dark">Latest only</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" name="pdfMode" checked={pdfMode === 'all'} onChange={() => setPdfMode('all')}
                          className="w-3.5 h-3.5 text-primary-500 focus:ring-primary-300" />
                        <span className="text-[11px] font-heading font-medium text-dark">All ({consultations.length})</span>
                      </label>
                    </div>
                  </div>
                  <button onClick={handleGeneratePDF}
                    disabled={consultations.length === 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 text-white font-heading font-bold text-xs hover:bg-primary-600 transition-all shadow-sm shadow-primary-500/20 disabled:opacity-40 disabled:cursor-not-allowed">
                    <Download size={14} /> Download PDF
                  </button>
                </div>
                {consultations.length === 0 && (
                  <p className="text-[10px] text-amber-600 font-body mt-2">Record a consultation first to generate a PDF.</p>
                )}
              </div>
            </div>
          )}

          {/* ─── Consult Tab ─── */}
          {activeTab === 'consult' && (
            <ConsultPanel patient={patient} onConsultationComplete={refresh} />
          )}

          {/* ─── History Tab ─── */}
          {activeTab === 'history' && (
            <HistoryPanel key={refreshKey} consultations={consultations} />
          )}

          {/* ─── Documents Tab ─── */}
          {activeTab === 'documents' && (
            <DocumentsPanel key={refreshKey} patient={patient} onRefresh={refresh} />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <PatientModal
          patient={patient}
          onSave={handleSavePatient}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}
