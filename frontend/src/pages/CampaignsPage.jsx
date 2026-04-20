import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import { Plus, Trash2, Megaphone, Play, Pause, CheckCircle2, Clock, Eye } from 'lucide-react';
import DataTable from '../components/DataTable';

export default function CampaignsPage() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [lists, setLists] = useState([]);
  const [exophones, setExophones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    lists: [],
    caller_id: '',
    campaign_type: 'static',
    flow_type: 'ivr',
    read_via_text: '',
    url: '',
    sync_to_exotel: true,
    schedule: {
      send_at: '',
      end_at: '',
    },
    retries: {
      number_of_retries: 0,
      interval_mins: 15,
      mechanism: 'Linear',
      on_status: ['busy', 'no-answer', 'failed'],
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [campRes, listRes, exoRes] = await Promise.all([
        api.get('/campaigns'),
        api.get('/lists'),
        api.get('/exophones'),
      ]);
      setCampaigns(campRes.data.data);
      setLists(listRes.data.data);
      setExophones(exoRes.data.data);
    } catch {
      toast.error('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.caller_id) {
      toast.error('Please select an ExoPhone (Caller ID)');
      return;
    }
    if (formData.lists.length === 0) {
      toast.error('Please select at least one Contact Group (List)');
      return;
    }

    try {
      await api.post('/campaigns', formData);
      setFormData({
        name: '',
        lists: [],
        caller_id: '',
        campaign_type: 'static',
        flow_type: 'ivr',
        read_via_text: '',
        url: '',
        sync_to_exotel: true,
        schedule: { send_at: '', end_at: '' },
        retries: {
          number_of_retries: 0,
          interval_mins: 15,
          mechanism: 'Linear',
          on_status: ['busy', 'no-answer', 'failed'],
        },
      });
      setShowForm(false);
      fetchData();
      toast.success('Campaign created successfully');
    } catch {}
  };

  const handleAction = async (id, action) => {
    try {
      await api.put(`/campaigns/${id}`, { action });
      fetchData();
      toast.success(`Campaign ${action} action completed`);
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      fetchData();
      toast.success('Campaign deleted');
    } catch {}
  };

  const handleListToggle = (listId) => {
    setFormData((prev) => {
      const isSelected = prev.lists.includes(listId);
      if (prev.campaign_type === 'dynamic' && !isSelected) return { ...prev, lists: [listId] }; // only 1 for dynamic
      return {
        ...prev,
        lists: isSelected ? prev.lists.filter((id) => id !== listId) : [...prev.lists, listId],
      };
    });
  };

  const statusColors = {
    Created: 'bg-blue-100 text-blue-700',
    InProgress: 'bg-amber-100 text-amber-700',
    paused: 'bg-slate-100 text-slate-700',
    Completed: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
  };

  const columns = [
    {
      accessorKey: 'name',
      header: 'Campaign Name',
      meta: { cellClassName: 'font-bold text-[var(--text-primary)]' },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tighter ${
            statusColors[row.original.status] || 'bg-gray-100'
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'campaign_type',
      header: 'Type',
      cell: ({ getValue }) => (
        <span className="text-xs font-medium text-[var(--text-secondary)] uppercase">
          {getValue()}
        </span>
      ),
    },
    {
      id: 'caller',
      header: 'Caller ID',
      accessorFn: (row) => row.caller_id?.phone_no,
      cell: ({ row }) => (
        <span className="text-xs font-mono">{row.original.caller_id?.phone_no || '-'}</span>
      ),
    },
    {
      id: 'lists',
      header: 'Groups',
      accessorFn: (row) => row.lists?.length ?? 0,
      cell: ({ row }) => (
        <span className="bg-purple-50 text-purple-600 px-2 py-1 rounded-md text-xs font-bold">
          {row.original.lists?.length || 0} Lists
        </span>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      meta: {
        headerClassName: 'text-right',
        cellClassName: 'text-right flex items-center justify-end gap-2',
      },
      cell: ({ row }) => {
        const r = row.original;
        return (
          <>
            <button
              type="button"
              onClick={() => navigate(`/dashboard/campaigns/${r._id}/call-details`)}
              className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
              title="View Call Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            {r.status === 'Created' && (
              <button
                type="button"
                onClick={() => handleAction(r._id, 'resume')}
                className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                title="Start"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            )}
            {r.status === 'InProgress' && (
              <button
                type="button"
                onClick={() => handleAction(r._id, 'pause')}
                className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                title="Pause"
              >
                <Pause className="w-4 h-4 fill-current" />
              </button>
            )}
            {r.status === 'paused' && (
              <button
                type="button"
                onClick={() => handleAction(r._id, 'resume')}
                className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                title="Resume"
              >
                <Play className="w-4 h-4 fill-current" />
              </button>
            )}
            <button
              type="button"
              onClick={() => handleDelete(r._id)}
              className="p-2 text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-block"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        );
      },
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 w-full flex-col gap-4">
      <div className="shrink-0 flex justify-between items-center bg-[var(--bg-card)] p-4 sm:p-5 rounded-2xl border border-[var(--border)] shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Campaigns</h2>
          <p className="text-[var(--text-secondary)]">
            Create and manage your VoiceNest call campaigns
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" /> {showForm ? 'Cancel' : 'Create Campaign'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border)] shadow-2xl animate-in slide-in-from-top-4 space-y-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-sm font-bold text-indigo-500 uppercase tracking-widest border-b border-[var(--border)] pb-2">
                Basic Information
              </h4>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                  Campaign Name *
                </label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 font-medium"
                  placeholder="Monthly Product Update"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                  Caller ID (ExoPhone) *
                </label>
                <select
                  required
                  value={formData.caller_id}
                  onChange={(e) => setFormData({ ...formData, caller_id: e.target.value })}
                  className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="">Select an ExoPhone</option>
                  {exophones.map((exo) => (
                    <option key={exo._id} value={exo._id}>
                      {exo.name} ({exo.phone_no})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    Campaign Type
                  </label>
                  <select
                    value={formData.campaign_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        campaign_type: e.target.value,
                        lists:
                          e.target.value === 'dynamic'
                            ? formData.lists.slice(0, 1)
                            : formData.lists,
                      })
                    }
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="static">Static</option>
                    <option value="dynamic">Dynamic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                    Flow Type
                  </label>
                  <select
                    value={formData.flow_type}
                    onChange={(e) => setFormData({ ...formData, flow_type: e.target.value })}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="ivr">IVR Applet</option>
                    <option value="greeting">Greeting Text</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-sm font-bold text-indigo-500 uppercase tracking-widest border-b border-[var(--border)] pb-2">
                Target Groups
              </h4>
              <div>
                <label className="block text-sm font-semibold text-[var(--text-secondary)] mb-2">
                  Select Contact Groups *{' '}
                  {formData.campaign_type === 'dynamic' && '(Dynamic allows only 1)'}
                </label>
                <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                  {lists.length === 0 ? (
                    <p className="text-[var(--text-muted)] text-sm">
                      No groups available. Create one first!
                    </p>
                  ) : (
                    lists.map((l) => (
                      <label
                        key={l._id}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${formData.lists.includes(l._id) ? 'border-indigo-500 bg-indigo-50/50' : 'border-[var(--border)] hover:bg-[var(--bg-input)]'}`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={formData.lists.includes(l._id)}
                            onChange={() => handleListToggle(l._id)}
                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20 accent-indigo-600"
                          />
                          <div>
                            <p className="font-bold text-sm text-[var(--text-primary)]">{l.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-tighter">
                              {l.tag || 'No Tag'}
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold bg-white border border-[var(--border)] px-2 py-0.5 rounded text-indigo-500">
                          {l.contacts?.length || 0}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-indigo-500 uppercase tracking-widest border-b border-[var(--border)] pb-2 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Schedule
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Start Time (UTC)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.schedule.send_at}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        schedule: { ...formData.schedule, send_at: e.target.value },
                      })
                    }
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    End Time (UTC)
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.schedule.end_at}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        schedule: { ...formData.schedule, end_at: e.target.value },
                      })
                    }
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-indigo-500 uppercase tracking-widest border-b border-[var(--border)] pb-2 flex items-center gap-2">
                Retry Logic
              </h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Attempts (0-3)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="3"
                    value={formData.retries.number_of_retries}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        retries: {
                          ...formData.retries,
                          number_of_retries: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                    Interval (Mins)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.retries.interval_mins}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        retries: { ...formData.retries, interval_mins: parseInt(e.target.value) },
                      })
                    }
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-[var(--bg-input)] rounded-2xl border border-[var(--border)]">
            {formData.flow_type === 'greeting' ? (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-indigo-600 uppercase tracking-wider">
                  Greeting Text to Read
                </label>
                <textarea
                  value={formData.read_via_text}
                  onChange={(e) => setFormData({ ...formData, read_via_text: e.target.value })}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-indigo-500 min-h-[100px]"
                  placeholder="Hi @@first_name, thank you for your interest in our service..."
                ></textarea>
                <p className="text-[10px] text-[var(--text-muted)]">
                  Use <b>@@fieldname</b> for dynamic tags (e.g. @@first_name, @@email)
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-indigo-600 uppercase tracking-wider">
                  Flow ID (Applet ID)
                </label>
                <input
                  type="text"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-3 text-[var(--text-primary)] focus:outline-none focus:border-indigo-500"
                  placeholder="e.g. 528696"
                />
                <p className="text-[10px] text-[var(--text-muted)]">
                  You can get the App ID from your VoiceNest Flow Dashboard
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${formData.sync_to_exotel ? 'bg-indigo-500 border-indigo-500' : 'border-[var(--border)] bg-white group-hover:border-indigo-300'}`}
              >
                {formData.sync_to_exotel && <CheckCircle2 className="w-4 h-4 text-white" />}
                <input
                  type="checkbox"
                  className="hidden"
                  checked={formData.sync_to_exotel}
                  onChange={(e) => setFormData({ ...formData, sync_to_exotel: e.target.checked })}
                />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-[var(--text-primary)] block">
                  Sync to VoiceNest Cloud
                </span>
                <span className="text-[10px] text-[var(--text-muted)] block">
                  Launches campaign directly on VoiceNest
                </span>
              </div>
            </label>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/30"
            >
              Launch Campaign
            </button>
          </div>
        </form>
      )}

      <div className="min-h-0 flex-1 overflow-auto scroll-smooth">
        <DataTable
          columns={columns}
          data={campaigns}
          loading={loading}
          emptyMessage="No campaigns available yet. Launch one to start reaching out!"
        />
      </div>
    </div>
  );
}
