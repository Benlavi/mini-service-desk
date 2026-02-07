import { useEffect, useRef, useState } from 'react';

/**
 * Dropdown - Action menu with items and dividers
 * Accessible keyboard navigation included
 */
export function Dropdown({
  trigger,
  items,
  align = 'left', // 'left' | 'right'
  disabled = false
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Close on escape
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  function handleTriggerClick() {
    if (!disabled) {
      setOpen(!open);
    }
  }

  function handleItemClick(item) {
    if (!item.disabled) {
      item.onClick?.();
      setOpen(false);
    }
  }

  const menuStyle = {
    position: 'absolute',
    top: '100%',
    [align === 'right' ? 'right' : 'left']: 0,
    marginTop: 'var(--space-1)',
    minWidth: '160px',
    background: 'var(--surface-primary)',
    border: '1px solid var(--border-default)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 100,
    padding: 'var(--space-1) 0',
    animation: 'dropdownIn 0.15s ease'
  };

  const itemStyle = {
    display: 'block',
    width: '100%',
    padding: 'var(--space-2) var(--space-3)',
    background: 'none',
    border: 'none',
    textAlign: 'left',
    fontSize: 'var(--text-sm)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    transition: 'background var(--transition-fast)'
  };

  const dividerStyle = {
    height: '1px',
    background: 'var(--border-subtle)',
    margin: 'var(--space-1) 0'
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div onClick={handleTriggerClick} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
        {trigger}
      </div>

      {open && (
        <>
          <div ref={menuRef} role="menu" style={menuStyle}>
            {items.map((item, index) => {
              if (item.divider) {
                return <div key={index} style={dividerStyle} />;
              }

              const isDisabled = item.disabled;
              const isDanger = item.variant === 'danger';

              return (
                <button
                  key={index}
                  role="menuitem"
                  onClick={() => handleItemClick(item)}
                  disabled={isDisabled}
                  style={{
                    ...itemStyle,
                    color: isDanger ? 'var(--semantic-danger)' : 'var(--text-primary)',
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    if (!isDisabled) {
                      e.target.style.background = 'var(--surface-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'none';
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <style>{`
            @keyframes dropdownIn {
              from { opacity: 0; transform: translateY(-4px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </>
      )}
    </div>
  );
}

export default Dropdown;
