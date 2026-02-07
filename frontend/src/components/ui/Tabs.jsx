import { useState } from 'react';

/**
 * Tabs - Horizontal tab navigation
 * Supports controlled and uncontrolled modes
 */
export function Tabs({ 
  tabs, 
  activeTab, 
  onChange, 
  defaultTab,
  variant = 'underline' // 'underline' | 'pills'
}) {
  const [internalActive, setInternalActive] = useState(defaultTab || tabs[0]?.key);
  
  const currentTab = activeTab !== undefined ? activeTab : internalActive;
  
  function handleChange(key) {
    if (onChange) {
      onChange(key);
    } else {
      setInternalActive(key);
    }
  }

  const baseStyle = {
    display: 'flex',
    gap: variant === 'pills' ? 'var(--space-2)' : 0,
    borderBottom: variant === 'underline' ? '1px solid var(--border-default)' : 'none'
  };

  return (
    <div role="tablist" style={baseStyle}>
      {tabs.map((tab) => {
        const isActive = currentTab === tab.key;
        
        const tabStyle = variant === 'underline' ? {
          padding: 'var(--space-3) var(--space-4)',
          background: 'none',
          border: 'none',
          borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
          marginBottom: '-1px',
          fontSize: 'var(--text-sm)',
          fontWeight: isActive ? 'var(--font-semibold)' : 'var(--font-medium)',
          color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)'
        } : {
          padding: 'var(--space-2) var(--space-4)',
          background: isActive ? 'var(--accent-primary)' : 'var(--surface-secondary)',
          border: 'none',
          borderRadius: 'var(--radius-md)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-medium)',
          color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
          cursor: 'pointer',
          transition: 'all var(--transition-fast)'
        };

        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={isActive}
            onClick={() => handleChange(tab.key)}
            style={tabStyle}
            onMouseEnter={(e) => {
              if (!isActive && variant === 'underline') {
                e.target.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive && variant === 'underline') {
                e.target.style.color = 'var(--text-secondary)';
              }
            }}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span style={{
                marginLeft: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
                opacity: 0.8
              }}>
                ({tab.count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * TabPanel - Content container for a tab
 */
export function TabPanel({ children, tabKey, activeTab }) {
  if (tabKey !== activeTab) return null;
  
  return (
    <div role="tabpanel" style={{ paddingTop: 'var(--space-4)' }}>
      {children}
    </div>
  );
}

export default Tabs;
