import React from 'react';
import './index.scss';

export type TableSkeletonProps = {
  rows?: number;
  columns?: number;
};

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
}) => {
  const rowArray = Array.from({ length: rows });
  const colArray = Array.from({ length: columns });

  return (
    <div className="table-skeleton-wrapper">
      <table className="table-skeleton">
        <thead>
          <tr>
            {colArray.map((_, colIndex) => (
              <th key={`header-skeleton-${colIndex}`}>
                <div className="table-skeleton__header-shimmer" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowArray.map((_, rowIndex) => (
            <tr key={`row-skeleton-${rowIndex}`}>
              {colArray.map((_, colIndex) => (
                <td key={`cell-skeleton-${rowIndex}-${colIndex}`}>
                  <div className="table-skeleton__cell-shimmer" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableSkeleton;