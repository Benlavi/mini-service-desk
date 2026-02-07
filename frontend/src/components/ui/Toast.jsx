import { useEffect, useState } from 'react';

/**
 * Toast - Non-blocking notification alerts
 * Shows temporary messages that auto-dismiss
 */
export function Toast({
  message,
  type = 'info', // 'success' | 'error' | 'warning' | 'info'
  duration = 4000,
  onClose,
  action // { label: string, onClick: () => void }
}) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  function handleClose() {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 200);
  }

  if (!visible) return null;

  const typeStyles = {
    success: {
      background: 'var(--semantic-success-light)',
      borderColor: 'var(--semantic-success)',
      color: 'var(--semantic-success)'
    },
    error: {
      background: 'var(--semantic-danger-light)',
      borderColor: 'var(--semantic-danger)',
      color: 'var(--semantic-danger)'
    },
    warning: {
      background: 'var(--semantic-warning-light)',
      borderColor: 'var(--semantic-warning)',
      color: '#805600'
    },
    info: {
      background: 'var(--semantic-info-light)',
      borderColor: 'var(--semantic-info)',
      color: 'var(--semantic-info)'
    }
  };

  const style = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    padding: 'var(--space-3) var(--space-4)',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${typeStyles[type].borderColor}`,
    background: typeStyles[type].background,
    boxShadow: 'var(--shadow-lg)',
    fontSize: 'var(--text-sm)',
    animation: exiting ? 'toastOut 0.2s ease forwards' : 'toastIn 0.2s ease',
    maxWidth: '400px'
  };

  const messageStyle = {
    flex: 1,
    color: 'var(--text-primary)'
  };

  const closeStyle = {
    background: 'none',
    border: 'none',
    fontSize: 'var(--text-lg)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: 'var(--space-1)',
    lineHeight: 1
  };

  return (
    <>
      <div role="alert" style={style}>
        <span style={messageStyle}>{message}</span>
        
        {action && (
          <button
            onClick={action.onClick}
            style={{
              background: 'none',
              border: 'none',
              color: typeStyles[type].color,
              fontWeight: 'var(--font-semibold)',
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {action.label}
          </button>
        )}
        
        <button onClick={handleClose} style={closeStyle} aria-label="Dismiss">
          ×
        </button>
      </div>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
      `}</style>
    </>
  );
}

/**
 * ToastContainer - Positions toasts in the viewport
 */
export function ToastContainer({ children, position = 'top-right' }) {
  const positionStyles = {
    'top-right': { top: 'var(--space-4)', right: 'var(--space-4)' },
    'top-left': { top: 'var(--space-4)', left: 'var(--space-4)' },
    'bottom-right': { bottom: 'var(--space-4)', right: 'var(--space-4)' },
    'bottom-left': { bottom: 'var(--space-4)', left: 'var(--space-4)' },
    'top-center': { top: 'var(--space-4)', left: '50%', transform: 'translateX(-50%)' }
  };

  return (
    <div
      style={{
        position: 'fixed',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        ...positionStyles[position]
      }}
    >
      {children}
    </div>
  );
}

export default Toast;
