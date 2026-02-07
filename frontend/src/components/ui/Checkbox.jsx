/**
 * Checkbox - Styled checkbox with indeterminate support
 * Used for table row selection and form controls
 */
export function Checkbox({
  checked = false,
  indeterminate = false,
  onChange,
  disabled = false,
  label,
  id,
  name,
  size = 'md', // 'sm' | 'md' | 'lg'
  'aria-label': ariaLabel,
  ...props
}) {
  const sizeMap = {
    sm: { box: 14, fontSize: 'var(--text-xs)' },
    md: { box: 16, fontSize: 'var(--text-sm)' },
    lg: { box: 20, fontSize: 'var(--text-base)' }
  };

  const { box, fontSize } = sizeMap[size];

  const containerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-2)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1
  };

  const checkboxStyle = {
    width: box,
    height: box,
    margin: 0,
    cursor: disabled ? 'not-allowed' : 'pointer',
    accentColor: 'var(--accent-primary)'
  };

  const labelStyle = {
    fontSize,
    color: 'var(--text-primary)',
    userSelect: 'none'
  };

  // Handle indeterminate state via ref
  function setIndeterminate(el) {
    if (el) {
      el.indeterminate = indeterminate;
    }
  }

  const checkbox = (
    <input
      ref={setIndeterminate}
      type="checkbox"
      id={id}
      name={name}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      aria-label={ariaLabel || label}
      style={checkboxStyle}
      {...props}
    />
  );

  if (!label) {
    return checkbox;
  }

  return (
    <label style={containerStyle}>
      {checkbox}
      <span style={labelStyle}>{label}</span>
    </label>
  );
}

export default Checkbox;
