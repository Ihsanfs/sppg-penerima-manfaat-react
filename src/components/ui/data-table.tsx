"use client";

import {
  type ColumnDef,
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFns,
  flexRender,
  globalFilteringFeature,
  type PaginationState,
  type Row,
  type RowData,
  rowPaginationFeature,
  rowSortingFeature,
  type SortingState,
  sortFns,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { LuChevronLeft, LuChevronRight, LuSearch } from "react-icons/lu";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export const dataTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns,
  sortFns,
});

export function createColumn<T extends RowData>() {
  return createColumnHelper<typeof dataTableFeatures, T>();
}

// Nilai kolom bisa bertipe string | number | boolean | null, jadi type value
// sengaja dibebaskan agar helper accessor menghasilkan column yang assignable.
export type DataTableColumn<T extends RowData> = ColumnDef<
  typeof dataTableFeatures,
  T,
  any
>;

type DataTableProps<T extends RowData & { id: number | string }> = {
  data: T[];
  columns: DataTableColumn<T>[];
  title?: string;
  description?: string;
  searchPlaceholder?: string;
  pageSize?: number;
  toolbar?: ReactNode;
  footer?: ReactNode;
  className?: string;
  minWidth?: string;
  getRowId?: (row: T) => string;
};

export function DataTable<T extends RowData & { id: number | string }>({
  data,
  columns,
  title,
  description,
  searchPlaceholder = "Cari data...",
  pageSize = 10,
  toolbar,
  footer,
  className,
  minWidth = "min-w-full",
  getRowId,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const globalFilterFn = (
    row: Row<typeof dataTableFeatures, T>,
    _columnId: string,
    filterValue: unknown,
  ): boolean => {
    const query = String(filterValue ?? "").trim().toLowerCase();
    if (!query) return true;
    return JSON.stringify(row.original).toLowerCase().includes(query);
  };

  const table = useTable({
    features: dataTableFeatures,
    data,
    columns,
    getRowId: (row: T) => getRowId?.(row) ?? String(row.id),
    state: { globalFilter: search, pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    globalFilterFn,
  });

  const pageCount = Math.max(1, table.getPageCount());
  const totalRows = table.getFilteredRowModel().rows.length;
  const rows = table.getRowModel().rows;
  const start = totalRows === 0 ? 0 : pagination.pageIndex * pageSize + 1;
  const end = Math.min((pagination.pageIndex + 1) * pageSize, totalRows);

  useEffect(() => {
    setPagination((prev) =>
      prev.pageSize === pageSize ? prev : { pageIndex: 0, pageSize },
    );
  }, [pageSize]);

  useEffect(() => {
    if (pagination.pageIndex >= pageCount) {
      setPagination((prev) => ({ ...prev, pageIndex: Math.max(0, pageCount - 1) }));
    }
  }, [pageCount, pagination.pageIndex]);

  return (
    <div className={cn("surface overflow-hidden", className)}>
      {(title || searchPlaceholder || toolbar) && (
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            {title && (
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
            )}
            {description && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <div className="relative sm:w-64">
              <LuSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                placeholder={searchPlaceholder}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
                className="field h-10 pl-9"
                aria-label={searchPlaceholder}
              />
            </div>
            {toolbar}
          </div>
        </div>
      )}

      <div className="scrollbar-thin w-full overflow-x-auto">
        <table className={cn("w-full border-collapse text-sm", minWidth)}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr
                key={headerGroup.id}
                className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-800/40"
              >
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <th
                      key={header.id}
                      className="h-11 px-4 text-start text-[11px] font-bold tracking-wider text-slate-500 whitespace-nowrap uppercase dark:text-slate-400"
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-600 dark:hover:text-brand-400"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span className="text-[10px] opacity-60">
                            {sorted === "asc" ? "▲" : sorted === "desc" ? "▼" : "↕"}
                          </span>
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(1, columns.length)}
                  className="px-6 py-14 text-center text-sm text-slate-500 dark:text-slate-400"
                >
                  Tidak ada data yang cocok.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors hover:bg-brand-50/40 dark:hover:bg-brand-500/5"
                >
                  {row.getAllCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-4 py-3 text-sm whitespace-nowrap text-slate-700 dark:text-slate-300"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
          {footer && (
            <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
              {footer}
            </tfoot>
          )}
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Menampilkan{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{start}</span>–
          <span className="font-semibold text-slate-700 dark:text-slate-200">{end}</span> dari{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{totalRows}</span>{" "}
          data
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPagination((prev) => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }))}
            disabled={pagination.pageIndex <= 0}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            <LuChevronLeft className="size-4" /> Sebelumnya
          </button>
          <span className="min-w-16 text-center text-xs font-medium text-slate-600 dark:text-slate-300">
            {Math.min(pagination.pageIndex + 1, pageCount)} / {pageCount}
          </span>
          <button
            type="button"
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                pageIndex: Math.min(pageCount - 1, prev.pageIndex + 1),
              }))
            }
            disabled={pagination.pageIndex + 1 >= pageCount}
            className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:border-brand-300 hover:text-brand-600 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300"
          >
            Berikutnya <LuChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
