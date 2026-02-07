import { useEffect, useRef } from 'react';

/**
 * Drawer - Slide-in side panel for quick viewing/editing
 * Used for ticket detail quick view without full page navigation
 */
export function Drawer({ 
  open, 
  onClose, 
  title, 
  children,
  width = 'var(--drawer-width)',
  position = 'right'
}) {
  const drawerRef = useRef(null);

  // Handle escape key
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose?.();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Focus trap
  useEffect(() => {
    if (open && drawerRef.current) {
      drawerRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const positionStyles = position === 'right' 
    ? { right: 0, left: 'auto' }
    : { left: 0, right: 'auto' };

  return (
    <>
      {/* Overlay */}
      <div 
        className="drawer-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--drawer-overlay)',
          zIndex: 1000,
          animation: 'fadeIn 0.2s ease'
        }}
      />

      {/* Drawer Panel */}
      <aside
        ref={drawerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          width,
          maxWidth: '100vw',
          background: 'var(--surface-primary)',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 1001,
          display: 'flex',
          flexDirection: 'column',
          animation: position === 'right' 
            ? 'slideInRight 0.25s ease' 
            : 'slideInLeft 0.25s ease',
          ...positionStyles
        }}
      >
        {/* Header */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4) var(--space-5)',
          borderBottom: '1px solid var(--border-default)',
          flexShrink: 0
        }}>
          <h2 
            id="drawer-title"
            style={{
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-semibold)',
              color: 'var(--text-primary)',
              margin: 0
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close drawer"
            style={{
              background: 'none',
              border: 'none',
              fontSize: 'var(--text-xl)',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 'var(--space-1)',
              lineHeight: 1,
              borderRadius: 'var(--radius-sm)'
            }}
            onMouseEnter={(e) => e.target.style.color = 'var(--text-primary)'}
            onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
          >
            ×
          </button>
        </header>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--space-5)'
        }}>
          {children}
        </div>
      </aside>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}

export default Drawer;
