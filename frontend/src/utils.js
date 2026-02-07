/**
 * Utility functions for Mini Service Desk
 * Centralized helpers to eliminate duplication across pages
 */

// ============================================
// STATUS & URGENCY MAPPINGS
// ============================================

export const STATUS_COLORS = {
  new: { text: 'var(--status-new)', bg: 'var(--status-new-bg)' },
  assigned: { text: 'var(--status-assigned)', bg: 'var(--status-assigned-bg)' },
  pending: { text: 'var(--status-pending)', bg: 'var(--status-pending-bg)' },
  closed: { text: 'var(--status-closed)', bg: 'var(--status-closed-bg)' },
};

export const URGENCY_COLORS = {
  high: { text: 'var(--urgency-high)', bg: 'var(--urgency-high-bg)' },
  normal: { text: 'var(--urgency-normal)', bg: 'var(--urgency-normal-bg)' },
  low: { text: 'var(--urgency-low)', bg: 'var(--urgency-low-bg)' },
};

export const STATUS_LABELS = {
  new: 'New',
  assigned: 'Assigned',
  pending: 'Pending',
  closed: 'Closed',
};

export const URGENCY_LABELS = {
  high: 'High',
  normal: 'Normal',
  low: 'Low',
};

export const REQUEST_TYPES = [
  { value: 'software', label: 'Software' },
  { value: 'hardware', label: 'Hardware' },
  { value: 'environment', label: 'Environment' },
  { value: 'logistics', label: 'Logistics' },
  { value: 'other', label: 'Other' },
];

// ============================================
// COLOR GETTERS
// ============================================

/**
 * Get status color (text color)
 * @param {string} status - Status value (new, assigned, pending, closed)
 * @returns {string} CSS color value
 */
export function getStatusColor(status) {
  return STATUS_COLORS[status]?.text || 'var(--text-secondary)';
}

/**
 * Get status background color
 * @param {string} status - Status value
 * @returns {string} CSS color value
 */
export function getStatusBgColor(status) {
  return STATUS_COLORS[status]?.bg || 'var(--surface-tertiary)';
}

/**
 * Get urgency color (text color)
 * @param {string} urgency - Urgency value (high, normal, low)
 * @returns {string} CSS color value
 */
export function getUrgencyColor(urgency) {
  return URGENCY_COLORS[urgency]?.text || 'var(--text-secondary)';
}

/**
 * Get urgency background color
 * @param {string} urgency - Urgency value
 * @returns {string} CSS color value
 */
export function getUrgencyBgColor(urgency) {
  return URGENCY_COLORS[urgency]?.bg || 'var(--surface-tertiary)';
}

/**
 * Get status CSS class for badge
 * @param {string} status - Status value
 * @returns {string} CSS class name
 */
export function getStatusClass(status) {
  return `status-${status}`;
}

/**
 * Get urgency CSS class for badge
 * @param {string} urgency - Urgency value
 * @returns {string} CSS class name
 */
export function getUrgencyClass(urgency) {
  return `urgency-${urgency}`;
}

// ============================================
// TEXT UTILITIES
// ============================================

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} max - Maximum length (default: 40)
 * @returns {string} Truncated text
 */
export function truncateText(text, max = 40) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * Get initials from a name or email
 * @param {string} nameOrEmail - Name or email string
 * @returns {string} Single uppercase initial
 */
export function getInitials(nameOrEmail) {
  if (!nameOrEmail) return '?';
  
  // If it's an email, use the first character
  if (nameOrEmail.includes('@')) {
    return nameOrEmail.charAt(0).toUpperCase();
  }
  
  // For names, try to get first character
  const parts = nameOrEmail.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
  
  return nameOrEmail.charAt(0).toUpperCase();
}

// ============================================
// DATE UTILITIES
// ============================================

/**
 * Format a date string for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date string
 */
export function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
}

/**
 * Format a date string for relative display (e.g., "2 hours ago")
 * @param {string} dateString - ISO date string
 * @returns {string} Relative time string
 */
export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

// ============================================
// SORTING UTILITIES
// ============================================

/**
 * Compare function for sorting
 * @param {*} a - First value
 * @param {*} b - Second value
 * @returns {number} Comparison result
 */
export function compare(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================
// CONSTANTS
// ============================================

export const ALL_STATUSES = ['new', 'assigned', 'pending', 'closed'];
export const ALL_URGENCIES = ['low', 'normal', 'high'];
