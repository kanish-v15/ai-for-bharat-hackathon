import { useState } from 'react';
import {
  User, Stethoscope, Clock, FileText, Edit3, Download,
  Phone, Heart, Shield, Pill, Activity,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getPatientConsultations } from '../../services/dataStore';
import { generatePatientPDF } from '../../utils/generatePDF';
import { LANGUAGES } from '../../utils/constants';
import ConsultPanel from './ConsultPanel';
import HistoryPanel from './HistoryPanel';
import DocumentsPanel from './DocumentsPanel';

const TABS = [
  { id: 'details', label: 'Details', icon: User },
  { id: 'consult', label: 'Consult', icon: Stethoscope },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'documents', label: 'Documents', icon: FileText },
];

export default function PatientDetail({ patient, onEdit, onRefresh, initialTab }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'details');
  const [pdfMode, setPdfMode] = useState('latest'); // 'latest' | 'all'
  const { user } = useAuth();

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

  return (
    <div className="bg-gray-50/50 rounded-xl border border-gray-100">
      {/* Tab Bar */}
      <div className="flex border-b border-gray-100 px-2 pt-2 gap-1 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg text-[11px] font-heading font-semibold transition-all whitespace-nowrap
              ${activeTab === id
                ? 'bg-white text-primary-600 border border-gray-100 border-b-white -mb-px shadow-sm'
                : 'text-warm-gray hover:text-dark hover:bg-white/50'}`}>
            <Icon size={13} />
            {label}
            {id === 'history' && consultations.length > 0 && (
              <span className="text-[9px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-full font-bold ml-0.5">{consultations.length}</span>
            )}
            {id === 'documents' && (patient.labReports?.length || 0) > 0 && (
              <span className="text-[9px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded-full font-bold ml-0.5">{patient.labReports.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Patient Info Card */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-heading font-bold text-dark text-sm">Patient Information</h4>
                <button onClick={() => onEdit?.(patient)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-heading font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors border border-primary-100">
                  <Edit3 size={10} /> Edit
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Age', value: patient.age ? `${patient.age} years` : '--', icon: User },
                  { label: 'Gender', value: patient.gender || '--', icon: User },
                  { label: 'Phone', value: patient.phone || '--', icon: Phone },
                  { label: 'Language', value: langLabel, icon: Activity },
                  { label: 'Blood Group', value: patient.bloodGroup || '--', icon: Heart },
                ].map(({ label, value, icon: InfoIcon }) => (
                  <div key={label} className="bg-gray-50/60 rounded-lg px-3 py-2.5 border border-gray-100/60">
                    <div className="flex items-center gap-1.5 mb-1">
                      <InfoIcon size={10} className="text-warm-gray/60" />
                      <span className="text-[9px] text-warm-gray uppercase tracking-wider font-heading font-semibold">{label}</span>
                    </div>
                    <p className="font-heading font-bold text-dark text-xs">{value}</p>
                  </div>
                ))}
              </div>

              {/* Medical info */}
              <div className="mt-3 space-y-2">
                {[
                  { label: 'Allergies', value: patient.allergies, icon: Shield, emptyText: 'None reported', color: 'text-red-500' },
                  { label: 'Medical Conditions', value: patient.conditions, icon: Activity, emptyText: 'None reported', color: 'text-amber-500' },
                  { label: 'Current Medications', value: patient.medications, icon: Pill, emptyText: 'None reported', color: 'text-primary-500' },
                ].map(({ label, value, icon: MedIcon, emptyText, color }) => (
                  <div key={label} className="flex items-start gap-2.5 px-1">
                    <MedIcon size={13} className={`${color} mt-0.5 shrink-0`} />
                    <div>
                      <span className="text-[10px] text-warm-gray uppercase tracking-wider font-heading font-semibold">{label}</span>
                      <p className={`font-body text-xs ${value ? 'text-dark' : 'text-warm-gray/60 italic'}`}>
                        {value || emptyText}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PDF Generation */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
              <h4 className="font-heading font-bold text-dark text-sm mb-3">Generate Patient PDF</h4>
              <div className="flex items-center gap-2 mb-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="pdfMode" checked={pdfMode === 'latest'} onChange={() => setPdfMode('latest')}
                    className="w-3.5 h-3.5 text-primary-500 focus:ring-primary-300" />
                  <span className="text-[11px] font-heading font-medium text-dark">Latest consultation</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" name="pdfMode" checked={pdfMode === 'all'} onChange={() => setPdfMode('all')}
                    className="w-3.5 h-3.5 text-primary-500 focus:ring-primary-300" />
                  <span className="text-[11px] font-heading font-medium text-dark">All consultations ({consultations.length})</span>
                </label>
              </div>
              <button onClick={handleGeneratePDF}
                disabled={consultations.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-heading font-bold text-xs hover:bg-primary-600 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed">
                <Download size={14} /> Download PDF
              </button>
              {consultations.length === 0 && (
                <p className="text-[10px] text-warm-gray font-body mt-2">Record a consultation first to generate a PDF.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'consult' && (
          <ConsultPanel patient={patient} onConsultationComplete={() => onRefresh?.()} />
        )}

        {activeTab === 'history' && (
          <HistoryPanel consultations={consultations} />
        )}

        {activeTab === 'documents' && (
          <DocumentsPanel patient={patient} onRefresh={() => onRefresh?.()} />
        )}
      </div>
    </div>
  );
}
