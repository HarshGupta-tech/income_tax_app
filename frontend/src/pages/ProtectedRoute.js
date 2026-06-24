import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Dashboard/Sidebar';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 12, color: '#64748b', fontFamily: 'Inter, sans-serif' }}>
        <div style={{ width: 24, height: 24, border: '2px solid #E2E8F0', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
        Loading TaxFlow…
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}
