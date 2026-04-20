import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import api from '../services/api';
import {
  Plus,
  Trash2,
  ListPlus,
  Download,
  Upload,
  FileDown,
  MoreVertical,
  Layers,
  Search,
  Tag,
} from 'lucide-react';
import DataTable from '../components/DataTable';
import DropdownMenu from '../components/DropdownMenu';

const CONTACT_IMPORT_TYPE = 'contacts';

function csvEscapeCell(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadSelectedNumbersCsv(contacts, rowSelection) {
  const selected = contacts.filter((c) => rowSelection[String(c._id)]);
  if (selected.length === 0) return false;
  const lines = ['number', ...selected.map((c) => csvEscapeCell(c.phone_no))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'contacts-numbers.csv';
  a.click();
  window.URL.revokeObjectURL(url);
  return true;
}

async function downloadContactTemplate() {
  const res = await api.get('/import/template', {
    params: { type: CONTACT_IMPORT_TYPE },
    responseType: 'blob',
  });
  const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'contacts-import-template.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_no: '',
    tag: '',
    sync_to_exotel: true,
  });

  const [lists, setLists] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(null); // stores contact id to assign
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [rowSelection, setRowSelection] = useState({});
  const [contactSearch, setContactSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [tagOptions, setTagOptions] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const q = contactSearch.trim();
    if (q === '') {
      setDebouncedSearch('');
      return undefined;
    }
    const t = setTimeout(() => setDebouncedSearch(q), 400);
    return () => clearTimeout(t);
  }, [contactSearch]);

  useEffect(() => {
    setRowSelection({});
  }, [debouncedSearch, tagFilter]);

  const selectedCount = useMemo(
    () => Object.values(rowSelection).filter(Boolean).length,
    [rowSelection]
  );

  const hasActiveFilters = Boolean(debouncedSearch || tagFilter);

  useEffect(() => {
    fetchLists();
  }, []);

  const fetchLists = async () => {
    try {
      const res = await api.get('/lists');
      setLists(res.data.data);
    } catch (err) {}
  };

  const fetchTagOptions = useCallback(async () => {
    try {
      const res = await api.get('/contacts/tags');
      setTagOptions(res.data.data || []);
    } catch {
      setTagOptions([]);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (debouncedSearch) params.q = debouncedSearch;
      if (tagFilter) params.tag = tagFilter;
      const res = await api.get('/contacts', { params });
      setContacts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, tagFilter]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    fetchTagOptions();
  }, [fetchTagOptions]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.phone_no.startsWith('+')) {
      alert('Important: Phone number must include a country code starting with + (e.g., +91)');
      return;
    }

    try {
      await api.post('/contacts', formData);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone_no: '',
        tag: '',
        sync_to_exotel: true,
      });
      setShowForm(false);
      await Promise.all([fetchContacts(), fetchTagOptions()]);
    } catch (err) {
      alert('Error creating contact');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete contact?')) return;
    try {
      await api.delete(`/contacts/${id}`);
      await Promise.all([fetchContacts(), fetchTagOptions()]);
    } catch (err) {
      alert('Error deleting contact');
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadContactTemplate();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Could not download template');
    }
  };

  const handleExportSelectedCsv = () => {
    const ok = downloadSelectedNumbersCsv(contacts, rowSelection);
    if (!ok) alert('Select at least one contact to export.');
  };

  const handleDeleteSelected = async () => {
    const ids = Object.keys(rowSelection).filter((id) => rowSelection[id]);
    if (ids.length === 0) {
      alert('Select at least one contact to delete.');
      return;
    }
    if (!window.confirm(`Permanently delete ${ids.length} contact(s)?`)) return;
    try {
      await Promise.all(ids.map((id) => api.delete(`/contacts/${id}`)));
      setRowSelection({});
      await Promise.all([fetchContacts(), fetchTagOptions()]);
    } catch {
      alert('Error deleting contacts');
    }
  };

  const handlePickImportFile = () => fileInputRef.current?.click();

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setImportBusy(true);
    setImportResult(null);
    try {
      const csvText = await file.text();
      const res = await api.post('/import/run', {
        type: CONTACT_IMPORT_TYPE,
        csvText,
      });
      setImportResult(res.data.data);
      await Promise.all([fetchContacts(), fetchTagOptions()]);
    } catch (err) {
      alert(
        err.response?.data?.message || err.response?.data?.error || err.message || 'Import failed'
      );
    } finally {
      setImportBusy(false);
    }
  };

  const handleAssignToList = async (contactId, listId) => {
    try {
      await api.post(`/lists/${listId}/contacts`, { contact_ids: [contactId] });
      alert('Successfully added contact to list!');
      setShowAssignModal(null);
    } catch (err) {
      alert('Failed to assign to list');
    }
  };

  const columns = [
    {
      id: 'name',
      header: 'Name',
      accessorFn: (row) => `${row.first_name} ${row.last_name || ''}`.trim(),
      meta: { cellClassName: 'font-semibold' },
    },
    { accessorKey: 'email', header: 'Email' },
    {
      accessorKey: 'phone_no',
      header: 'Phone Number',
      meta: { cellClassName: 'font-mono text-sm' },
    },
    {
      accessorKey: 'tag',
      header: 'Tag',
      cell: ({ row }) =>
        row.original.tag ? (
          <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-bold uppercase">
            {row.original.tag}
          </span>
        ) : (
          '-'
        ),
    },
    {
      id: 'actions',
      header: () => <span className="sr-only">Row actions</span>,
      meta: {
        headerClassName: 'w-14 text-right',
        cellClassName: 'text-right',
      },
      cell: ({ row }) => (
        <DropdownMenu
          variant="icon"
          align="right"
          aria-label="Contact actions"
          items={[
            {
              key: 'list',
              label: 'Add to group',
              icon: ListPlus,
              onClick: () => setShowAssignModal(row.original._id),
            },
            {
              key: 'del',
              label: 'Delete contact',
              icon: Trash2,
              danger: true,
              onClick: () => handleDelete(row.original._id),
            },
          ]}
        >
          <MoreVertical className="h-5 w-5" />
        </DropdownMenu>
      ),
    },
  ];

  const importMenuItems = [
    {
      key: 'template',
      label: 'Download import template',
      icon: Download,
      onClick: () => {
        void handleDownloadTemplate();
      },
    },
    {
      key: 'import',
      label: importBusy ? 'Importing…' : 'Import from CSV…',
      icon: Upload,
      disabled: importBusy,
      onClick: handlePickImportFile,
    },
  ];

  const bulkMenuItems = [
    {
      key: 'export',
      label: selectedCount > 0 ? `Export selected (${selectedCount})` : 'Export selected',
      icon: FileDown,
      disabled: selectedCount === 0,
      onClick: handleExportSelectedCsv,
    },
    {
      key: 'bulk-del',
      label: selectedCount > 0 ? `Delete selected (${selectedCount})` : 'Delete selected',
      icon: Trash2,
      disabled: selectedCount === 0,
      danger: true,
      onClick: () => {
        void handleDeleteSelected();
      },
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 w-full flex-col gap-4">
      <div className="shrink-0 bg-[var(--bg-card)] p-4 sm:p-5 rounded-2xl border border-[var(--border)] shadow-sm">
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Contacts</h2>
            <p className="text-sm text-[var(--text-secondary)]">Manage your lead directory</p>
          </div>
          <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleImportFile}
            />
            <DropdownMenu
              label="Import"
              Icon={Upload}
              aria-label="Import contacts from CSV"
              items={importMenuItems}
            />
            <DropdownMenu
              label="Bulk"
              Icon={Layers}
              aria-label="Bulk actions on selected contacts"
              items={bulkMenuItems}
            />
            <button
              type="button"
              onClick={() => setShowForm(!showForm)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 transition-colors"
            >
              <Plus className="w-5 h-5 shrink-0" /> Add contact
            </button>
          </div>
        </div>
        <div className="mt-3 flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-3">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm sm:min-w-[200px] sm:max-w-xl">
            <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
            <span className="sr-only">Search contacts</span>
            <input
              type="search"
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Search name, email, phone…"
              className="min-w-0 flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none"
            />
          </label>
          <label className="flex shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-input)] px-3 py-2 text-sm sm:w-auto">
            <Tag className="h-4 w-4 shrink-0 text-[var(--text-muted)]" aria-hidden />
            <span className="sr-only">Filter by tag</span>
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="min-w-[8rem] max-w-[14rem] cursor-pointer bg-transparent text-[var(--text-primary)] outline-none"
            >
              <option value="">All tags</option>
              {tagOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-4">
        {importResult && (
          <div className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)] text-sm space-y-2 shrink-0">
            <p className="font-semibold text-[var(--text-primary)]">Import finished</p>
            <p className="text-[var(--text-secondary)]">
              Rows in file: {importResult.totalRows} · Valid: {importResult.validated} · After
              merge: {importResult.mergedCount} ·{' '}
              <span className="text-green-600 font-medium">New: {importResult.inserted}</span> ·{' '}
              <span className="text-amber-600 font-medium">Updated: {importResult.updated}</span>
              {importResult.failedCount > 0 && (
                <span className="text-red-500 font-medium">
                  {' '}
                  · Failed: {importResult.failedCount}
                </span>
              )}
            </p>
            {importResult.failed?.length > 0 && (
              <ul className="max-h-36 overflow-y-auto text-xs font-mono text-red-500/90 border border-[var(--border)] rounded-lg p-2 bg-[var(--bg-input)]">
                {importResult.failed.map((f, i) => (
                  <li key={`${f.row}-${i}`}>
                    Row {f.row}: {f.message}
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setImportResult(null)}
              className="text-xs text-indigo-500 hover:text-indigo-400 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="shrink-0 bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-lg animate-in slide-in-from-top-4 duration-300"
          >
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  First Name
                </label>
                <input
                  required
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                  placeholder="Jane"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                  placeholder="jane@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Phone Number
                </label>
                <input
                  required
                  type="text"
                  value={formData.phone_no}
                  onChange={(e) => setFormData({ ...formData, phone_no: e.target.value })}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                  placeholder="+919876543210"
                />
                <p className="text-xs text-orange-500 mt-1.5 font-medium flex items-center gap-1">
                  ⚠️ Must include country code (e.g. +91)
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                  Tag
                </label>
                <input
                  type="text"
                  value={formData.tag}
                  onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                  placeholder="VIP, Prospect, etc."
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  checked={formData.sync_to_exotel}
                  onChange={(e) => setFormData({ ...formData, sync_to_exotel: e.target.checked })}
                  className="w-5 h-5 rounded border border-[var(--border)] text-indigo-600 focus:ring-indigo-500/30 accent-indigo-600 cursor-pointer"
                  id="syncExotel"
                />
                <label
                  htmlFor="syncExotel"
                  className="text-sm font-medium text-[var(--text-primary)] cursor-pointer select-none"
                >
                  Sync to VoiceNest Addressbook
                </label>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Save Contact
              </button>
            </div>
          </form>
        )}

        <div className="min-h-0 flex-1 overflow-auto scroll-smooth">
          <DataTable
            columns={columns}
            data={contacts}
            loading={loading}
            emptyMessage={
              !hasActiveFilters
                ? 'No contacts found. Add one above.'
                : 'No contacts match your search or tag filter.'
            }
            enableRowSelection
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
        </div>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full animate-in zoom-in-95">
            <h3 className="font-bold text-xl text-slate-800 mb-4">Add to Group</h3>
            <p className="text-slate-500 text-sm mb-6">Select a list to assign this contact to.</p>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
              {lists.length === 0 ? (
                <p className="text-slate-400 text-sm">No lists created yet.</p>
              ) : (
                lists.map((l) => (
                  <button
                    key={l._id}
                    onClick={() => handleAssignToList(showAssignModal, l._id)}
                    className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors font-medium text-slate-700"
                  >
                    {l.name}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setShowAssignModal(null)}
              className="w-full py-2.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
