import { Check, ListFilter, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { DatabaseTableFilterOption, DatabaseTableFilterRenderer } from './DatabaseTable';

type TableGridControlsProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filterableColumnIds: string[];
  filters: Record<string, string | string[]>;
  onFilterChange: (columnId: string, value: string[]) => void;
  filterOptionsByColumnId: Record<string, DatabaseTableFilterOption[]>;
  filterSectionLabelByColumnId?: Record<string, string>;
  filterRendererByColumnId?: Record<string, DatabaseTableFilterRenderer>;
  columns: Array<{ id: string; header: string }>;
  aiControl?: ReactNode;
  rightControls?: ReactNode;
};

export function TableGridControls({
  search,
  onSearchChange,
  filterableColumnIds,
  filters,
  onFilterChange,
  filterOptionsByColumnId,
  filterSectionLabelByColumnId,
  filterRendererByColumnId,
  columns,
  aiControl,
  rightControls,
}: TableGridControlsProps) {
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const filtersMenuRef = useRef<HTMLDivElement | null>(null);

  const hasActiveFilters = useMemo(
    () =>
      Object.values(filters).some((value) =>
        Array.isArray(value) ? value.length > 0 : Boolean(value)
      ),
    [filters]
  );

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as Node;
      if (filtersMenuRef.current && !filtersMenuRef.current.contains(target)) {
        setShowFiltersMenu(false);
      }
    }
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="relative">
        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search rows"
          className="input-base w-56 pl-7"
        />
      </div>
      {aiControl}
      {filterableColumnIds.length > 0 ? (
        <div ref={filtersMenuRef} className="relative">
          <button
            onClick={() => setShowFiltersMenu((value) => !value)}
            aria-label="Filter rows"
            className={`relative inline-flex h-8 w-8 items-center justify-center rounded border p-0 transition-colors ${
              showFiltersMenu
                ? 'border-gray-300 bg-gray-100 text-gray-800'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-800'
            }`}
          >
            <ListFilter size={12} />
            {hasActiveFilters ? (
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-orange-500" />
            ) : null}
          </button>
          {showFiltersMenu ? (
            <div className="absolute left-0 top-full z-20 mt-1 w-64 rounded-lg border border-gray-200 bg-white px-1.5 py-1 shadow-lg">
              <div className="space-y-1">
                <p className="px-1.5 pt-0.5 pb-0.5 text-xs font-semibold text-gray-500">Filter by</p>
                {filterableColumnIds.map((columnId) => {
                  const column = columns.find((item) => item.id === columnId);
                  if (!column) return null;
                  const options = filterOptionsByColumnId[columnId] ?? [];
                  const selectedValues = Array.isArray(filters[columnId]) ? filters[columnId] : [];
                  const customRenderer = filterRendererByColumnId?.[columnId];
                  return (
                    <div key={columnId} className="space-y-0.5">
                      <p className="px-1.5 pt-0.5 text-2xs font-semibold text-gray-400">
                        {filterSectionLabelByColumnId?.[columnId] ?? column.header}
                      </p>
                      {customRenderer
                        ? customRenderer({
                            selectedValues,
                            onChange: (values) => onFilterChange(columnId, values),
                          })
                        : options.map((option) => (
                            <button
                              key={`${columnId}-${option.value}`}
                              onClick={() => {
                                const next = selectedValues.includes(option.value)
                                  ? selectedValues.filter((value) => value !== option.value)
                                  : [...selectedValues, option.value];
                                onFilterChange(columnId, next);
                              }}
                              className={`flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-xs hover:bg-gray-50 ${
                                selectedValues.includes(option.value)
                                  ? 'font-medium text-gray-900'
                                  : 'text-gray-600'
                              }`}
                            >
                              <span className="w-3 flex-shrink-0">
                                {selectedValues.includes(option.value) ? (
                                  <Check size={11} className="text-gray-700" />
                                ) : null}
                              </span>
                              {option.label}
                            </button>
                          ))}
                    </div>
                  );
                })}
                <div className="my-0.5 border-t border-gray-100" />
                <div className="flex items-center justify-start gap-2 px-0.5 pb-0.5">
                  <button
                    onClick={() => {
                      filterableColumnIds.forEach((columnId) => onFilterChange(columnId, []));
                    }}
                    className="rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="ml-auto">{rightControls}</div>
    </div>
  );
}
