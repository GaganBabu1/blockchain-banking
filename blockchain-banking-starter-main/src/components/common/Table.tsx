/*
 * Table.tsx
 * A simple reusable table component for displaying data in rows and columns.
 */

import React from 'react';

interface Column {
  key: string;
  header: string;
  render?: (value: any, row: any) => React.ReactNode;
}

interface TableProps {
  columns: Column[];
  data: any[];
  emptyMessage?: string;
}

function Table({ columns, data, emptyMessage = 'No data available' }: TableProps) {
  if (data.length === 0) {
    return (
      <div className="table-container">
        <p style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
