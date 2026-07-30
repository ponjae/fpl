import React from 'react';
import classNames from 'classnames';
import './index.scss';

export type Column<T> = {
  key: string;
  header: string;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => React.ReactNode;
};

export type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (key: string) => void;
  onRowClick?: (row: T) => void;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
};

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  sortKey,
  sortDir,
  onSortChange,
  onRowClick,
  emptyState,
  isLoading = false,
}: DataTableProps<T>) {
  const handleHeaderClick = (key: string, sortable?: boolean) => {
    if (sortable && onSortChange) {
      onSortChange(key);
    }
  };

  const handleHeaderKeyDown = (
    event: React.KeyboardEvent,
    key: string,
    sortable?: boolean
  ) => {
    if (sortable && onSortChange && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onSortChange(key);
    }
  };

  const showEmpty = !isLoading && rows.length === 0;

  return (
    <div className="data-table-wrapper">
      <div className="data-table-scroll-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col, index) => {
                const isSorted = sortKey === col.key;
                const isSortable = !!col.sortable;
                const alignClass = col.align ? `align-${col.align}` : 'align-left';

                return (
                  <th
                    key={col.key}
                    className={classNames(alignClass, {
                      'is-sticky-col': index === 0,
                      'is-sortable': isSortable,
                      'is-sorted': isSorted,
                    })}
                    onClick={() => handleHeaderClick(col.key, isSortable)}
                    onKeyDown={(e) => handleHeaderKeyDown(e, col.key, isSortable)}
                    tabIndex={isSortable ? 0 : undefined}
                    role={isSortable ? 'button' : undefined}
                    aria-sort={
                      isSorted
                        ? sortDir === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                  >
                    <div className="header-content">
                      <span>{col.header}</span>
                      {isSortable && (
                        <span className="sort-icon-container">
                          <svg
                            className={classNames('sort-icon', {
                              'sort-icon--asc': isSorted && sortDir === 'asc',
                              'sort-icon--desc': isSorted && sortDir === 'desc',
                            })}
                            viewBox="0 0 24 24"
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="18 15 12 9 6 15" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: Math.max(5, rows.length) }).map((_, rowIndex) => (
                <tr key={`skeleton-row-${rowIndex}`} className="table-skeleton-row">
                  {columns.map((col, colIndex) => (
                    <td
                      key={`skeleton-cell-${colIndex}`}
                      className={classNames(col.align ? `align-${col.align}` : 'align-left', {
                        'is-sticky-col': colIndex === 0,
                      })}
                    >
                      <div className="skeleton-cell-shimmer" />
                    </td>
                  ))}
                </tr>
              ))
            ) : showEmpty ? (
              <tr>
                <td colSpan={columns.length} className="empty-state-cell">
                  {emptyState || <div className="default-empty">No data available</div>}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={classNames({
                    'is-clickable': !!onRowClick,
                  })}
                >
                  {columns.map((col, index) => {
                    const alignClass = col.align ? `align-${col.align}` : 'align-left';
                    return (
                      <td
                        key={col.key}
                        className={classNames(alignClass, {
                          'is-sticky-col': index === 0,
                        })}
                      >
                        {col.render(row)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;