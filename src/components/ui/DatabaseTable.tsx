import { useCallback, useEffect, useMemo, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  EyeOff,
  Info,
  ListFilter,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

type Align = 'left' | 'right' | 'center';
type Density = 'comfortable' | 'compact';
type SortDirection = 'asc' | 'desc';

type Primitive = string | number | boolean | null | undefined;
export type DatabaseTableFilterOption = {
  value: string;
  label: string;
  matches?: string[];
};

export type DatabaseTableColumn<Row> = {
  id: string;
  header: string;
  headerTooltip?: string;
  accessor: (row: Row) => ReactNode;
  getValue?: (row: Row) => Primitive;
  width?: string;
  align?: Align;
  isSortable?: boolean;
  isDefaultVisible?: boolean;
  isHideable?: boolean;
  cellClassName?: string;
};

export type DatabaseTableProps<Row> = {
  rows: Row[];
  columns: DatabaseTableColumn<Row>[];
  getRowId: (row: Row) => string;
  defaultVisibleColumnIds?: string[];
  searchableColumnIds?: string[];
  filterableColumnIds?: string[];
  filterSelectionModeByColumnId?: Record<string, 'single' | 'multi'>;
  filterOptionsByColumnId?: Record<string, DatabaseTableFilterOption[]>;
  filterSectionLabelByColumnId?: Record<string, string>;
  searchPlaceholder?: string;
  emptyStateText?: string;
  persistedStateKey?: string;
  enableRowSelection?: boolean;
  bulkActions?: Array<{ id: string; label: string; danger?: boolean }>;
  onBulkAction?: (actionId: string, selectedRows: Row[]) => void;
  enableColumnResize?: boolean;
  enableColumnReorder?: boolean;
  enableColumnPinning?: boolean;
  initialState?: Partial<DatabaseTableState>;
  stateVersion?: string | number;
  onStateChange?: (state: DatabaseTableState) => void;
  onRowClick?: (row: Row) => void;
  aiControl?: ReactNode;
  rightControls?: ReactNode;
};

export type DatabaseTableState = {
  visibleColumnIds?: string[];
  sort?: { columnId: string; direction: SortDirection } | null;
  density?: Density;
  search?: string;
  filters?: Record<string, string | string[]>;
  selectedRowIds?: string[];
  columnOrder?: string[];
  columnWidths?: Record<string, number>;
  pinnedColumns?: { left: string[]; right: string[] };
};

/**
 * DatabaseTable
 *
 * Reusable, client-side table primitive used across Teams/Workspaces/Members lists.
 * Intended rollout plan:
 * 1) keep shared controls and interactions in one component
 * 2) adopt in Teams/Workspaces/Members lists
 * 3) avoid table-specific one-off logic in pages
 */
export function DatabaseTable<Row>({
  rows,
  columns,
  getRowId,
  defaultVisibleColumnIds,
  searchableColumnIds = [],
  filterableColumnIds = [],
  filterSelectionModeByColumnId,
  filterOptionsByColumnId,
  filterSectionLabelByColumnId,
  searchPlaceholder = 'Search rows',
  emptyStateText = 'No results',
  persistedStateKey,
  enableRowSelection = false,
  bulkActions = [
    { id: 'archive', label: 'Archive' },
    { id: 'export', label: 'Export' },
    { id: 'delete', label: 'Delete', danger: true },
  ],
  onBulkAction,
  enableColumnResize = true,
  enableColumnReorder = true,
  enableColumnPinning = false,
  initialState,
  stateVersion,
  onStateChange,
  onRowClick,
  aiControl,
  rightControls,
}: DatabaseTableProps<Row>) {
  const hasNameColumn = useMemo(
    () => columns.some((column) => column.id === 'name'),
    [columns]
  );
  const hasActionsColumn = useMemo(
    () => columns.some((column) => column.id === 'actions'),
    [columns]
  );
  const fixedFirstColumnId = hasNameColumn ? 'name' : null;
  const fixedLastColumnId = hasActionsColumn ? 'actions' : null;
  const alwaysVisibleIdSet = useMemo(() => {
    const set = new Set<string>();
    if (fixedFirstColumnId) set.add(fixedFirstColumnId);
    if (fixedLastColumnId) set.add(fixedLastColumnId);
    return set;
  }, [fixedFirstColumnId, fixedLastColumnId]);

  const hasInitializedRef = useRef(false);
  const appliedStateVersionRef = useRef<string | number | undefined>(undefined);
  const defaultVisibleIds = useMemo(
    () =>
      defaultVisibleColumnIds && defaultVisibleColumnIds.length > 0
        ? defaultVisibleColumnIds
        : columns.filter((column) => column.isDefaultVisible !== false).map((column) => column.id),
    [columns, defaultVisibleColumnIds]
  );
  const defaultOrderIds = useMemo(() => columns.map((column) => column.id), [columns]);

  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(defaultVisibleIds);
  const [sort, setSort] = useState<{ columnId: string; direction: SortDirection } | null>(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<Record<string, string | string[]>>({});
  const [density, setDensity] = useState<Density>('compact');
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultOrderIds);
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [pinnedColumns, setPinnedColumns] = useState<{ left: string[]; right: string[] }>({
    left: [],
    right: [],
  });
  const [showColumnsMenu, setShowColumnsMenu] = useState(false);
  const [showFiltersMenu, setShowFiltersMenu] = useState(false);
  const [focusView, setFocusView] = useState(false);
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const [resizeState, setResizeState] = useState<{
    columnId: string;
    startX: number;
    startWidth: number;
  } | null>(null);
  const headerCheckboxRef = useRef<HTMLInputElement | null>(null);
  const columnsMenuRef = useRef<HTMLDivElement | null>(null);
  const filtersMenuRef = useRef<HTMLDivElement | null>(null);
  const tableRootRef = useRef<HTMLDivElement | null>(null);

  const normalizeVisibleColumnIds = useCallback((inputIds: string[], validColumnIdSet: Set<string>) => {
    const deduped = inputIds.filter((id, index) => inputIds.indexOf(id) === index);
    const visible = deduped.filter((id) => validColumnIdSet.has(id));
    alwaysVisibleIdSet.forEach((id) => {
      if (validColumnIdSet.has(id) && !visible.includes(id)) visible.push(id);
    });
    return visible;
  }, [alwaysVisibleIdSet]);

  const normalizeColumnOrderIds = useCallback((inputIds: string[], validColumnIdSet: Set<string>) => {
    const deduped = inputIds.filter((id, index) => inputIds.indexOf(id) === index && validColumnIdSet.has(id));
    const withoutFixed = deduped.filter((id) => id !== fixedFirstColumnId && id !== fixedLastColumnId);
    if (fixedFirstColumnId && validColumnIdSet.has(fixedFirstColumnId)) withoutFixed.unshift(fixedFirstColumnId);
    if (
      fixedLastColumnId &&
      validColumnIdSet.has(fixedLastColumnId)
    ) {
      withoutFixed.push(fixedLastColumnId);
    }
    return withoutFixed;
  }, [fixedFirstColumnId, fixedLastColumnId]);

  useEffect(() => {
    const hasVersionUpdate =
      stateVersion !== undefined && stateVersion !== appliedStateVersionRef.current;
    if (hasInitializedRef.current && !hasVersionUpdate) return;
    hasInitializedRef.current = true;
    if (stateVersion !== undefined) appliedStateVersionRef.current = stateVersion;

    const nextVisible = [...defaultVisibleIds];
    const nextOrder = [...defaultOrderIds];
    let nextSort: { columnId: string; direction: SortDirection } | null = null;
    let nextDensity: Density = 'compact';
    let nextSearch = '';
    let nextFilters: Record<string, string | string[]> = {};
    let nextSelectedRowIds = new Set<string>();
    let nextColumnWidths: Record<string, number> = {};
    let nextPinned: { left: string[]; right: string[] } = { left: [], right: [] };

    if (persistedStateKey) {
      try {
        const raw = localStorage.getItem(persistedStateKey);
        if (raw) {
          const parsed = JSON.parse(raw) as DatabaseTableState;
          if (parsed.visibleColumnIds && parsed.visibleColumnIds.length > 0) nextVisible.splice(0, nextVisible.length, ...parsed.visibleColumnIds);
          if (parsed.columnOrder && parsed.columnOrder.length > 0) nextOrder.splice(0, nextOrder.length, ...parsed.columnOrder);
          if (parsed.sort?.columnId && (parsed.sort.direction === 'asc' || parsed.sort.direction === 'desc')) nextSort = parsed.sort;
          if (parsed.density === 'comfortable' || parsed.density === 'compact') nextDensity = parsed.density;
          if (typeof parsed.search === 'string') nextSearch = parsed.search;
          if (parsed.filters && typeof parsed.filters === 'object') nextFilters = parsed.filters;
          if (Array.isArray(parsed.selectedRowIds)) nextSelectedRowIds = new Set(parsed.selectedRowIds);
          if (parsed.columnWidths && typeof parsed.columnWidths === 'object') nextColumnWidths = parsed.columnWidths;
          if (parsed.pinnedColumns && typeof parsed.pinnedColumns === 'object') {
            nextPinned = {
              left: Array.isArray(parsed.pinnedColumns.left) ? parsed.pinnedColumns.left : [],
              right: Array.isArray(parsed.pinnedColumns.right) ? parsed.pinnedColumns.right : [],
            };
          }
        }
      } catch {
        // Ignore parse/storage errors in local table preferences.
      }
    }

    if (initialState) {
      if (initialState.visibleColumnIds && initialState.visibleColumnIds.length > 0) nextVisible.splice(0, nextVisible.length, ...initialState.visibleColumnIds);
      if (initialState.columnOrder && initialState.columnOrder.length > 0) nextOrder.splice(0, nextOrder.length, ...initialState.columnOrder);
      if (initialState.sort?.columnId && (initialState.sort.direction === 'asc' || initialState.sort.direction === 'desc')) nextSort = initialState.sort;
      if (initialState.density === 'comfortable' || initialState.density === 'compact') nextDensity = initialState.density;
      if (typeof initialState.search === 'string') nextSearch = initialState.search;
      if (initialState.filters && typeof initialState.filters === 'object') nextFilters = initialState.filters;
      if (Array.isArray(initialState.selectedRowIds)) nextSelectedRowIds = new Set(initialState.selectedRowIds);
      if (initialState.columnWidths && typeof initialState.columnWidths === 'object') nextColumnWidths = initialState.columnWidths;
      if (initialState.pinnedColumns) {
        nextPinned = {
          left: initialState.pinnedColumns.left ?? [],
          right: initialState.pinnedColumns.right ?? [],
        };
      }
    }

    const validColumnIdSet = new Set(columns.map((column) => column.id));
    const sanitizedVisible = normalizeVisibleColumnIds(nextVisible, validColumnIdSet);
    const sanitizedOrder = normalizeColumnOrderIds(nextOrder, validColumnIdSet);
    const missingInOrder = defaultOrderIds.filter((id) => !sanitizedOrder.includes(id));
    const mergedOrder = normalizeColumnOrderIds([...sanitizedOrder, ...missingInOrder], validColumnIdSet);
    const fallbackVisible = normalizeVisibleColumnIds(
      sanitizedVisible.length > 0 ? sanitizedVisible : defaultVisibleIds,
      validColumnIdSet
    );
    const sanitizedSort =
      nextSort && validColumnIdSet.has(nextSort.columnId) ? nextSort : null;
    const sanitizedPinnedLeft = nextPinned.left.filter((id) => validColumnIdSet.has(id));
    const sanitizedPinnedRight = nextPinned.right.filter((id) => validColumnIdSet.has(id) && !sanitizedPinnedLeft.includes(id));

    setVisibleColumnIds(fallbackVisible);
    setColumnOrder(mergedOrder);
    setSort(sanitizedSort);
    setDensity(nextDensity);
    setSearch(nextSearch);
    setFilters(nextFilters);
    setSelectedRowIds(nextSelectedRowIds);
    setColumnWidths(nextColumnWidths);
    setPinnedColumns({ left: sanitizedPinnedLeft, right: sanitizedPinnedRight });
  }, [alwaysVisibleIdSet, columns, defaultOrderIds, defaultVisibleIds, initialState, normalizeColumnOrderIds, normalizeVisibleColumnIds, persistedStateKey, stateVersion]);

  useEffect(() => {
    if (!persistedStateKey) return;
    const payload: DatabaseTableState = {
      visibleColumnIds,
      columnOrder,
      sort,
      density,
      search,
      filters,
      selectedRowIds: [...selectedRowIds],
      columnWidths,
      pinnedColumns,
    };
    try {
      localStorage.setItem(persistedStateKey, JSON.stringify(payload));
    } catch {
      // Ignore storage quota/private mode errors.
    }
  }, [columnOrder, columnWidths, density, filters, persistedStateKey, pinnedColumns, search, selectedRowIds, sort, visibleColumnIds]);

  useEffect(() => {
    if (!onStateChange) return;
    onStateChange({
      visibleColumnIds,
      columnOrder,
      sort,
      density,
      search,
      filters,
      selectedRowIds: [...selectedRowIds],
      columnWidths,
      pinnedColumns,
    });
  }, [columnOrder, columnWidths, density, filters, onStateChange, pinnedColumns, search, selectedRowIds, sort, visibleColumnIds]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target as Node;
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(target)) setShowColumnsMenu(false);
      if (filtersMenuRef.current && !filtersMenuRef.current.contains(target)) setShowFiltersMenu(false);
    }
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  useEffect(() => {
    const root = tableRootRef.current;
    const tableEl = root?.querySelector('table');
    const hasSelectionBar = enableRowSelection && selectedRowIds.size > 0;
    const hasActiveFilters = Object.values(filters).some((value) =>
      Array.isArray(value) ? value.length > 0 : Boolean(value)
    );
    // #region agent log
    fetch('http://127.0.0.1:7870/ingest/3980ba0b-2c70-4db9-9b3e-8d661282845b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'752e2f'},body:JSON.stringify({sessionId:'752e2f',runId:'pre-fix',hypothesisId:'H3',location:'DatabaseTable.tsx:323',message:'database table width snapshot',data:{windowWidth:window.innerWidth,rootWidth:root?.getBoundingClientRect().width ?? null,tableWidth:tableEl?.getBoundingClientRect().width ?? null,visibleColumnCount:visibleColumnIds.length,density,hasSelectionBar,hasActiveFilters},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [density, enableRowSelection, filters, selectedRowIds, visibleColumnIds.length]);

  useEffect(() => {
    if (!resizeState) return;
    function handleMouseMove(event: MouseEvent) {
      const deltaX = event.clientX - resizeState!.startX;
      const nextWidth = Math.max(96, resizeState!.startWidth + deltaX);
      setColumnWidths((current) => ({ ...current, [resizeState!.columnId]: nextWidth }));
    }
    function handleMouseUp() {
      setResizeState(null);
    }
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizeState]);

  const orderedColumns = useMemo(() => {
    const validColumnIdSet = new Set(columns.map((column) => column.id));
    const byId = new Map(columns.map((column) => [column.id, column]));
    const ordered = normalizeColumnOrderIds(columnOrder, validColumnIdSet)
      .map((id) => byId.get(id))
      .filter((column): column is DatabaseTableColumn<Row> => Boolean(column));
    const missing = columns.filter((column) => !ordered.some((item) => item.id === column.id));
    return normalizeColumnOrderIds(
      [...ordered, ...missing].map((column) => column.id),
      validColumnIdSet
    )
      .map((id) => byId.get(id))
      .filter((column): column is DatabaseTableColumn<Row> => Boolean(column));
  }, [columnOrder, columns, normalizeColumnOrderIds]);

  const visibleColumns = useMemo(() => {
    const filtered = orderedColumns.filter(
      (column) => visibleColumnIds.includes(column.id) || column.isHideable === false
    );
    const leftPinned = filtered.filter(
      (column) =>
        column.id === fixedFirstColumnId ||
        (enableColumnPinning &&
          pinnedColumns.left.includes(column.id) &&
          column.id !== fixedLastColumnId)
    );
    const rightPinned = filtered.filter(
      (column) =>
        column.id === fixedLastColumnId ||
        (enableColumnPinning &&
          pinnedColumns.right.includes(column.id) &&
          column.id !== fixedFirstColumnId)
    );
    const center = filtered.filter(
      (column) => !leftPinned.some((item) => item.id === column.id) && !rightPinned.some((item) => item.id === column.id)
    );
    return [...leftPinned, ...center, ...rightPinned];
  }, [enableColumnPinning, fixedFirstColumnId, fixedLastColumnId, orderedColumns, pinnedColumns.left, pinnedColumns.right, visibleColumnIds]);

  const searchableIdSet = useMemo(
    () => new Set(searchableColumnIds),
    [searchableColumnIds]
  );

  const filterOptions = useMemo(() => {
    const byColumn: Record<string, DatabaseTableFilterOption[]> = {};
    filterableColumnIds.forEach((columnId) => {
      const customOptions = filterOptionsByColumnId?.[columnId];
      if (customOptions && customOptions.length > 0) {
        byColumn[columnId] = customOptions;
        return;
      }
      const column = columns.find((item) => item.id === columnId);
      if (!column) return;
      const values = new Set<string>();
      rows.forEach((row) => {
        const raw = getColumnValue(column, row);
        if (raw === null || raw === undefined || raw === '') return;
        values.add(String(raw));
      });
      byColumn[columnId] = [...values]
        .sort((a, b) => a.localeCompare(b))
        .map((value) => ({ value, label: value }));
    });
    return byColumn;
  }, [columns, filterOptionsByColumnId, filterableColumnIds, rows]);
  const hasActiveFilters = useMemo(
    () =>
      Object.values(filters).some((value) =>
        Array.isArray(value) ? value.length > 0 : Boolean(value)
      ),
    [filters]
  );
  const visibleFilterColumnIds = useMemo(
    () =>
      filterableColumnIds.filter((columnId) =>
        columns.some((column) => column.id === columnId)
      ),
    [filterableColumnIds, columns]
  );

  const processedRows = useMemo(() => {
    let result = [...rows];

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((row) => {
        const idsToSearch = searchableIdSet.size > 0 ? searchableColumnIds : columns.map((column) => column.id);
        return idsToSearch.some((columnId) => {
          const column = columns.find((item) => item.id === columnId);
          if (!column) return false;
          const value = getColumnValue(column, row);
          return String(value ?? '').toLowerCase().includes(query);
        });
      });
    }

    Object.entries(filters).forEach(([columnId, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) return;
        const column = columns.find((item) => item.id === columnId);
        if (!column) return;
        const selectedRawValues = new Set<string>();
        value.forEach((selectedValue) => {
          const option = filterOptions[columnId]?.find(
            (candidate) => candidate.value === selectedValue
          );
          if (option?.matches && option.matches.length > 0) {
            option.matches.forEach((match) => selectedRawValues.add(match));
          } else {
            selectedRawValues.add(selectedValue);
          }
        });
        result = result.filter((row) =>
          selectedRawValues.has(String(getColumnValue(column, row) ?? ''))
        );
        return;
      }
      if (!value) return;
      const column = columns.find((item) => item.id === columnId);
      if (!column) return;
      const selectedOption = filterOptions[columnId]?.find((option) => option.value === value);
      if (selectedOption?.matches && selectedOption.matches.length > 0) {
        result = result.filter((row) =>
          selectedOption.matches?.includes(String(getColumnValue(column, row) ?? ''))
        );
        return;
      }
      result = result.filter((row) => String(getColumnValue(column, row) ?? '') === value);
    });

    if (sort) {
      const sortColumn = columns.find((column) => column.id === sort.columnId);
      if (sortColumn) {
        result.sort((a, b) => {
          const aValue = getColumnValue(sortColumn, a);
          const bValue = getColumnValue(sortColumn, b);
          const comparison = comparePrimitive(aValue, bValue);
          return sort.direction === 'asc' ? comparison : -comparison;
        });
      }
    }

    return result;
  }, [columns, filterOptions, filters, rows, search, searchableColumnIds, searchableIdSet, sort]);

  const visibleRowIds = useMemo(() => processedRows.map((row) => getRowId(row)), [getRowId, processedRows]);
  const allVisibleSelected = visibleRowIds.length > 0 && visibleRowIds.every((id) => selectedRowIds.has(id));
  const someVisibleSelected = !allVisibleSelected && visibleRowIds.some((id) => selectedRowIds.has(id));
  const selectedRows = useMemo(
    () => rows.filter((row) => selectedRowIds.has(getRowId(row))),
    [getRowId, rows, selectedRowIds]
  );

  useEffect(() => {
    if (!headerCheckboxRef.current) return;
    headerCheckboxRef.current.indeterminate = someVisibleSelected;
  }, [someVisibleSelected]);

  const rowCellPadding = density === 'compact' ? 'py-1.5' : 'py-2.5';
  const headerCellPadding = density === 'compact' ? 'py-1' : 'py-1.5';

  function toggleSort(columnId: string) {
    setSort((current) => {
      if (!current || current.columnId !== columnId) return { columnId, direction: 'asc' };
      if (current.direction === 'asc') return { columnId, direction: 'desc' };
      return null;
    });
  }

  function getSelectedValuesForColumn(
    filterSet: Record<string, string | string[]>,
    columnId: string
  ) {
    const raw = filterSet[columnId];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string' && raw) return [raw];
    return [];
  }

  function toggleFilterValue(
    columnId: string,
    value: string,
    selectionMode: 'single' | 'multi'
  ) {
    setFilters((current) => {
      const selectedValues = getSelectedValuesForColumn(current, columnId);
      const nextValues =
        selectionMode === 'single'
          ? selectedValues.includes(value)
            ? []
            : [value]
          : selectedValues.includes(value)
            ? selectedValues.filter((item) => item !== value)
            : [...selectedValues, value];
      return {
        ...current,
        [columnId]: nextValues,
      };
    });
  }

  function getColumnWidthStyle(column: DatabaseTableColumn<Row>): string | undefined {
    if (column.id === fixedLastColumnId) return '72px';
    if (column.id === fixedFirstColumnId) return undefined;
    const customWidth = columnWidths[column.id];
    if (typeof customWidth === 'number') return `${customWidth}px`;
    return column.width;
  }

  const leftOffsets = useMemo(() => {
    let running = enableRowSelection ? 40 : 0;
    const map: Record<string, number> = {};
    visibleColumns.forEach((column) => {
      const isPinnedLeft =
        column.id === fixedFirstColumnId ||
        (enableColumnPinning &&
          pinnedColumns.left.includes(column.id) &&
          column.id !== fixedLastColumnId);
      if (isPinnedLeft) {
        map[column.id] = running;
        running += columnWidths[column.id] ?? 160;
      }
    });
    return map;
  }, [columnWidths, enableColumnPinning, enableRowSelection, fixedFirstColumnId, fixedLastColumnId, pinnedColumns.left, visibleColumns]);

  const rightOffsets = useMemo(() => {
    let running = 0;
    const map: Record<string, number> = {};
    [...visibleColumns].reverse().forEach((column) => {
      const isPinnedRight =
        column.id === fixedLastColumnId ||
        (enableColumnPinning &&
          pinnedColumns.right.includes(column.id) &&
          column.id !== fixedFirstColumnId);
      if (isPinnedRight) {
        map[column.id] = running;
        running += columnWidths[column.id] ?? 160;
      }
    });
    return map;
  }, [columnWidths, enableColumnPinning, fixedFirstColumnId, fixedLastColumnId, pinnedColumns.right, visibleColumns]);

  function toggleColumnVisibility(columnId: string) {
    if (alwaysVisibleIdSet.has(columnId)) return;
    const column = columns.find((item) => item.id === columnId);
    if (column?.isHideable === false) return;
    setVisibleColumnIds((current) => {
      const validColumnIdSet = new Set(columns.map((item) => item.id));
      if (current.includes(columnId)) {
        if (visibleFilterColumnIds.includes(columnId)) {
          setFilters((currentFilters) => {
            if (!(columnId in currentFilters)) return currentFilters;
            const nextFilters = { ...currentFilters };
            delete nextFilters[columnId];
            return nextFilters;
          });
        }
        const next = normalizeVisibleColumnIds(
          current.filter((id) => id !== columnId),
          validColumnIdSet
        );
        return next.length > 0 ? next : normalizeVisibleColumnIds(current, validColumnIdSet);
      }
      return normalizeVisibleColumnIds([...current, columnId], validColumnIdSet);
    });
  }

  function reorderColumns(fromId: string, toId: string) {
    if (fromId === toId) return;
    if (fromId === fixedFirstColumnId || fromId === fixedLastColumnId) return;
    setColumnOrder((current) => {
      const next = [...current];
      const fromIndex = next.indexOf(fromId);
      const toIndex = next.indexOf(toId);
      if (fromIndex < 0 || toIndex < 0) return current;
      next.splice(fromIndex, 1);
      next.splice(toIndex, 0, fromId);
      return normalizeColumnOrderIds(next, new Set(columns.map((column) => column.id)));
    });
  }

  const configurableColumns = orderedColumns.filter(
    (column) =>
      !alwaysVisibleIdSet.has(column.id) &&
      column.isHideable !== false &&
      column.header.trim().length > 0
  );
  const allConfigurableVisible =
    configurableColumns.length > 0 &&
    configurableColumns.every((column) => visibleColumnIds.includes(column.id));

  function toggleSelectAllVisible() {
    setSelectedRowIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        visibleRowIds.forEach((id) => next.delete(id));
      } else {
        visibleRowIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  const hasSelectionBar = enableRowSelection && selectedRowIds.size > 0;

  return (
    <div ref={tableRootRef}>
      <div className={`flex flex-wrap items-center gap-2 ${hasSelectionBar ? 'mb-2' : 'mb-3'}`}>
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
            }}
            placeholder={searchPlaceholder}
            className="input-base w-56 pl-7"
          />
        </div>
        {aiControl}

        <div ref={filtersMenuRef} className="relative">
          <TooltipIconButton
            onClick={() =>
              setShowFiltersMenu((value) => {
                return !value;
              })
            }
            tooltip="Filter rows"
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
          </TooltipIconButton>
          {showFiltersMenu && visibleFilterColumnIds.length > 0 && (
            <div className="absolute left-0 top-full mt-1 z-20 w-64 rounded-lg border border-gray-200 bg-white px-1.5 py-1 shadow-lg">
              <div className="space-y-1">
                <p className="px-1.5 pt-0.5 pb-0.5 text-xs font-semibold text-gray-500">Filter by</p>
                {visibleFilterColumnIds.map((columnId) => {
                  const column = columns.find((item) => item.id === columnId);
                  if (!column) return null;
                  const options = filterOptions[columnId] ?? [];
                  const selectionMode =
                    filterSelectionModeByColumnId?.[columnId] ?? 'single';
                  const sectionLabel = filterSectionLabelByColumnId?.[columnId] ?? column.header;
                  const selectedValues = getSelectedValuesForColumn(
                    filters,
                    columnId
                  );
                  return (
                    <div key={columnId} className="space-y-0.5">
                      <p className="px-1.5 pt-0.5 text-2xs font-semibold text-gray-400">{sectionLabel}</p>
                      {options.map((option) => (
                        <button
                          key={`${columnId}-${option.value}`}
                          onClick={() =>
                            toggleFilterValue(
                              columnId,
                              option.value,
                              selectionMode
                            )
                          }
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
                    onClick={() => setFilters({})}
                    className="rounded px-1.5 py-0.5 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-800"
                  >
                    Clear filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {rightControls}
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {Object.entries(filters).flatMap(([columnId, value]) => {
            const column = columns.find((item) => item.id === columnId);
            if (!column) return [];
            const options = filterOptions[columnId] ?? [];
            const values = Array.isArray(value) ? value : value ? [value] : [];
            return values.map((selectedValue) => {
              const option = options.find((item) => item.value === selectedValue);
              const label = option?.label ?? selectedValue;
              return (
                <button
                  key={`${columnId}-${selectedValue}`}
                  onClick={() =>
                    setFilters((current) => {
                      const currentValue = current[columnId];
                      if (Array.isArray(currentValue)) {
                        const nextValues = currentValue.filter(
                          (item) => item !== selectedValue
                        );
                        if (nextValues.length === 0) {
                          const next = { ...current };
                          delete next[columnId];
                          return next;
                        }
                        return {
                          ...current,
                          [columnId]: nextValues,
                        };
                      }
                      const next = { ...current };
                      delete next[columnId];
                      return next;
                    })
                  }
                  className="rounded-full border border-gray-200 px-2 py-0.5 text-2xs text-gray-700 hover:bg-gray-50"
                >
                  {`${column.header}: ${label} ×`}
                </button>
              );
            });
          })}
          <button
            onClick={() => setFilters({})}
            className="text-2xs text-gray-500 hover:text-gray-700"
          >
            Clear all
          </button>
        </div>
      ) : null}

      {hasSelectionBar && (
        <div className="flex items-center gap-2 border-b border-gray-100 pb-1">
          <p className="text-xs text-gray-600">{selectedRowIds.size} selected</p>
          <span className="text-2xs text-gray-400">•</span>
          <button
            onClick={() => setSelectedRowIds(new Set())}
            className="text-2xs text-gray-500 hover:text-gray-700"
          >
            Clear selection
          </button>
          <div className="ml-auto flex items-center gap-1">
            {bulkActions.map((action) => (
              <button
                key={action.id}
                onClick={() => onBulkAction?.(action.id, selectedRows)}
                className={`rounded border px-2 py-1 text-2xs ${
                  action.danger
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={hasSelectionBar ? 'overflow-visible bg-white mt-0' : 'overflow-visible bg-white'} data-focus-view={focusView ? '' : undefined}>
        <table className="w-full table-fixed">
          <thead>
            <tr className="border-b border-gray-200">
              {enableRowSelection && (
                <th className={`w-10 px-2 ${headerCellPadding} text-left`}>
                  <input
                    ref={headerCheckboxRef}
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAllVisible}
                    className="h-3.5 w-3.5 rounded border-gray-300"
                  />
                </th>
              )}
              {visibleColumns.map((column) => (
                <th
                  key={column.id}
                  draggable={enableColumnReorder && !alwaysVisibleIdSet.has(column.id)}
                  onDragStart={(event) => {
                    if (!enableColumnReorder || alwaysVisibleIdSet.has(column.id)) return;
                    event.dataTransfer.effectAllowed = 'move';
                    event.dataTransfer.setData('text/plain', column.id);
                    setDraggingColumnId(column.id);
                  }}
                  onDragOver={(event) => {
                    if (!enableColumnReorder) return;
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={(event) => {
                    if (!enableColumnReorder) return;
                    const fromId = draggingColumnId || event.dataTransfer.getData('text/plain');
                    if (!fromId) return;
                    reorderColumns(fromId, column.id);
                    setDraggingColumnId(null);
                  }}
                  onDragEnd={() => setDraggingColumnId(null)}
                  style={{
                    width: getColumnWidthStyle(column),
                    minWidth: columnWidths[column.id] ? `${columnWidths[column.id]}px` : undefined,
                    ...((column.id === fixedFirstColumnId ||
                      (enableColumnPinning &&
                        pinnedColumns.left.includes(column.id) &&
                        column.id !== fixedLastColumnId))
                      ? { position: 'sticky', left: `${leftOffsets[column.id] ?? 0}px`, zIndex: 4, background: 'white' }
                      : {}),
                    ...((column.id === fixedLastColumnId ||
                      (enableColumnPinning &&
                        pinnedColumns.right.includes(column.id) &&
                        column.id !== fixedFirstColumnId))
                      ? { position: 'sticky', right: `${rightOffsets[column.id] ?? 0}px`, zIndex: 4, background: 'white' }
                      : {}),
                  }}
                  className={`relative px-3 ${headerCellPadding} text-2xs font-semibold text-gray-500 ${
                    column.align === 'right'
                      ? 'text-right'
                      : column.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                  } ${draggingColumnId === column.id ? 'opacity-60' : ''}`}
                >
                  <button
                    onClick={() => {
                      if (column.isSortable === false) return;
                      toggleSort(column.id);
                    }}
                    className={`inline-flex items-center gap-1 ${
                      column.align === 'right' ? 'ml-auto' : ''
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {column.header}
                      {column.headerTooltip && (
                        <span className="group/htt relative inline-flex">
                          <Info size={12} className="text-gray-400 hover:text-gray-600" />
                          <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 w-56 -translate-x-1/2 rounded bg-gray-900 px-2 py-1.5 text-left text-2xs font-normal leading-snug text-white opacity-0 shadow-lg transition-opacity z-50 group-hover/htt:opacity-100">
                            {column.headerTooltip}
                          </span>
                        </span>
                      )}
                    </span>
                    {column.isSortable === false ? null : sort?.columnId === column.id ? (
                      sort.direction === 'asc' ? (
                        <ChevronUp size={11} />
                      ) : (
                        <ChevronDown size={11} />
                      )
                    ) : (
                      <ChevronsUpDown size={11} className="text-gray-300" />
                    )}
                  </button>
                  {enableColumnResize && (
                    <button
                      disabled={alwaysVisibleIdSet.has(column.id)}
                      onMouseDown={(event) => {
                        if (alwaysVisibleIdSet.has(column.id)) return;
                        event.preventDefault();
                        event.stopPropagation();
                        setResizeState({
                          columnId: column.id,
                          startX: event.clientX,
                          startWidth: (event.currentTarget.parentElement?.getBoundingClientRect().width ?? 160),
                        });
                      }}
                      className={`absolute right-0 top-0 h-full w-1.5 bg-transparent ${
                        alwaysVisibleIdSet.has(column.id)
                          ? 'cursor-default'
                          : 'cursor-col-resize hover:bg-blue-100'
                      }`}
                    />
                  )}
                </th>
              ))}
              {configurableColumns.length > 0 && (
                <th className="relative w-8 px-1 text-right" style={{ position: 'sticky', right: 0, zIndex: 4, background: 'white' }}>
                  <div ref={columnsMenuRef} className="relative inline-block">
                  <button
                    onClick={() => setShowColumnsMenu((v) => !v)}
                    className={`inline-flex items-center justify-center rounded px-1 py-0.5 text-xs mt-1.5 ${showColumnsMenu ? 'text-gray-700' : 'text-gray-400 hover:text-gray-700'}`}
                    title="Table preferences"
                  >
                    <SlidersHorizontal size={12} />
                  </button>
                  {showColumnsMenu && (
                    <div className="absolute right-0 top-full mt-1 z-30 w-52 rounded-lg border border-gray-200 bg-white py-1.5 shadow-lg">
                      <div className="flex items-center justify-between px-3 pb-1 pt-0.5">
                        <p className="text-left text-xs font-semibold text-gray-500">Show columns</p>
                      </div>
                      {configurableColumns.map((column) => {
                        const checked = visibleColumnIds.includes(column.id);
                        return (
                          <label
                            key={column.id}
                            className="flex cursor-pointer items-center gap-2 px-3 py-0.5 text-xs font-normal text-gray-700 hover:bg-gray-50"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleColumnVisibility(column.id)}
                              className="h-3 w-3 rounded border-gray-300"
                            />
                            {column.header}
                          </label>
                        );
                      })}
                      <div className="mt-1 border-t border-gray-100 px-2 pt-1 pb-0.5">
                        <button
                          onClick={() => {
                            if (allConfigurableVisible) {
                              setVisibleColumnIds((current) =>
                                current.filter((id) => !configurableColumns.some((column) => column.id === id))
                              );
                            } else {
                              setVisibleColumnIds((current) => {
                                const next = new Set(current);
                                configurableColumns.forEach((column) => next.add(column.id));
                                return [...next];
                              });
                            }
                          }}
                          className="text-2xs text-gray-600 hover:text-gray-800"
                        >
                          {allConfigurableVisible ? 'Hide all columns' : 'Show all columns'}
                        </button>
                      </div>
                      <div className="border-t border-gray-100 px-3 py-1.5">
                        <div className="flex cursor-pointer items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-xs text-gray-700">
                            <EyeOff size={11} className="text-gray-400" />
                            Focus view
                          </span>
                          <button
                            role="switch"
                            aria-checked={focusView}
                            onClick={() => setFocusView((v) => !v)}
                            className={`relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${focusView ? 'bg-gray-800' : 'bg-gray-200'}`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${focusView ? 'translate-x-3' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {processedRows.length === 0 ? (
              <tr>
                <td colSpan={Math.max(visibleColumns.length + (enableRowSelection ? 1 : 0), 1)} className="px-3 py-8 text-center text-xs text-gray-500">
                  {emptyStateText}
                </td>
              </tr>
            ) : (
              processedRows.map((row) => (
                <tr
                  key={getRowId(row)}
                  className={`border-b border-gray-100 last:border-0 ${
                    onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                  }`}
                >
                  {enableRowSelection && (
                    <td
                      className={`w-10 px-2 ${rowCellPadding}`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRowIds.has(getRowId(row))}
                        onClick={(event) => event.stopPropagation()}
                        onChange={() =>
                          setSelectedRowIds((current) => {
                            const next = new Set(current);
                            const rowId = getRowId(row);
                            if (next.has(rowId)) next.delete(rowId);
                            else next.add(rowId);
                            return next;
                          })
                        }
                        className="h-3.5 w-3.5 rounded border-gray-300"
                      />
                    </td>
                  )}
                  {visibleColumns.map((column) => (
                    <td
                      key={`${getRowId(row)}-${column.id}`}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      style={{
                        width: getColumnWidthStyle(column),
                        minWidth: columnWidths[column.id] ? `${columnWidths[column.id]}px` : undefined,
                        ...((column.id === fixedFirstColumnId ||
                          (enableColumnPinning &&
                            pinnedColumns.left.includes(column.id) &&
                            column.id !== fixedLastColumnId))
                          ? { position: 'sticky', left: `${leftOffsets[column.id] ?? 0}px`, zIndex: 2, background: 'inherit' }
                          : {}),
                        ...((column.id === fixedLastColumnId ||
                          (enableColumnPinning &&
                            pinnedColumns.right.includes(column.id) &&
                            column.id !== fixedFirstColumnId))
                          ? { position: 'sticky', right: `${rightOffsets[column.id] ?? 0}px`, zIndex: 2, background: 'inherit' }
                          : {}),
                      }}
                      className={`px-3 ${rowCellPadding} text-xs text-gray-700 ${
                        column.align === 'right'
                          ? 'text-right'
                          : column.align === 'center'
                            ? 'text-center'
                            : 'text-left'
                      }${column.cellClassName ? ` ${column.cellClassName}` : ''}`}
                    >
                      {column.accessor(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function getColumnValue<Row>(column: DatabaseTableColumn<Row>, row: Row): Primitive {
  if (column.getValue) return column.getValue(row);
  const rendered = column.accessor(row);
  if (typeof rendered === 'string' || typeof rendered === 'number' || typeof rendered === 'boolean') return rendered;
  return null;
}

function TooltipIconButton({
  tooltip,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { tooltip: string }) {
  return (
    <div className="group relative inline-flex">
      <button {...props} aria-label={tooltip} className={className}>
        {children}
      </button>
      <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-2xs text-white opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
        {tooltip}
      </span>
    </div>
  );
}

function comparePrimitive(a: Primitive, b: Primitive): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}
