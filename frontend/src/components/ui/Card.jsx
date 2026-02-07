/**
 * Card Component
 * Container with border and shadow
 */

export function Card({
  children,
  className = '',
  padding = true,
  ...props
}) {
  let cardClass = 'card';
  
  if (!padding) {
    cardClass += ' no-padding';
  }
  
  if (className) {
    cardClass += ` ${className}`;
  }
  
  return (
    <div className={cardClass} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`card-header ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`card-title ${className}`}>
      {children}
    </h3>
  );
}

export default Card;
