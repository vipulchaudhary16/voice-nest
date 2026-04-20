import { useMemo, useRef, useEffect } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import {
  TableScrollShell,
  TableShell,
  tableElementClass,
  theadStickyClass,
  headerRowClass,
  thBaseClass,
  tbodyClass,
  trBodyClass,
  tdBaseClass,
} from './TableSurface';

/** @param {{ table: import('@tanstack/react-table').Table<any> }} props */
function SelectAllHeader({ table }) {
  const ref = useRef(null);
  const some = table.getIsSomePageRowsSelected();
  const all = table.getIsAllPageRowsSelected();
  useEffect(() => {
    if (!ref.current) return;
    ref.current.indeterminate = some && !all;
  }, [some, all]);

  return (
    <input
      ref={ref}
      type="checkbox"
      className="h-4 w-4 rounded border-[var(--border)] accent-indigo-600 cursor-pointer"
      checked={all}
      onChange={table.getToggleAllPageRowsSelectedHandler()}
      aria-label="Select all rows"
    />
  );
}

/**
 * @param {import('@tanstack/react-table').ColumnDef<any, any>[]} columns
 * @param {any[]} data
 * @param {boolean} loading
 * @param {string} [emptyMessage]
 * @param {(row: any, index: number) => string} [getRowId]
 * @param {boolean} [enableRowSelection]
 * @param {import('@tanstack/react-table').RowSelectionState} [rowSelection]
 * @param {import('@tanstack/react-table').OnChangeFn<import('@tanstack/react-table').RowSelectionState>} [onRowSelectionChange]
 * @param {boolean} [showIndexColumn] When true (default), prepends a 1-based serial number column.
 */
export default function DataTable({
  columns,
  data,
  loading,
  emptyMessage,
  getRowId,
  enableRowSelection = false,
  rowSelection,
  onRowSelectionChange,
  showIndexColumn = true,
}) {
  const indexColumn = useMemo(
    () => ({
      id: '_sr',
      header: 'Sr. No.',
      cell: ({ row }) => (
        <span className="tabular-nums text-[var(--text-secondary)]">{row.index + 1}</span>
      ),
      meta: {
        headerClassName: 'w-14 text-right',
        cellClassName: 'w-14 text-right',
      },
    }),
    []
  );

  const selectColumn = useMemo(
    () => ({
      id: 'select',
      meta: { headerClassName: 'w-12', cellClassName: 'w-12' },
      header: ({ table }) => <SelectAllHeader table={table} />,
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-[var(--border)] accent-indigo-600 cursor-pointer"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
          aria-label="Select row"
        />
      ),
    }),
    []
  );

  const tableColumns =
    showIndexColumn && enableRowSelection
      ? [selectColumn, indexColumn, ...columns]
      : showIndexColumn
        ? [indexColumn, ...columns]
        : enableRowSelection
          ? [selectColumn, ...columns]
          : columns;

  const resolveRowId =
    typeof getRowId === 'function'
      ? (row, index) => {
          const id = getRowId(row, index);
          if (id != null && id !== '') return String(id);
          return String(index);
        }
      : (row, index) => (row?._id != null ? String(row._id) : String(index));

  const table = useReactTable({
    data: Array.isArray(data) ? data : [],
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: resolveRowId,
    ...(enableRowSelection && onRowSelectionChange
      ? {
          enableRowSelection: true,
          onRowSelectionChange,
          state: { rowSelection: rowSelection ?? {} },
        }
      : {}),
  });

  if (loading) {
    return (
      <TableShell className="p-12 flex justify-center">
        <div className="text-[var(--text-muted)] font-medium animate-pulse">Loading data...</div>
      </TableShell>
    );
  }

  if (!data || data.length === 0) {
    return (
      <TableShell className="p-12 flex justify-center flex-col items-center gap-2">
        <div className="text-[var(--text-muted)] font-medium text-lg">{emptyMessage || 'No records found.'}</div>
      </TableShell>
    );
  }

  return (
    <TableScrollShell>
      <table className={tableElementClass}>
        <thead className={theadStickyClass}>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className={headerRowClass}>
              {headerGroup.headers.map((header) => {
                const meta = header.column.columnDef.meta ?? {};
                return (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className={`${thBaseClass} ${meta.headerClassName ?? ''}`}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody className={tbodyClass}>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className={trBodyClass}>
              {row.getVisibleCells().map((cell) => {
                const meta = cell.column.columnDef.meta ?? {};
                return (
                  <td
                    key={cell.id}
                    className={`${tdBaseClass} ${meta.cellClassName ?? 'text-[var(--text-primary)]'}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </TableScrollShell>
  );
}
