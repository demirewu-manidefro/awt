import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  LogOut, Shield, Monitor, Globe, Trash2, AlertTriangle,
  User, Clock, ChevronRight, Activity, Lock, Smartphone
} from 'lucide-react';

const formatDate = (iso) => {
  if (!iso) return 'Never';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
};

const getRoleColor = (role) =>
  ({ admin: '#a78bfa', user: '#60a5fa', moderator: '#34d399' }[role] || '#60a5fa');

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [suspicious, setSuspicious] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [revoking, setRevoking] = useState(null);
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    if (activeTab === 'sessions') fetchSessions();
    if (activeTab === 'security') fetchSuspicious();
  }, [activeTab]);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const { data } = await api.get('/sessions');
      setSessions(data.data?.sessions || data.data || []);
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoadingSessions(false); }
  };

  const fetchSuspicious = async () => {
    try {
      const { data } = await api.get('/sessions/suspicious');
      setSuspicious(data.data?.attempts || data.data || []);
    } catch { toast.error('Failed to load security data'); }
  };

  const revokeSession = async (id) => {
    setRevoking(id);
    try {
      await api.delete(`/sessions/${id}`);
      toast.success('Session revoked');
      setSessions(s => s.filter(sess => sess.id !== id));
    } catch { toast.error('Failed to revoke session'); }
    finally { setRevoking(null); }
  };

  const revokeAll = async () => {
    if (!confirm('Revoke all other sessions? You will remain logged in on this device.')) return;
    try {
      await api.delete('/sessions/all');
      toast.success('All other sessions revoked');
      fetchSessions();
    } catch { toast.error('Failed to revoke sessions'); }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'sessions', label: 'Sessions', icon: Monitor },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Shield size={22} />
          <span>AuthSystem</span>
        </div>

        <div className="sidebar-user">
          <div className="avatar">{(user?.displayName || user?.email || 'U')[0].toUpperCase()}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.displayName || 'User'}</span>
            <span className="sidebar-user-role" style={{ color: getRoleColor(user?.role) }}>
              {user?.role}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-item ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={18} />
              {label}
              {activeTab === id && <ChevronRight size={14} className="nav-arrow" />}
            </button>
          ))}
        </nav>

        <button className="btn-logout" onClick={handleLogout}>
          <LogOut size={16} /> Sign Out
        </button>
      </aside>

      {/* Main Content */}
      <main className="dash-main">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="page-header">
              <h2>Welcome back, {user?.displayName || 'User'} 👋</h2>
              <p className="page-desc">Here's an overview of your account</p>
            </div>

            <div className="stats-grid">
              <StatCard icon={<User size={20} />} label="Account Type" value={user?.role || 'user'} color="#a78bfa" />
              <StatCard icon={<Lock size={20} />} label="Auth Method" value={user?.provider || 'email'} color="#60a5fa" />
              <StatCard icon={<Clock size={20} />} label="Member Since" value={formatDate(user?.createdAt).split(',')[0]} color="#34d399" />
              <StatCard icon={<Activity size={20} />} label="Last Login" value={formatDate(user?.lastLoginAt).split(',')[0]} color="#f59e0b" />
            </div>

            <div className="profile-card">
              <h3>Profile Information</h3>
              <div className="profile-grid">
                <ProfileRow label="Display Name" value={user?.displayName || '—'} />
                <ProfileRow label="Email" value={user?.email} />
                <ProfileRow label="Role" value={user?.role} />
                <ProfileRow label="Provider" value={user?.provider || 'email'} />
                <ProfileRow label="Account ID" value={user?.id} mono />
                <ProfileRow label="Last Login" value={formatDate(user?.lastLoginAt)} />
                <ProfileRow label="Created" value={formatDate(user?.createdAt)} />
              </div>
            </div>
          </div>
        )}

        {/* ── SESSIONS TAB ── */}
        {activeTab === 'sessions' && (
          <div className="tab-content">
            <div className="page-header">
              <div>
                <h2>Active Sessions</h2>
                <p className="page-desc">Manage devices where you're logged in</p>
              </div>
              <button className="btn-danger-outline" onClick={revokeAll}>
                <Trash2 size={15} /> Revoke All Others
              </button>
            </div>

            {loadingSessions ? (
              <div className="center-loader"><div className="spinner" /></div>
            ) : sessions.length === 0 ? (
              <EmptyState icon={<Monitor size={40} />} message="No active sessions found" />
            ) : (
              <div className="sessions-list">
                {sessions.map(sess => (
                  <div key={sess.id} className="session-card">
                    <div className="session-icon">
                      {sess.device_info?.toLowerCase().includes('mobile')
                        ? <Smartphone size={20} />
                        : <Monitor size={20} />}
                    </div>
                    <div className="session-info">
                      <span className="session-device">{sess.device_info || 'Unknown device'}</span>
                      <span className="session-meta">
                        <Globe size={12} /> {sess.ip_address || 'Unknown IP'}
                        &nbsp;·&nbsp;
                        <Clock size={12} /> {formatDate(sess.created_at)}
                      </span>
                      <span className="session-browser">{sess.browser_info || 'Unknown browser'}</span>
                    </div>
                    <button
                      className="btn-revoke"
                      onClick={() => revokeSession(sess.id)}
                      disabled={revoking === sess.id}
                    >
                      {revoking === sess.id ? <span className="btn-spinner sm" /> : <Trash2 size={14} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {activeTab === 'security' && (
          <div className="tab-content">
            <div className="page-header">
              <div>
                <h2>Security Log</h2>
                <p className="page-desc">Suspicious or unusual login activity</p>
              </div>
            </div>

            {suspicious.length === 0 ? (
              <EmptyState
                icon={<Shield size={40} />}
                message="No suspicious activity detected"
                sub="Your account looks secure 🎉"
                good
              />
            ) : (
              <div className="sessions-list">
                {suspicious.map((a, i) => (
                  <div key={i} className="session-card suspicious">
                    <div className="session-icon warn">
                      <AlertTriangle size={20} />
                    </div>
                    <div className="session-info">
                      <span className="session-device">
                        {a.suspicious_reason?.replace(/_/g, ' ') || 'Suspicious login'}
                      </span>
                      <span className="session-meta">
                        <Globe size={12} /> {a.ip_address || 'Unknown IP'}
                        &nbsp;·&nbsp;
                        <Clock size={12} /> {formatDate(a.created_at)}
                      </span>
                      <span className="session-browser">{a.user_agent || 'Unknown agent'}</span>
                    </div>
                    <span className={`badge ${a.success ? 'badge-success' : 'badge-danger'}`}>
                      {a.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: `${color}20`, color }}>{icon}</div>
    <div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  </div>
);

const ProfileRow = ({ label, value, mono }) => (
  <div className="profile-row">
    <span className="profile-label">{label}</span>
    <span className={`profile-value ${mono ? 'mono' : ''}`}>{value || '—'}</span>
  </div>
);

const EmptyState = ({ icon, message, sub, good }) => (
  <div className="empty-state">
    <div className={`empty-icon ${good ? 'good' : ''}`}>{icon}</div>
    <p className="empty-msg">{message}</p>
    {sub && <p className="empty-sub">{sub}</p>}
  </div>
);
