/**
 * Skeleton Component
 * Loading placeholder with pulse animation
 */

export function Skeleton({
  width,
  height = '1rem',
  borderRadius = 'var(--radius-sm)',
  className = '',
  ...props
}) {
  const style = {
    width: width || '100%',
    height,
    borderRadius,
    display: 'block',
  };
  
  return (
    <div 
      className={`skeleton ${className}`}
      style={style}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          width={i === lines - 1 ? '60%' : '100%'} 
          height="0.875rem" 
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: 'var(--space-5)' }}>
      <Skeleton width="40%" height="1.25rem" style={{ marginBottom: 'var(--space-4)' }} />
      <SkeletonText lines={2} />
    </div>
  );
}

export default Skeleton;
