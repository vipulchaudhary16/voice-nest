import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import {
  tableElementClass,
  theadStickyBelowBarClass,
  headerRowClass,
  thBaseClass,
  tbodyClass,
  trBodyClass,
  tdBaseClass,
} from '../components/TableSurface';
import { Phone, PhoneOutgoing, Clock, Calendar, Search, ChevronDown } from 'lucide-react';
import tingSoundUrl from '../assets/ting-sound.mp3';
import {
  formatCallStatusLabel,
  getCallStatusTooltip,
  callStatusBadgeClass,
} from '../utils/callStatus';

function digitsOnly(s) {
  return String(s ?? '').replace(/\D/g, '');
}

function callMatchesFilters(call, dateStr, searchRaw) {
  const q = String(searchRaw ?? '').trim();
  if (q) {
    const needle = digitsOnly(q) || q.toLowerCase();
    const hayFrom = digitsOnly(q) ? digitsOnly(call.from) : String(call.from).toLowerCase();
    const hayTo = digitsOnly(q) ? digitsOnly(call.to) : String(call.to).toLowerCase();
    if (!hayFrom.includes(needle) && !hayTo.includes(needle)) return false;
  }
  if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const t = new Date(call.time);
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    if (`${y}-${m}-${d}` !== dateStr) return false;
  }
  return true;
}

const time12hOptions = {
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
};

function groupCallsByLocalDate(callsList) {
  const buckets = new Map();
  for (const call of callsList) {
    const t = new Date(call.time);
    const key = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
    const label = t.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!buckets.has(key)) buckets.set(key, { key, label, items: [] });
    buckets.get(key).items.push(call);
  }
  return [...buckets.values()].sort((a, b) => (a.key < b.key ? 1 : -1));
}

