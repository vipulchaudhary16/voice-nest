import { useState, useEffect } from 'react';
import api from '../services/api';
import { UserPlus, UserCheck } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', formData);
      setFormData({ name: '', email: '', password: '' });
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating user');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">User Management</h2>
          <p className="text-[var(--text-secondary)]">Manage team members for your tenant</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors">
          <UserPlus className="w-5 h-5" /> Add User
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border)] gap-4 items-end shadow-lg animate-in slide-in-from-top-4 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-blue-500" placeholder="Agent Smith" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Email Address</label>
              <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-blue-500" placeholder="smith@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">Password</label>
              <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-blue-500" placeholder="••••••••" />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
             <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
              Create Account
             </button>
          </div>
        </form>
      )}

      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-[var(--bg-input)]">
            <tr className="text-[var(--text-secondary)] text-sm uppercase tracking-wider">
              <th className="px-6 py-4 font-medium">User</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium text-right">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {loading ? (
              <tr><td colSpan="3" className="px-6 py-8 text-center text-[var(--text-muted)]">Loading team...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="3" className="px-6 py-8 text-center text-[var(--text-muted)]">No users found.</td></tr>
            ) : (
              users.map(u => (
                <tr key={u._id} className="hover:bg-[var(--bg-input)] transition-colors">
                  <td className="px-6 py-4 font-medium text-[var(--text-primary)] flex items-center gap-3">
                     <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${u.role === 'super_admin' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                       {u.name.charAt(0).toUpperCase()}
                     </span>
                     {u.name}
                  </td>
                  <td className="px-6 py-4 text-[var(--text-secondary)]">{u.email}</td>
                  <td className="px-6 py-4 text-right">
                    {u.role === 'super_admin' ? (
                       <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-500/10 text-orange-600 border border-orange-500/20 rounded-full text-xs font-semibold uppercase tracking-wider">
                         Super Admin
                       </span>
                    ) : (
                       <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/10 text-blue-600 border border-blue-500/20 rounded-full text-xs font-semibold uppercase tracking-wider">
                         <UserCheck className="w-3.5 h-3.5" /> Agent
                       </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
