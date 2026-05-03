export default function Select({ label, id, options = [], error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="label" htmlFor={id}>{label}</label>}
      <select
        id={id}
        className={`input ${error ? 'border-red-400 focus:ring-red-300' : ''}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
