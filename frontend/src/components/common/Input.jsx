export default function Input({ label, id, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="label" htmlFor={id}>{label}</label>}
      <input
        id={id}
        className={`input ${error ? 'border-red-400 focus:ring-red-300' : ''}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
