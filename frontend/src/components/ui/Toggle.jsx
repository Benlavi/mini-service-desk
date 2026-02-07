/**
 * Toggle - On/off switch component
 * Used for boolean settings and feature flags
 */
export function Toggle({
  checked = false,
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
    sm: { width: 32, height: 18, knob: 14 },
    md: { width: 40, height: 22, knob: 18 },
    lg: { width: 48, height: 26, knob: 22 }
  };

  const { width, height, knob } = sizeMap[size];
  const offset = (height - knob) / 2;

  const containerStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1
  };

  const trackStyle = {
    position: 'relative',
    width,
    height,
    background: checked ? 'var(--accent-primary)' : 'var(--surface-tertiary)',
    borderRadius: 'var(--radius-full)',
    border: `1px solid ${checked ? 'var(--accent-primary)' : 'var(--border-default)'}`,
    transition: 'all var(--transition-fast)',
    cursor: 'inherit'
  };

  const knobStyle = {
    position: 'absolute',
    top: offset,
    left: checked ? width - knob - offset - 2 : offset,
    width: knob,
    height: knob,
    background: 'var(--surface-primary)',
    borderRadius: 'var(--radius-full)',
    boxShadow: 'var(--shadow-sm)',
    transition: 'left var(--transition-fast)'
  };

  const labelStyle = {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)',
    userSelect: 'none'
  };

  function handleClick() {
    if (!disabled && onChange) {
      onChange({ target: { checked: !checked, name, id } });
    }
  }

  function handleKeyDown(e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleClick();
    }
  }

  return (
    <label style={containerStyle}>
      <div
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel || label}
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={trackStyle}
        {...props}
      >
        <div style={knobStyle} />
      </div>
      {label && <span style={labelStyle}>{label}</span>}
      
      {/* Hidden input for form compatibility */}
      <input
        type="checkbox"
        id={id}
        name={name}
        checked={checked}
        onChange={() => {}}
        disabled={disabled}
        style={{ 
          position: 'absolute', 
          opacity: 0, 
          pointerEvents: 'none' 
        }}
      />
    </label>
  );
}

export default Toggle;
