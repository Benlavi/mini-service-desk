/**
 * Pagination Component
 * Simple prev/next pagination with page info
 */

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}) {
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < totalPages;
  
  return (
    <div className={`toolbar-row ${className}`} style={{ justifyContent: 'space-between' }}>
      <div className="meta">
        Page <b>{currentPage}</b> of <b>{totalPages}</b>
      </div>
      
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <button
          className="btn ghost"
          disabled={!canGoPrev}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </button>
        <button
          className="btn ghost"
          disabled={!canGoNext}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Pagination;
