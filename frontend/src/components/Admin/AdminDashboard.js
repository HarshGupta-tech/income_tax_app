import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import API from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';

const PIE_COLORS = ['#7C3AED', '#2DD4BF'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <div className="page-header"><h1>Admin Dashboard</h1><p>Platform-wide overview</p></div>
        <div className="page-body"><div className="page-loading"><span className="spinner"></span> Loading dashboard…</div></div>
      </>
    );
  }

  const { stats, fyBreakdown, recentUsers, regimeSplit } = data || {};

  const fyChartData = (fyBreakdown || []).map(f => ({
    year: f.year_label,
    income: parseFloat(f.total_income),
    tax: parseFloat(f.total_tax),
    users: f.users,
  }));

  const regimeData = (regimeSplit || []).map(r => ({
    name: r.tax_regime === 'new' ? 'New Regime' : 'Old Regime',
    value: r.count,
    tax: parseFloat(r.total_tax),
  }));

  return (
    <>
      <div className="page-header">
        <h1>Admin Dashboard 🛡️</h1>
        <p>Platform-wide analytics and system overview</p>
      </div>
      <div className="page-body">
        {/* Stat Cards */}
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="stat-card admin-stat violet">
            <div className="stat-card-label">Total Users</div>
            <div className="stat-card-value">{stats?.totalUsers || 0}</div>
            <div className="stat-card-sub">{stats?.adminUsers || 0} admin(s)</div>
          </div>
          <div className="stat-card admin-stat emerald">
            <div className="stat-card-label">Total Income Recorded</div>
            <div className="stat-card-value">{formatCurrency(stats?.totalIncome)}</div>
            <div className="stat-card-sub">Across all users</div>
          </div>
          <div className="stat-card admin-stat rose">
            <div className="stat-card-label">Total Tax Calculated</div>
            <div className="stat-card-value">{formatCurrency(stats?.totalTax)}</div>
            <div className="stat-card-sub">{stats?.totalCalculations || 0} calculations</div>
          </div>
          <div className="stat-card admin-stat sky">
            <div className="stat-card-label">Financial Years</div>
            <div className="stat-card-value">{fyBreakdown?.length || 0}</div>
            <div className="stat-card-sub">Active periods</div>
          </div>
        </div>

        {/* Charts */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
          <div className="card">
            <div className="card-header"><h3>Income & Tax by Financial Year</h3></div>
            <div className="card-body">
              {fyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={fyChartData}>
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                    <Tooltip formatter={(v) => formatCurrency(v)} />
                    <Bar dataKey="income" name="Total Income" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="tax" name="Total Tax" fill="#F43F5E" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state"><p>No calculations yet across the platform.</p></div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Regime Distribution</h3></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {regimeData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={regimeData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {regimeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    {regimeData.map((r, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i] }} />
                        {r.name}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="empty-state"><p>No data yet.</p></div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Users Table */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Registrations</h3>
            <Link to="/admin/users" className="btn btn-ghost btn-sm">View All Users →</Link>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {(recentUsers || []).length > 0 ? recentUsers.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.full_name}</strong></td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-violet' : 'badge-slate'}`}>
                        {u.role === 'admin' ? '🛡️ Admin' : 'User'}
                      </span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No users registered yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
