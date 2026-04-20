import { useState, useEffect, useMemo } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import api from '../services/api';
import { Plus, Trash2, Users } from 'lucide-react';
import DataTable from '../components/DataTable';

function ListMembersTable({ list, onRemoveContact }) {
  const columns = useMemo(
    () => [
      {
        id: 'name',
        header: 'Name',
        accessorFn: (c) => `${c.first_name} ${c.last_name || ''}`.trim(),
        meta: { cellClassName: 'p-4 font-semibold text-slate-700' },
      },
      {
        accessorKey: 'phone_no',
        header: 'Phone',
        meta: { cellClassName: 'p-4 font-mono text-sm text-slate-500' },
      },
      {
        id: 'actions',
        header: '',
        meta: {
          headerClassName: 'sr-only w-0 p-0',
          cellClassName: 'p-4 text-right',
        },
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => onRemoveContact(list._id, row.original._id)}
            className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"
          >
            Remove
          </button>
        ),
      },
    ],
    [list._id, onRemoveContact]
  );

  const table = useReactTable({
    data: list.contacts,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row._id,
  });

  return (
    <table className="w-full text-left">
      <thead className="border-b border-purple-100">
        {table.getHeaderGroups().map((hg) => (
          <tr key={hg.id}>
            {hg.headers.map((h) => {
              const meta = h.column.columnDef.meta ?? {};
              return (
                <th
                  key={h.id}
                  className={`p-4 text-xs font-semibold uppercase tracking-wide text-purple-600/80 ${meta.headerClassName ?? ''}`}
                >
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              );
            })}
          </tr>
        ))}
      </thead>
      <tbody className="divide-y divide-purple-50">
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="hover:bg-purple-50/50">
            {row.getVisibleCells().map((cell) => {
              const meta = cell.column.columnDef.meta ?? {};
              return (
                <td key={cell.id} className={meta.cellClassName ?? 'p-4'}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function ListsPage() {
  const [lists, setLists] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    sync_to_exotel: true,
    selected_contacts: [],
  });

  const [activeListId, setActiveListId] = useState(null); // For viewing contacts inside a list

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [listRes, contactRes] = await Promise.all([api.get('/lists'), api.get('/contacts')]);
      setLists(listRes.data.data);
      setAllContacts(contactRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateList = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/lists', {
        name: formData.name,
        tag: formData.tag,
        sync_to_exotel: formData.sync_to_exotel,
      });
      const listId = res.data.data._id;

      if (formData.selected_contacts.length > 0) {
        await api.post(`/lists/${listId}/contacts`, { contact_ids: formData.selected_contacts });
      }

      setFormData({ name: '', tag: '', sync_to_exotel: true, selected_contacts: [] });
      setShowForm(false);
      fetchData();
    } catch (err) {
      alert('Error creating contact group');
    }
  };

  const handleDeleteList = async (id) => {
    if (!window.confirm('Permanently delete this group?')) return;
    try {
      await api.delete(`/lists/${id}`);
      fetchData();
    } catch (err) {
      alert('Error deleting group');
    }
  };

  const handleRemoveContact = async (listId, contactId) => {
    if (!window.confirm('Remove this contact from the group?')) return;
    try {
      await api.delete(`/lists/${listId}/contacts/${contactId}`);
      fetchData();
    } catch (err) {
      alert('Error removing contact');
    }
  };

  const handleContactToggle = (contactId) => {
    setFormData((prev) => {
      const isSelected = prev.selected_contacts.includes(contactId);
      return {
        ...prev,
        selected_contacts: isSelected
          ? prev.selected_contacts.filter((id) => id !== contactId)
          : [...prev.selected_contacts, contactId],
      };
    });
  };

  const columns = [
    { accessorKey: 'name', header: 'Group Name', meta: { cellClassName: 'font-semibold' } },
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
      id: 'contactsCount',
      header: 'Contacts',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() =>
            setActiveListId(activeListId === row.original._id ? null : row.original._id)
          }
          className="flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-600 rounded-lg font-medium hover:bg-purple-100 transition-colors"
        >
          <Users className="w-4 h-4" /> {row.original.contacts?.length || 0}
        </button>
      ),
    },
    {
      accessorKey: 'exotel_sid',
      header: 'VoiceNest SID',
      meta: { cellClassName: 'font-mono text-xs text-[var(--text-muted)]' },
      cell: ({ getValue }) => getValue() || '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => handleDeleteList(row.original._id)}
          className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Contact Groups</h2>
          <p className="text-[var(--text-secondary)]">Manage your lists for campaigns</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-5 h-5" /> {showForm ? 'Cancel' : 'Create Group'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateList}
          className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-xl animate-in slide-in-from-top-4 duration-300"
        >
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                Group Name *
              </label>
              <input
                required
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-purple-500 font-medium"
                placeholder="High Value Prospects"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                Group Tag
              </label>
              <input
                type="text"
                value={formData.tag}
                onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-purple-500 font-medium"
                placeholder="PROSPECT"
              />
            </div>
          </div>

          <div className="mb-6 bg-[var(--bg-input)] p-4 rounded-xl border border-[var(--border)]">
            <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-3">
              Add Initial Contacts ({formData.selected_contacts.length} selected)
            </label>
            <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
              {allContacts.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm">No contacts available.</p>
              ) : (
                allContacts.map((c) => (
                  <label
                    key={c._id}
                    className="flex items-center gap-3 p-3 bg-[var(--bg-card)] rounded-lg hover:border-purple-500 border border-[var(--border)] cursor-pointer transition-colors block w-full"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selected_contacts.includes(c._id)}
                      onChange={() => handleContactToggle(c._id)}
                      className="w-5 h-5 rounded border-[var(--border)] text-purple-600 focus:ring-purple-500/30 accent-purple-600 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-[var(--text-primary)]">
                        {c.first_name} {c.last_name || ''}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] font-mono">{c.phone_no}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-between items-center mt-6">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.sync_to_exotel}
                onChange={(e) => setFormData({ ...formData, sync_to_exotel: e.target.checked })}
                className="w-5 h-5 rounded border border-[var(--border)] text-purple-600 focus:ring-purple-500/30 accent-purple-600 cursor-pointer"
              />
              <span className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-purple-600 transition-colors">
                Sync this group to VoiceNest
              </span>
            </label>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md"
            >
              Save Group
            </button>
          </div>
        </form>
      )}

      {activeListId && (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 shadow-sm mb-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-purple-900 text-lg">Group Members</h3>
            <button
              onClick={() => setActiveListId(null)}
              className="text-sm font-semibold text-purple-600 hover:text-purple-800"
            >
              Close
            </button>
          </div>
          <div className="bg-white rounded-xl overflow-hidden border border-purple-100">
            {(() => {
              const list = lists.find((l) => l._id === activeListId);
              if (!list || !list.contacts || list.contacts.length === 0) {
                return (
                  <p className="p-6 text-center text-purple-400 font-medium">
                    No contacts in this group.
                  </p>
                );
              }
              return <ListMembersTable list={list} onRemoveContact={handleRemoveContact} />;
            })()}
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={lists}
        loading={loading}
        emptyMessage="No contact groups found. Create one to organize campaigns."
      />
    </div>
  );
}
