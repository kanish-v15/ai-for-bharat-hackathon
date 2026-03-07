import { useState, useCallback, useEffect } from 'react';
import { Plus, Search, Users, Stethoscope, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotifications } from '../context/NotificationContext';
import {
  getPatients, savePatient, deletePatientRecord, seedDemoPatients,
} from '../services/dataStore';
import PatientTable from '../components/medscribe/PatientTable';
import PatientModal from '../components/medscribe/PatientModal';

export default function MedScribe() {
  const { t } = useLanguage();
  const { addNotification } = useNotifications();

  const [patients, setPatients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);

  const refreshPatients = useCallback(() => {
    setPatients(getPatients());
  }, []);

  useEffect(() => {
    seedDemoPatients();
    refreshPatients();
  }, []);

  const filtered = searchQuery.trim()
    ? patients.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.phone?.includes(q) ||
          p.conditions?.toLowerCase().includes(q) ||
          p.gender?.toLowerCase().includes(q)
        );
      })
    : patients;

  const handleSavePatient = (form) => {
    savePatient(form);
    refreshPatients();
    setShowModal(false);
    addNotification('Patient Added', `${form.name} saved`, 'success');
  };

  const handleDeletePatient = (id) => {
    const p = patients.find((pt) => pt.id === id);
    if (!window.confirm(`Delete ${p?.name || 'this patient'}?`)) return;
    deletePatientRecord(id);
    refreshPatients();
    addNotification('Patient Deleted', `${p?.name} removed`, 'info');
  };

  // Stats
  const totalConsultations = patients.reduce((sum, p) => sum + (p.consultations?.length || 0), 0);
  const totalReports = patients.reduce((sum, p) => sum + (p.labReports?.length || 0), 0);

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-heading font-bold text-dark text-xl tracking-tight">
            {t('common.medscribe') || 'MedScribe'}
          </h1>
          <p className="font-body text-xs text-warm-gray mt-0.5">
            Patient records, consultations & documents
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-white font-heading font-bold text-xs hover:bg-primary-600 transition-all shadow-sm shadow-primary-500/20 active:scale-[0.98]">
          <Plus size={14} /> Add Patient
        </button>
      </div>

      {/* Stats + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2.5">
          {[
            { label: 'Patients', value: patients.length, icon: Users, color: 'text-primary-500', bg: 'bg-primary-50' },
            { label: 'Consultations', value: totalConsultations, icon: Stethoscope, color: 'text-india-green', bg: 'bg-emerald-50' },
            { label: 'Lab Reports', value: totalReports, icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon size={13} className={color} />
              </div>
              <div>
                <p className="font-heading font-bold text-dark text-sm leading-none">{value}</p>
                <p className="text-[9px] text-warm-gray font-body">{label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 sm:max-w-xs ml-auto">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-gray/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patients..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-body text-dark placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <PatientTable patients={filtered} onDelete={handleDeletePatient} />

      {/* Add Patient Modal */}
      {showModal && (
        <PatientModal
          patient={null}
          onSave={handleSavePatient}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
