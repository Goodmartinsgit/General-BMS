import React from 'react';
import { Package, ChevronLeft, ChevronRight } from 'lucide-react';

const DataTable = ({
  columns,
  data,
  loading,
  onRowClick,
  emptyMessage = "No records found",
  emptyIcon: EmptyIcon = Package,
  pagination = null,
  renderActions = null
}) => {
  return (
    <div className="bg-theme-secondary rounded-lg border border-theme shadow-theme-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-theme">
          <thead>
            <tr className="bg-theme-tertiary">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
              {renderActions && (
                <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-theme">
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={columns.length + (renderActions ? 1 : 0)} className="px-4 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-theme-tertiary rounded-lg"></div>
                      <div className="space-y-2 flex-1">
                        <div className="w-1/3 h-4 bg-theme-tertiary rounded"></div>
                        <div className="w-1/4 h-3 bg-theme-tertiary rounded opacity-50"></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (renderActions ? 1 : 0)} className="px-4 py-16 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-theme-tertiary rounded-full flex items-center justify-center text-theme-muted">
                      <EmptyIcon size={32} />
                    </div>
                    <p className="font-medium text-theme-primary">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`hover:bg-theme-tertiary transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className={`px-4 py-3 ${col.className || ''}`}>
                      {col.render ? col.render(row) : (
                        <span className="text-theme-primary text-sm">{row[col.accessor]}</span>
                      )}
                    </td>
                  ))}
                  {renderActions && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {renderActions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="px-4 py-3 bg-theme-tertiary border-t border-theme flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-xs text-theme-muted">
          Showing {data.length} entries
        </div>

        <div className="flex items-center gap-3">
          <button className="text-sm text-theme-muted hover:text-theme-primary transition flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <span className="w-8 h-8 rounded-lg bg-accent-gold text-black flex items-center justify-center text-xs font-bold">1</span>
          <button className="text-sm text-theme-muted hover:text-theme-primary transition flex items-center gap-1">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
