import { useState, useEffect } from "react";
import api from "../services/api";
import { Plus, Trash2, Phone } from "lucide-react";
import DataTable from "../components/DataTable";

export default function ExophonesPage() {
  const [exophones, setExophones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ phone_no: '', name: '' });

  useEffect(() => {
    fetchExophones();
  }, []);

  const fetchExophones = async () => {
    try {
      const res = await api.get('/exophones');
      setExophones(res.data.data);
    } catch {
      // Failed
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone_no.startsWith('+')) {
      alert('Phone number must include country code starting with +');
      return;
    }
    try {
      await api.post('/exophones', formData);
      setFormData({ phone_no: '', name: '' });
      setShowForm(false);
      fetchExophones();
    } catch {
      alert("Error adding ExoPhone");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this ExoPhone?")) return;
    try {
      await api.delete(`/exophones/${id}`);
      fetchExophones();
    } catch {
      alert("Error deleting ExoPhone");
    }
  };

  const columns = [
    { accessorKey: 'name', header: 'Name', meta: { cellClassName: 'font-semibold' } },
    {
      accessorKey: 'phone_no',
      header: 'Phone Number',
      meta: { cellClassName: 'font-mono text-indigo-600 font-medium' },
    },
    {
      id: 'actions',
      header: 'Actions',
      meta: { headerClassName: 'text-right', cellClassName: 'text-right' },
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => handleDelete(row.original._id)}
          className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Voice Numbers</h2>
          <p className="text-[var(--text-secondary)]">Manage your verified caller IDs for VoiceNest</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
          <Plus className="w-5 h-5" /> {showForm ? 'Cancel' : 'Add Voice Number'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-xl animate-in slide-in-from-top-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Display Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-indigo-500" placeholder="Main Office" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Phone Number (+E.164)</label>
              <input required type="text" value={formData.phone_no} onChange={e => setFormData({...formData, phone_no: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-indigo-500" placeholder="+9180XXXXXXXX" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold transition-all shadow-md">
              Save ExoPhone
            </button>
          </div>
        </form>
      )}

      <DataTable columns={columns} data={exophones} loading={loading} emptyMessage="No voice numbers found. Add your verified caller IDs to start campaigns." />
    </div>
  );
}
