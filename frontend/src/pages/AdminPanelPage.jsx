import { useState, useEffect, useMemo } from 'react';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
import { NavLink, Navigate, useMatch } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Building2,
  Users,
  LogOut,
  Plus,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const ADMIN_SIDEBAR_STORAGE_KEY = 'voicenest.admin.sidebarCollapsed';

function AdminUsersTable({ users, loading }) {
  const columns = useMemo(
    () => [
      {
        id: 'userInfo',
        header: 'User Info',
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${
                  u.role === 'super_admin'
                    ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors'
                }`}
              >
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-slate-800">{u.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm font-medium text-slate-500">{u.email}</p>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'super_admin'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {u.role === 'super_admin' ? 'Admin' : 'Agent'}
                  </span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        id: 'workspace',
        header: 'Assigned Workspace',
        cell: ({ row }) => {
          const u = row.original;
          return u.role === 'super_admin' ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-wider border border-orange-100">
              <ShieldCheck className="w-3.5 h-3.5" /> Platform Wide
            </span>
          ) : (
            <span className="font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              {u.tenant_id?.name || 'Unassigned Workspace'}
            </span>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: loading ? [] : users,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (r) => r._id,
  });

  return (
    <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <table className="w-full text-left">
        <thead className="bg-slate-50/80 border-b border-slate-100">
          {table.getHeaderGroups().map((hg) => (
            <tr
              key={hg.id}
              className="text-slate-500 text-xs uppercase tracking-widest font-semibold"
            >
              {hg.headers.map((h) => (
                <th key={h.id} className="px-8 py-5">
                  {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td
                colSpan={2}
                className="px-8 py-12 text-center text-slate-400 font-medium animate-pulse"
              >
                Loading team list...
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-8 py-5">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminPanelPage() {
  const { user, logout } = useAuth();
  const sectionMatch = useMatch({ path: '/admin/:section', end: true });
  const section = sectionMatch?.params?.section;
  const activeTab = section === 'users' ? 'users' : 'tenants';
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showTenantForm, setShowTenantForm] = useState(false);
  const [tenantData, setTenantData] = useState({
    name: '',
    city: '',
    api_key: '',
    api_token: '',
    account_sid: '',
    subdomain: '',
  });
  const [editingTenantId, setEditingTenantId] = useState(null);

  const [showUserForm, setShowUserForm] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    tenant_id: '',
    role: 'user',
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(ADMIN_SIDEBAR_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_SIDEBAR_STORAGE_KEY, sidebarCollapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'tenants') {
        const res = await api.get('/tenants');
        setTenants(res.data.data);
      } else {
        const res = await api.get('/users');
        setUsers(res.data.data);
        if (tenants.length === 0) {
          const tRes = await api.get('/tenants');
          setTenants(tRes.data.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateTenant = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: tenantData.name,
        city: tenantData.city,
        ivr_data: {
          api_key: tenantData.api_key,
          api_token: tenantData.api_token,
          account_sid: tenantData.account_sid,
          subdomain: tenantData.subdomain,
        },
      };

      if (editingTenantId) {
        await api.put(`/tenants/${editingTenantId}`, payload);
      } else {
        await api.post('/tenants', payload);
      }

      setTenantData({
        name: '',
        city: '',
        api_key: '',
        api_token: '',
        account_sid: '',
        subdomain: '',
      });
      setShowTenantForm(false);
      setEditingTenantId(null);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing tenant');
    }
  };

  const handleEditTenant = (t) => {
    setTenantData({
      name: t.name,
      city: t.city,
      api_key: t.ivr_data?.api_key || '',
      api_token: t.ivr_data?.api_token || '',
      account_sid: t.ivr_data?.account_sid || '',
      subdomain: t.ivr_data?.subdomain || 'api.exotel.com',
    });
    setEditingTenantId(t._id);
    setShowTenantForm(true);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/users', userData);
      setUserData({ name: '', email: '', password: '', tenant_id: '', role: 'user' });
      setShowUserForm(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating user');
    }
  };

  if (section && section !== 'tenants' && section !== 'users') {
    return <Navigate to="/admin/tenants" replace />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      {/* Sidebar */}
      <div
        className={`bg-white/60 backdrop-blur-xl border-r border-[var(--border)] flex flex-col hidden md:flex shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 shrink-0 transition-[width] duration-200 ease-out overflow-hidden ${
          sidebarCollapsed ? 'w-[4.25rem]' : 'w-64'
        }`}
      >
        <div className={`border-b border-white/50 ${sidebarCollapsed ? 'p-3' : 'p-4'}`}>
          <div
            className={`flex items-center gap-3 ${sidebarCollapsed ? 'flex-col-reverse gap-2' : 'justify-between'}`}
          >
            <div
              className={`flex items-center gap-3 min-w-0 ${sidebarCollapsed ? 'flex-col' : 'flex-1'}`}
            >
              <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              {!sidebarCollapsed && (
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600 tracking-tight truncate">
                  VoiceNest Admin
                </h1>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="shrink-0 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-black/5 transition-colors"
              aria-expanded={!sidebarCollapsed}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <ChevronLeft className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <nav className={`flex-1 space-y-2 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          <NavLink
            to="/admin/tenants"
            end
            title={sidebarCollapsed ? 'Workspaces' : undefined}
            className={({ isActive }) =>
              `w-full flex items-center rounded-xl transition-all duration-300 font-medium ${
                sidebarCollapsed ? 'justify-center px-2 py-3.5' : 'gap-3 px-4 py-3.5'
              } ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500/10 to-red-500/5 text-orange-600 shadow-sm border border-orange-500/10'
                  : 'text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Building2 className={`w-5 h-5 shrink-0 ${isActive ? 'text-orange-500' : ''}`} />
                <span className={sidebarCollapsed ? 'sr-only' : ''}>Workspaces</span>
              </>
            )}
          </NavLink>
          <NavLink
            to="/admin/users"
            title={sidebarCollapsed ? 'Global Users' : undefined}
            className={({ isActive }) =>
              `w-full flex items-center rounded-xl transition-all duration-300 font-medium ${
                sidebarCollapsed ? 'justify-center px-2 py-3.5' : 'gap-3 px-4 py-3.5'
              } ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500/10 to-red-500/5 text-orange-600 shadow-sm border border-orange-500/10'
                  : 'text-[var(--text-secondary)] hover:bg-black/5 hover:text-[var(--text-primary)]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Users className={`w-5 h-5 shrink-0 ${isActive ? 'text-orange-500' : ''}`} />
                <span className={sidebarCollapsed ? 'sr-only' : ''}>Global Users</span>
              </>
            )}
          </NavLink>
        </nav>

        <div className={`border-t border-white/50 bg-white/40 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          <div
            className={`flex items-center ${sidebarCollapsed ? 'flex-col gap-2' : 'justify-between gap-2'}`}
          >
            {!sidebarCollapsed && (
              <div className="text-sm truncate min-w-0">
                <p className="font-medium text-[var(--text-primary)] truncate">{user?.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="p-2 text-[var(--text-muted)] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
              title="Log out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-10 scroll-smooth bg-slate-50/50">
        {activeTab === 'tenants' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">
                  Workspace Tenants
                </h2>
                <p className="text-slate-500 mt-1 font-medium">
                  Manage and monitor VoiceNest workspaces
                </p>
              </div>
              <button
                onClick={() => {
                  setShowTenantForm(!showTenantForm);
                  if (!showTenantForm) {
                    setTenantData({
                      name: '',
                      city: '',
                      api_key: '',
                      api_token: '',
                      account_sid: '',
                      subdomain: '',
                    });
                    setEditingTenantId(null);
                  }
                }}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" /> {showTenantForm ? 'Cancel Form' : 'Add Tenant'}
              </button>
            </div>

            {showTenantForm && (
              <form
                onSubmit={handleCreateOrUpdateTenant}
                className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 animate-in slide-in-from-top-4 duration-300"
              >
                <h3 className="text-xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
                  {editingTenantId ? 'Edit Workspace Configuration' : 'Create New Workspace'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">
                      Tenant Name
                    </label>
                    <input
                      required
                      type="text"
                      value={tenantData.name}
                      onChange={(e) => setTenantData({ ...tenantData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                      placeholder="Acme Corporation"
                    />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-semibold text-slate-600 mb-2">
                      City Location
                    </label>
                    <input
                      required
                      type="text"
                      value={tenantData.city}
                      onChange={(e) => setTenantData({ ...tenantData, city: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </div>

                <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100 mb-6">
                  <h4 className="text-sm font-bold text-orange-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> VoiceNest Integration (IVR Data)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">
                        Account SID
                      </label>
                      <input
                        type="text"
                        value={tenantData.account_sid}
                        onChange={(e) =>
                          setTenantData({ ...tenantData, account_sid: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                        placeholder="your_sid"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">
                        Subdomain (Region)
                      </label>
                      <input
                        type="text"
                        value={tenantData.subdomain}
                        onChange={(e) =>
                          setTenantData({ ...tenantData, subdomain: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                        placeholder="api.exotel.com"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-600 mb-2">
                        API Key
                      </label>
                      <input
                        type="text"
                        value={tenantData.api_key}
                        onChange={(e) => setTenantData({ ...tenantData, api_key: e.target.value })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                        placeholder="your_api_key"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-slate-600 mb-2">
                        API Token
                      </label>
                      <input
                        type="text"
                        value={tenantData.api_token}
                        onChange={(e) =>
                          setTenantData({ ...tenantData, api_token: e.target.value })
                        }
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                        placeholder="your_api_token"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    {editingTenantId ? 'Save Workspace Changes' : 'Create Workspace'}
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {loading ? (
                <p className="text-slate-400 font-medium animate-pulse">Loading workspaces...</p>
              ) : (
                tenants.map((t) => (
                  <div
                    key={t._id}
                    className="bg-white rounded-3xl border border-slate-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 relative"
                  >
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => handleEditTenant(t)}
                        className="text-orange-500 hover:text-orange-600 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors border border-orange-100"
                      >
                        Configure
                      </button>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center mb-6 text-orange-500 shadow-sm">
                      <Building2 className="w-7 h-7" />
                    </div>
                    <h3 className="font-bold text-xl text-slate-800 mb-1">{t.name}</h3>
                    <p className="text-sm font-medium text-slate-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>{' '}
                      {t.city || 'Global'}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center bg-white/80 backdrop-blur-xl p-8 rounded-3xl border border-white/40 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Global Users</h2>
                <p className="text-slate-500 mt-1 font-medium">
                  Manage accounts globally across all tenants
                </p>
              </div>
              <button
                onClick={() => setShowUserForm(!showUserForm)}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" /> Add User
              </button>
            </div>

            {showUserForm && (
              <form
                onSubmit={handleCreateUser}
                className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6 animate-in slide-in-from-top-4 duration-300"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">
                      Full Name
                    </label>
                    <input
                      required
                      type="text"
                      value={userData.name}
                      onChange={(e) => setUserData({ ...userData, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">
                      Email Address
                    </label>
                    <input
                      required
                      type="email"
                      value={userData.email}
                      onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">
                      Access Role
                    </label>
                    <select
                      required
                      value={userData.role}
                      onChange={(e) =>
                        setUserData({
                          ...userData,
                          role: e.target.value,
                          tenant_id: e.target.value === 'super_admin' ? '' : userData.tenant_id,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium appearance-none"
                    >
                      <option value="user">Agent (Normal User)</option>
                      <option value="super_admin">Super Administrator</option>
                    </select>
                  </div>
                  {userData.role !== 'super_admin' && (
                    <div className="animate-in fade-in duration-300">
                      <label className="block text-sm font-semibold text-slate-600 mb-2">
                        Assign to Workspace
                      </label>
                      <select
                        required
                        value={userData.tenant_id}
                        onChange={(e) => setUserData({ ...userData, tenant_id: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium appearance-none"
                      >
                        <option value="">Select a Workspace...</option>
                        {tenants.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-2">
                      Initial Password
                    </label>
                    <input
                      required
                      type="password"
                      value={userData.password}
                      onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all font-medium"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    className="bg-slate-800 hover:bg-slate-900 text-white px-8 py-3 rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                  >
                    Provision Account
                  </button>
                </div>
              </form>
            )}

            <AdminUsersTable users={users} loading={loading} />
          </div>
        )}
      </main>
    </div>
  );
}
