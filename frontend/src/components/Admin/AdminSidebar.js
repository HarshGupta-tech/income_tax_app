import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NavItem = ({ to, icon, label }) => (
  <NavLink to={to} end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
    <span dangerouslySetInnerHTML={{ __html: icon }} />
    {label}
  </NavLink>
);

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <aside className="sidebar admin-sidebar">
      <div className="sidebar-logo">
        <h2>🛡️ Admin Panel</h2>
        <span>TaxFlow Management</span>
      </div>

      <nav className="sidebar-nav">
        <NavItem to="/admin" label="Dashboard"
          icon='<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>' />
        <NavItem to="/admin/users" label="Users"
          icon='<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>' />
        <NavItem to="/admin/financial-years" label="Financial Years"
          icon='<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' />
        <NavItem to="/admin/tax-overview" label="Tax Overview"
          icon='<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M7 16l4-4 4 4 4-8"/></svg>' />

        <div style={{ height: 1, background: 'rgba(255,255,255,.08)', margin: '12px 20px' }} />

        <NavItem to="/dashboard" label="← Back to App"
          icon='<svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4"/></svg>' />
      </nav>

      <div className="sidebar-footer">
        <div className="user-chip">
          <div className="avatar admin-avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <div className="user-chip-name">{user?.full_name}</div>
            <div className="user-chip-email" style={{ color: '#c4b5fd' }}>Administrator</div>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 10, color: '#a78bfa', borderColor: 'rgba(139,92,246,.25)' }}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Sign out
        </button>
      </div>
    </aside>
  );
}
