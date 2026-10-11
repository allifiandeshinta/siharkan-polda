export function Input({ placeholder, value, onChange, type = 'text', className = '', ...props }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    />
  )
}

export function SearchBox({ placeholder, value, onChange, className = '' }) {
  return (
    <div className={`search-box ${className}`.trim()}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
      <input
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete="off"
        data-form-type="other"
      />
    </div>
  )
}

export function Select({ value, onChange, options, placeholder = '', className = '', ...props }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={className}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt, idx) => (
        <option key={idx} value={opt.value || opt}>
          {opt.label || opt}
        </option>
      ))}
    </select>
  )
}
