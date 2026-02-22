import React from 'react';

export interface AdminTableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
}

export interface AdminTableProps<T> {
  columns: AdminTableColumn[];
  data: T[];
  renderRow: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
}

export default function AdminTable<T>({
  columns,
  data,
  renderRow,
  emptyMessage = 'No data available.',
  emptyIcon,
  emptyAction,
}: AdminTableProps<T>) {
  const alignmentClasses: Record<string, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <div className="card-modern overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-6 py-4 text-[10px] text-slate-500 font-semibold uppercase tracking-[0.15em] ${
                  alignmentClasses[col.align || 'left']
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-6 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  {emptyIcon && (
                    <div className="w-14 h-14 bg-slate-50 rounded-lg flex items-center justify-center">
                      {emptyIcon}
                    </div>
                  )}
                  <p className="text-slate-500 font-normal">{emptyMessage}</p>
                  {emptyAction}
                </div>
              </td>
            </tr>
          ) : (
            data.map((item, index) => renderRow(item, index))
          )}
        </tbody>
      </table>
    </div>
  );
}
