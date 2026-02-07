/**
 * Select - Styled dropdown select component
 * Wraps native select for accessibility with custom styling
 */
export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  error = false,
  size = 'md', // 'sm' | 'md' | 'lg'
  fullWidth = false,
  id,
  name,
  'aria-label': ariaLabel,
  ...props
}) {
  const sizeStyles = {
    sm: {
      padding: 'var(--space-2) var(--space-3)',
      fontSize: 'var(--text-sm)',
      minHeight: '32px'
    },
    md: {
      padding: 'var(--space-3) var(--space-4)',
      fontSize: 'var(--text-base)',
      minHeight: '40px'
    },
    lg: {
      padding: 'var(--space-4) var(--space-5)',
      fontSize: 'var(--text-md)',
      minHeight: '48px'
    }
  };

  const style = {
    width: fullWidth ? '100%' : 'auto',
    minWidth: '140px',
    fontFamily: 'inherit',
    color: value ? 'var(--text-primary)' : 'var(--text-muted)',
    background: 'var(--surface-primary)',
    border: `1px solid ${error ? 'var(--semantic-danger)' : 'var(--border-default)'}`,
    borderRadius: 'var(--radius-md)',
    outline: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all var(--transition-fast)',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235e6672' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right var(--space-3) center',
    paddingRight: 'var(--space-8)',
    ...sizeStyles[size]
  };

  function handleFocus(e) {
    e.target.style.borderColor = 'var(--border-focus)';
    e.target.style.boxShadow = 'var(--focus-ring)';
  }

  function handleBlur(e) {
    e.target.style.borderColor = error ? 'var(--semantic-danger)' : 'var(--border-default)';
    e.target.style.boxShadow = 'none';
  }

  return (
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      disabled={disabled}
      aria-label={ariaLabel}
      style={style}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    >
      {placeholder && (
        <option value="" disabled={!options.some(o => o.value === '')}>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export default Select;
