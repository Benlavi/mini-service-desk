/**
 * Badge Component
 * Text-only status/urgency indicator (no icons)
 */
import { getStatusClass, getUrgencyClass } from '../../utils';

export function Badge({ 
  children, 
  variant = 'default', // default, primary, success, warning, danger, info
  status,              // new, assigned, pending, closed
  urgency,             // high, normal, low
  className = '',
  ...props 
}) {
  let badgeClass = 'badge';
  
  if (status) {
    badgeClass += ` ${getStatusClass(status)}`;
  } else if (urgency) {
    badgeClass += ` ${getUrgencyClass(urgency)}`;
  } else if (variant !== 'default') {
    badgeClass += ` ${variant}`;
  }
  
  if (className) {
    badgeClass += ` ${className}`;
  }
  
  return (
    <span className={badgeClass} {...props}>
      {children}
    </span>
  );
}

export default Badge;
