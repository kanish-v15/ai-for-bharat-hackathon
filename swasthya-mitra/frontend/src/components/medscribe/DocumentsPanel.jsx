import { useState } from 'react';
import {
  FileText, Plus, X, Trash2, ChevronDown, ChevronRight,
  AlertTriangle, CheckCircle, AlertCircle, Beaker,
} from 'lucide-react';
import {
  getInteractions, addLabReportToPatient, removeLabReportFromPatient,
} from '../../services/dataStore';

const STATUS_STYLES = {
  Normal: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
  Borderline: { bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertTriangle },
  Abnormal: { bg: 'bg-red-50', text: 'text-red-700', icon: AlertCircle },
};

export default function DocumentsPanel({ patient, onRefresh }) {
  const [showPicker, setShowPicker] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const labReports = patient?.labReports || [];

  // Get global lab reports not already linked
  const linkedIds = new Set(labReports.map(r => r.id));
  const globalReports = getInteractions('lab_report').filter(r => !linkedIds.has(r.id));

  const handleLink = (report) => {
    addLabReportToPatient(patient.id, report);
    onRefresh?.();
    setShowPicker(false);
  };

  const handleUnlink = (reportId) => {
    removeLabReportFromPatient(patient.id, reportId);
    onRefresh?.();
  };

  return (
    <div className="space-y-3">
      {/* Header + Link button */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-heading font-semibold text-warm-gray uppercase tracking-wider">
          {labReports.length} lab report{labReports.length !== 1 ? 's' : ''}
        </p>
        {globalReports.length > 0 && (
          <button onClick={() => setShowPicker(!showPicker)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 font-heading font-bold text-[11px] hover:bg-primary-100 transition-colors border border-primary-100">
            <Plus size={12} /> Link Report
          </button>
        )}
      </div>

      {/* Picker */}
      {showPicker && (
        <div className="bg-white rounded-xl border border-primary-200 shadow-lg p-3 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="font-heading font-bold text-dark text-xs">Available Lab Reports</p>
            <button onClick={() => setShowPicker(false)} className="w-6 h-6 rounded-md bg-gray-50 flex items-center justify-center hover:bg-gray-100">
              <X size={12} className="text-warm-gray" />
            </button>
          </div>
          {globalReports.length === 0 ? (
            <p className="text-[11px] text-warm-gray font-body py-2 text-center">No unlinked reports available.</p>
          ) : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {globalReports.map((r) => {
                const date = new Date(r.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                const paramCount = r.data?.parameters?.length || 0;
                return (
                  <button key={r.id} onClick={() => handleLink(r)}
                    className="w-full text-left px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText size={12} className="text-primary-500" />
                        <span className="font-heading font-semibold text-dark text-[11px]">{r.title || 'Lab Report'}</span>
                      </div>
                      <span className="text-[10px] text-warm-gray font-body">{date}</span>
                    </div>
                    {r.summary && <p className="text-[10px] text-gray-500 font-body mt-0.5 truncate pl-5">{r.summary}</p>}
                    {paramCount > 0 && (
                      <span className="ml-5 mt-1 inline-block text-[9px] text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded-full font-heading font-medium">
                        {paramCount} parameters
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Linked Reports */}
      {labReports.length === 0 && !showPicker ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
            <FileText size={22} className="text-warm-gray/50" />
          </div>
          <p className="font-heading font-bold text-dark text-sm mb-1">No Lab Reports</p>
          <p className="font-body text-xs text-warm-gray max-w-xs">
            {globalReports.length > 0
              ? 'Click "Link Report" to attach a lab report to this patient.'
              : 'Upload lab reports in Lab Samjho first, then link them here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {labReports.map((report) => {
            const isExpanded = expandedId === report.id;
            const date = new Date(report.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const params = report.parameters || report.data?.parameters || [];

            return (
              <div key={report.id} className={`bg-white rounded-xl border transition-all ${isExpanded ? 'border-primary-200 shadow-md' : 'border-gray-100 shadow-sm'}`}>
                <div className="flex items-center gap-3 px-4 py-3">
                  <button onClick={() => setExpandedId(isExpanded ? null : report.id)} className="flex items-center gap-3 flex-1 text-left min-w-0">
                    <div className="w-9 h-9 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                      <Beaker size={15} className="text-primary-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-dark text-xs">{report.title || 'Lab Report'}</span>
                        <span className="text-[10px] text-warm-gray font-body">{date}</span>
                      </div>
                      {report.summary && <p className="text-[10px] text-gray-500 font-body truncate mt-0.5">{report.summary}</p>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {params.length > 0 && (
                        <span className="text-[10px] text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full font-heading font-medium">
                          {params.length} params
                        </span>
                      )}
                      {isExpanded ? <ChevronDown size={14} className="text-warm-gray" /> : <ChevronRight size={14} className="text-warm-gray" />}
                    </div>
                  </button>
                  <button onClick={() => handleUnlink(report.id)}
                    className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors shrink-0"
                    title="Unlink report">
                    <Trash2 size={12} />
                  </button>
                </div>

                {isExpanded && params.length > 0 && (
                  <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead><tr className="bg-gray-50">
                          <th className="px-3 py-1.5 text-left text-[9px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Parameter</th>
                          <th className="px-3 py-1.5 text-left text-[9px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Value</th>
                          <th className="px-3 py-1.5 text-left text-[9px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Ref. Range</th>
                          <th className="px-3 py-1.5 text-left text-[9px] text-warm-gray uppercase tracking-wider font-heading font-semibold">Status</th>
                        </tr></thead>
                        <tbody>
                          {params.map((p, i) => {
                            const style = STATUS_STYLES[p.classification] || STATUS_STYLES.Normal;
                            const StatusIcon = style.icon;
                            return (
                              <tr key={i} className="border-t border-gray-50">
                                <td className="px-3 py-2 text-[11px] font-heading font-semibold text-dark">{p.name}</td>
                                <td className="px-3 py-2 text-[11px] font-body text-gray-700">{p.value} {p.unit}</td>
                                <td className="px-3 py-2 text-[11px] font-body text-gray-500">{p.reference_range || '--'}</td>
                                <td className="px-3 py-2">
                                  <span className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full font-heading font-semibold ${style.bg} ${style.text}`}>
                                    <StatusIcon size={9} />{p.classification}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