function CallsDayTable({ calls }) {
  const columns = useMemo(
    () => [
      {
        id: 'parties',
        header: 'To / From',
        cell: ({ row }) => {
          const call = row.original;
          return (
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)]">
                <PhoneOutgoing className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)] tracking-wide">
                  {call.to_name || call.to}
                </p>
                {call.to_name && (
                  <p className="text-xs text-[var(--text-secondary)] font-mono opacity-70">
                    {call.to}
                  </p>
                )}
                <p className="text-xs text-[var(--text-secondary)] font-mono opacity-60">
                  from: {call.from}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'time',
        header: 'Time',
        cell: ({ row }) => {
          const call = row.original;
          return (
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Clock className="w-3.5 h-3.5" />
              {new Date(call.time).toLocaleTimeString(undefined, time12hOptions)}{' '}
              <span className="text-xs opacity-50 ml-1">
                {new Date(call.time).toLocaleDateString()}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <span
              title={getCallStatusTooltip(status)}
              className={`inline-flex max-w-full cursor-help px-2.5 py-1 rounded-full text-xs font-semibold border ${callStatusBadgeClass(status)}`}
            >
              {formatCallStatusLabel(status)}
            </span>
          );
        },
      },
      {
        id: 'meta',
        header: 'Digits/Meta',
        cell: ({ row }) => {
          const call = row.original;
          return (
            <span className="text-xs font-mono text-[var(--text-muted)] truncate max-w-[200px] inline-block">
              {call.metadata?.digits
                ? `Digits: ${call.metadata.digits}`
                : `${JSON.stringify(call.metadata ?? {}).substring(0, 30)}...`}
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: calls,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row._id,
  });

  return (
    <table className={tableElementClass}>
      <thead className={theadStickyBelowBarClass}>
        {table.getHeaderGroups().map((hg) => (
          <tr key={hg.id} className={headerRowClass}>
            {hg.headers.map((h) => (
              <th key={h.id} className={thBaseClass}>
                {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody className={tbodyClass}>
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className={`${trBodyClass} animate-in fade-in duration-500`}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className={tdBaseClass}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function CallsPage() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [expandedKeys, setExpandedKeys] = useState(() => new Set());
  const socket = useSocket();
  const tingAudioRef = useRef(/** @type {HTMLAudioElement | null} */ (null));

  useEffect(() => {
    const a = new Audio(tingSoundUrl);
    a.preload = 'auto';
    tingAudioRef.current = a;
    return () => {
      a.pause();
      tingAudioRef.current = null;
    };
  }, []);

  const playCallTing = useCallback(() => {
    const a = tingAudioRef.current;
    if (!a) return;
    a.currentTime = 0;
    void a.play().catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchCalls = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterDate && /^\d{4}-\d{2}-\d{2}$/.test(filterDate)) {
        const [y, m, d] = filterDate.split('-').map(Number);
        const start = new Date(y, m - 1, d, 0, 0, 0, 0);
        const end = new Date(y, m - 1, d + 1, 0, 0, 0, 0);
        params.from = start.toISOString();
        params.to = end.toISOString();
      }
      if (debouncedSearch.trim()) params.q = debouncedSearch.trim();
      const res = await api.get('/calls', { params });
      setCalls(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterDate, debouncedSearch]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  useEffect(() => {
    if (!socket) return undefined;

    const onNewCall = (newCall) => {
      if (!callMatchesFilters(newCall, filterDate, debouncedSearch)) return;
      setCalls((prev) => {
        if (prev.some((c) => c._id === newCall._id)) return prev;
        if (newCall.status === 'completed') {
          queueMicrotask(() => playCallTing());
        }
        return [newCall, ...prev];
      });
    };

    socket.on('new_call', onNewCall);
    return () => {
      socket.off('new_call', onNewCall);
    };
  }, [socket, filterDate, debouncedSearch, playCallTing]);

  const grouped = useMemo(() => groupCallsByLocalDate(calls), [calls]);

  const groupKeysSig = useMemo(() => grouped.map((g) => g.key).join('|'), [grouped]);

  useEffect(() => {
    if (grouped.length === 0) {
      setExpandedKeys(new Set());
      return;
    }
    setExpandedKeys(new Set([grouped[0].key]));
  }, [groupKeysSig]);

  const toggleGroup = (key) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="flex min-h-0 flex-1 w-full flex-col gap-4">
      <div className="shrink-0 bg-[var(--bg-card)] p-4 sm:p-5 rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] flex items-center gap-3">
              Live Calls
              {socket && (
                <span className="flex h-3 w-3 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
                </span>
              )}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Real-time Call Monitoring Stream
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-3 sm:w-auto shrink-0">
            <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-secondary)] sm:shrink-0">
              <Calendar className="w-4 h-4 shrink-0" />
              <span className="sr-only">Filter by date</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent text-[var(--text-primary)] outline-none min-w-0 flex-1"
              />
              {filterDate && (
                <button
                  type="button"
                  onClick={() => setFilterDate('')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 shrink-0"
                >
                  Clear
                </button>
              )}
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm w-full sm:w-auto sm:min-w-[220px] sm:max-w-md">
              <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by number…"
                className="bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none w-full min-w-0"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
        {loading ? (
          <div className="px-6 py-12 text-center text-[var(--text-muted)]">Loading stream…</div>
        ) : calls.length === 0 ? (
          <div className="px-6 py-12 text-center text-[var(--text-muted)]">
            <div className="flex flex-col items-center justify-center">
              <Phone className="w-12 h-12 mb-3 opacity-20" />
              <p>
                {filterDate || debouncedSearch.trim()
                  ? 'No calls match your filters.'
                  : 'No calls recorded yet. Once a call is made, it will appear here instantly.'}
              </p>
            </div>
          </div>
        ) : (
          grouped.map((group) => {
            const open = expandedKeys.has(group.key);
            return (
              <div key={group.key} className="border-b border-[var(--border)] last:border-b-0">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={open}
                  className="sticky top-0 z-[1] w-full px-6 py-3 bg-[var(--bg-input)] border-y border-[var(--border)] text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2 text-left hover:bg-[var(--bg-card)] transition-colors -mb-px first:border-t-0"
                >
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--text-muted)] shrink-0 transition-transform ${open ? '' : '-rotate-90'}`}
                    aria-hidden
                  />
                  <Calendar className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  <span className="flex-1 min-w-0">
                    {group.label}
                    <span className="text-xs font-normal text-[var(--text-muted)]">
                      {' '}
                      ({group.items.length})
                    </span>
                  </span>
                </button>
                {open && <CallsDayTable calls={group.items} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
