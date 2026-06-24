import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminSidebar from '../components/Admin/AdminSidebar';

export default function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12, color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #E2E8F0', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
        Loading Admin Panel…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="app-shell">
      <AdminSidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}
