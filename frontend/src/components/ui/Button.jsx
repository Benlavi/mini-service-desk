/**
 * Button Component
 * Variants: primary, secondary (default), ghost, danger, success
 * Sizes: sm, md (default), lg
 */

export function Button({
  children,
  variant = 'secondary', // primary, secondary, ghost, danger, success
  size = 'md',           // sm, md, lg
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  ...props
}) {
  let btnClass = 'btn';
  
  if (variant !== 'secondary') {
    btnClass += ` ${variant}`;
  }
  
  if (size !== 'md') {
    btnClass += ` ${size}`;
  }
  
  if (className) {
    btnClass += ` ${className}`;
  }
  
  return (
    <button
      type={type}
      className={btnClass}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}

export default Button;
