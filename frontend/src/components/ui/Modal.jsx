/**
 * Modal Component
 * Accessible modal dialog with overlay
 */
import { useEffect } from 'react';

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 500,
}) {
  // Close on Escape key
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
  
  // Prevent body scroll when open
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
  
  if (!open) return null;
  
  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth }}
      >
        {title && (
          <div className="modal-header">
            <h2 id="modal-title" className="modal-title">{title}</h2>
            <button 
              className="modal-close" 
              onClick={onClose}
              aria-label="Close modal"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="modal-body">
          {children}
        </div>
        
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
