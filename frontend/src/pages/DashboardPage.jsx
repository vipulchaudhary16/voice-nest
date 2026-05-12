import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LogOut,
  LayoutDashboard,
  Users,
  PhoneCall,
  Megaphone,
  List,
  Phone,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const SIDEBAR_STORAGE_KEY = 'voicenest.dashboard.sidebarCollapsed';
import ContactsPage from './ContactsPage';
import CallsPage from './CallsPage';
import CampaignsPage from './CampaignsPage';
import CampaignCallDetailsPage from './CampaignCallDetailsPage';
import ExophonesPage from './ExophonesPage';
import ListsPage from './ListsPage';

function VoiceNestLogo({ className = 'w-8 h-8' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="voicenestGradient"
          x1="10"
          y1="10"
          x2="54"
          y2="54"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="16" fill="url(#voicenestGradient)" />
      <path
        d="M17 20L25 44L32 28L39 44L47 20"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RedirectToContacts() {
  return <Navigate to="/dashboard/contacts" replace />;
}

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const v = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      return v === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, sidebarCollapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [sidebarCollapsed]);

  const navItems = [
    { to: '/dashboard/home', label: 'Dashboard', icon: LayoutDashboard, end: true, enabled: false },
    { to: '/dashboard/contacts', label: 'Contacts', icon: Users, end: true, enabled: true },
    { to: '/dashboard/lists', label: 'Groups', icon: List, end: false, enabled: true },
    { to: '/dashboard/exophones', label: 'ExoPhones', icon: Phone, end: false, enabled: true },
    { to: '/dashboard/campaigns', label: 'Campaigns', icon: Megaphone, end: false, enabled: true },
    { to: '/dashboard/calls', label: 'Calls', icon: PhoneCall, end: true, enabled: true },
  ];

  const navClass = ({ isActive }) =>
    `w-full flex items-center rounded-xl transition-all ${
      sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'
    } ${
      isActive
        ? 'bg-indigo-500/10 text-indigo-400 font-semibold'
        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-input)] hover:text-[var(--text-primary)]'
    }`;

  const navClassMobile = ({ isActive }) =>
    `flex-1 flex flex-col items-center gap-1 p-2 rounded-lg text-xs transition-colors whitespace-nowrap min-w-[4.5rem] ${
      isActive ? 'bg-indigo-500/10 text-indigo-400' : 'text-[var(--text-secondary)]'
    }`;

  const disabledNavClass = `w-full flex items-center rounded-xl cursor-not-allowed opacity-45 text-[var(--text-muted)] pointer-events-none select-none ${
    sidebarCollapsed ? 'justify-center px-2 py-3' : 'gap-3 px-4 py-3'
  }`;

  const disabledNavClassMobile =
    'flex-1 flex flex-col items-center gap-1 p-2 rounded-lg text-xs whitespace-nowrap min-w-[4.5rem] cursor-not-allowed opacity-45 text-[var(--text-muted)] pointer-events-none select-none';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex">
      <div
        className={`bg-[var(--bg-card)] border-r border-[var(--border)] flex flex-col hidden md:flex shrink-0 transition-[width] duration-200 ease-out overflow-hidden ${
          sidebarCollapsed ? 'w-[4.25rem]' : 'w-64'
        }`}
      >
        <div className={`border-b border-[var(--border)] ${sidebarCollapsed ? 'p-3' : 'p-4'}`}>
          <div
            className={`flex items-center gap-3 ${sidebarCollapsed ? 'flex-col-reverse gap-2' : 'justify-between'}`}
          >
            <div
              className={`flex items-center gap-3 min-w-0 ${sidebarCollapsed ? 'flex-col' : 'flex-1'}`}
            >
              <div className="w-8 h-8 shrink-0 rounded-lg shadow-lg shadow-indigo-500/20 overflow-hidden">
                <VoiceNestLogo className="w-8 h-8" />
              </div>
              {!sidebarCollapsed && (
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 truncate">
                  VoiceNest
                </h1>
              )}
            </div>
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              className="shrink-0 p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-colors"
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
          {navItems.map((item) =>
            item.enabled ? (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={navClass}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className={sidebarCollapsed ? 'sr-only' : ''}>{item.label}</span>
              </NavLink>
            ) : (
              <span
                key={item.to}
                className={disabledNavClass}
                aria-disabled="true"
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span className={sidebarCollapsed ? 'sr-only' : ''}>{item.label}</span>
              </span>
            )
          )}
        </nav>

        <div className={`border-t border-[var(--border)] ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
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

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="md:hidden bg-[var(--bg-card)] border-b border-[var(--border)] p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <VoiceNestLogo className="w-7 h-7" />
            <h1 className="text-lg font-bold text-[var(--text-primary)]">VoiceNest Admin</h1>
          </div>
          <button onClick={logout} className="p-2 rounded-lg bg-[var(--bg-input)] text-red-400">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <div className="md:hidden flex overflow-x-auto bg-[var(--bg-card)] border-b border-[var(--border)] p-2 gap-2">
          {navItems.map((item) =>
            item.enabled ? (
              <NavLink key={item.to} to={item.to} end={item.end} className={navClassMobile}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            ) : (
              <span key={item.to} className={disabledNavClassMobile} aria-disabled="true">
                <item.icon className="w-5 h-5" />
                {item.label}
              </span>
            )
          )}
        </div>

        <main className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
          <div className="flex min-h-0 flex-1 flex-col">
            <Routes>
              <Route index element={<Navigate to="contacts" replace />} />
              <Route path="home" element={<RedirectToContacts />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="lists" element={<ListsPage />} />
              <Route path="exophones" element={<ExophonesPage />} />
              <Route path="campaigns" element={<CampaignsPage />} />
              <Route path="campaigns/:id/call-details" element={<CampaignCallDetailsPage />} />
              <Route path="calls" element={<CallsPage />} />
              <Route path="*" element={<Navigate to="/dashboard/contacts" replace />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
}
