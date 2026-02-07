/**
 * Avatar Component
 * Displays user initials with solid background (no gradient)
 */
import { getInitials } from '../../utils';

export function Avatar({
  name,
  email,
  size = 'md', // sm (24px), md (32px), lg (40px)
  className = '',
  ...props
}) {
  const initials = getInitials(name || email);
  
  const sizeStyles = {
    sm: { width: '24px', height: '24px', fontSize: 'var(--text-xs)' },
    md: { width: '32px', height: '32px', fontSize: 'var(--text-sm)' },
    lg: { width: '40px', height: '40px', fontSize: 'var(--text-md)' },
  };
  
  const style = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    color: 'var(--text-inverse)',
    fontWeight: 'var(--font-semibold)',
    flexShrink: 0,
    ...sizeStyles[size],
  };
  
  return (
    <div 
      className={className}
      style={style}
      title={name || email}
      {...props}
    >
      {initials}
    </div>
  );
}

export default Avatar;
