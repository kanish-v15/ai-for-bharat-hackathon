import { useState } from 'react';
import { X } from 'lucide-react';
import { BLOOD_GROUPS, GENDERS } from '../../utils/profileHelpers';
import { LANGUAGES } from '../../utils/constants';

export default function PatientModal({ patient, onSave, onClose }) {
  const isEdit = !!patient?.id;
  const [form, setForm] = useState({
    id: patient?.id || undefined,
    name: patient?.name || '',
    age: patient?.age || '',
    gender: patient?.gender || '',
    phone: patient?.phone || '',
    language: patient?.language || 'hindi',
    bloodGroup: patient?.bloodGroup || '',
    allergies: patient?.allergies || '',
    conditions: patient?.conditions || '',
    medications: patient?.medications || '',
  });
  const [nameError, setNameError] = useState('');

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'name') setNameError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setNameError('Patient name is required'); return; }
    onSave(form);
  };

  const langOptions = Object.entries(LANGUAGES).map(([key, val]) => ({ value: key, label: val.labelEn }));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-gray-100 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="font-heading font-bold text-dark text-base">{isEdit ? 'Edit Patient' : 'Add New Patient'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-warm-gray hover:bg-gray-100 transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-3.5">
          <div>
            <label className="block text-[11px] font-heading font-semibold text-dark mb-1">Patient Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Enter patient name"
              className={`w-full px-3 py-2.5 bg-gray-50 border ${nameError ? 'border-red-300' : 'border-gray-200'} rounded-xl text-sm font-body text-dark placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-300`} />
            {nameError && <p className="text-[10px] text-red-500 font-body mt-1">{nameError}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-heading font-semibold text-dark mb-1">Age</label>
              <input type="number" value={form.age} onChange={(e) => handleChange('age', e.target.value)} placeholder="Age" min="0" max="120"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-body text-dark placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
            <div>
              <label className="block text-[11px] font-heading font-semibold text-dark mb-1">Gender</label>
              <select value={form.gender} onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-body text-dark focus:outline-none focus:ring-2 focus:ring-primary-300">
                <option value="">Select</option>
                {GENDERS.map(g => <option key={g.value} value={g.label}>{g.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-heading font-semibold text-dark mb-1">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="10-digit number"
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-body text-dark placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-primary-300" />
            </div>
            <div>
              <label className="block text-[11px] font-heading font-semibold text-dark mb-1">Language</label>
              <select value={form.language} onChange={(e) => handleChange('language', e.target.value)}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-body text-dark focus:outline-none focus:ring-2 focus:ring-primary-300">
                {langOptions.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-heading font-semibold text-dark mb-1">Blood Group</label>
            <div className="flex flex-wrap gap-1.5">
              {BLOOD_GROUPS.map(bg => (
                <button key={bg} type="button" onClick={() => handleChange('bloodGroup', form.bloodGroup === bg ? '' : bg)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-heading font-medium border transition-all ${form.bloodGroup === bg ? 'bg-red-50 text-red-600 border-red-200 ring-1 ring-red-200' : 'bg-gray-50 text-warm-gray border-gray-200 hover:border-red-200'}`}>
                  {bg}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-heading font-semibold text-dark mb-1">Allergies</label>
            <input type="text" value={form.allergies} onChange={(e) => handleChange('allergies', e.target.value)} placeholder="e.g., Penicillin, Dust"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-body text-dark placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <div>
            <label className="block text-[11px] font-heading font-semibold text-dark mb-1">Medical Conditions</label>
            <input type="text" value={form.conditions} onChange={(e) => handleChange('conditions', e.target.value)} placeholder="e.g., Hypertension, Diabetes"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-body text-dark placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <div>
            <label className="block text-[11px] font-heading font-semibold text-dark mb-1">Current Medications</label>
            <input type="text" value={form.medications} onChange={(e) => handleChange('medications', e.target.value)} placeholder="e.g., Amlodipine 5mg"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-body text-dark placeholder:text-warm-gray/50 focus:outline-none focus:ring-2 focus:ring-primary-300" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-warm-gray font-heading font-semibold text-xs hover:bg-gray-50 transition-all">Cancel</button>
            <button type="submit" className="flex-1 py-2.5 rounded-xl bg-primary-500 text-white font-heading font-bold text-xs hover:bg-primary-600 active:scale-[0.98] transition-all shadow-sm shadow-primary-500/20">
              {isEdit ? 'Update Patient' : 'Add Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
