import { CheckCircle } from 'lucide-react';

export default function VoiceFormField({
  label, name, value, onChange, type = 'text', options = [],
  required = false, placeholder = '', error = '', disabled = false,
  readOnly = false,
}) {
  const isFilled = value && (typeof value !== 'string' || value.trim());

  const renderInput = () => {
    const baseClass = 'flex-1 px-4 py-3 text-sm outline-none font-body text-dark placeholder:text-warm-gray/40 bg-transparent';

    if (type === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          disabled={disabled || readOnly}
          className={`${baseClass} appearance-none cursor-pointer`}
        >
          <option value="">{placeholder || 'Select...'}</option>
          {options.map(opt => (
            <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
              {typeof opt === 'string' ? opt : opt.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(name, e.target.value)}
          placeholder={placeholder}
          disabled={disabled || readOnly}
          rows={2}
          className={`${baseClass} resize-none`}
        />
      );
    }

    return (
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        disabled={disabled || readOnly}
        className={baseClass}
      />
    );
  };

  return (
    <div className="space-y-1.5">
      {/* Label */}
      <label className="flex items-center gap-1 font-heading font-semibold text-xs text-dark">
        {label}
        {required && <span className="text-red-500">*</span>}
        {isFilled && <CheckCircle size={12} className="text-india-green ml-1" />}
      </label>

      {/* Input */}
      <div className={`
        flex items-center border-2 rounded-xl overflow-hidden transition-all duration-200
        ${error ? 'border-red-300 bg-red-50/30' : 'border-gray-200 hover:border-gray-300 focus-within:border-primary-500'}
        ${readOnly ? 'bg-gray-50' : 'bg-white'}
      `}>
        {renderInput()}
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-red-500 font-body mt-0.5">{error}</p>
      )}
    </div>
  );
}
