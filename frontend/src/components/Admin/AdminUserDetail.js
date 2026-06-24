import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../utils/api';
import { formatCurrency, SOURCE_LABELS } from '../../utils/helpers';

export default function AdminUserDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('income');

  useEffect(() => {
    API.get(`/admin/users/${id}`)
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <>
        <div className="page-header"><h1>User Details</h1></div>
        <div className="page-body"><div className="page-loading"><span className="spinner"></span> Loading…</div></div>
      </>
    );
  }

  if (!data?.user) {
    return (
      <>
        <div className="page-header"><h1>User Not Found</h1></div>
        <div className="page-body"><Link to="/admin/users" className="btn btn-ghost">← Back to Users</Link></div>
      </>
    );
  }

  const { user, income, deductions, calculations } = data;

  const tabs = [
    { key: 'income', label: `Income (${income.length})` },
    { key: 'deductions', label: `Deductions (${deductions.length})` },
    { key: 'calculations', label: `Tax Calculations (${calculations.length})` },
  ];

  return (
    <>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link to="/admin/users" className="btn btn-ghost btn-sm" style={{ padding: '6px 10px' }}>←</Link>
          <div>
            <h1>{user.full_name}</h1>
            <p>{user.email}</p>
          </div>
          <span className={`badge ${user.role === 'admin' ? 'badge-violet' : 'badge-slate'}`} style={{ marginLeft: 8 }}>
            {user.role === 'admin' ? '🛡️ Admin' : 'User'}
          </span>
        </div>
      </div>
      <div className="page-body">
        {/* User info cards */}
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 24 }}>
          <div className="stat-card">
            <div className="stat-card-label">PAN Number</div>
            <div className="stat-card-value" style={{ fontSize: 18 }}>{user.pan_number || '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Phone</div>
            <div className="stat-card-value" style={{ fontSize: 18 }}>{user.phone || '—'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Date of Birth</div>
            <div className="stat-card-value" style={{ fontSize: 18 }}>
              {user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString('en-IN') : '—'}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card-label">Registered</div>
            <div className="stat-card-value" style={{ fontSize: 18 }}>
              {new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </div>

        {user.address && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body">
              <div style={{ fontSize: 12, fontWeight: 500, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Address</div>
              <div style={{ fontSize: 14 }}>{user.address}</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="admin-tabs">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`admin-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >{t.label}</button>
          ))}
        </div>

        {/* Tab content */}
        <div className="card">
          <div className="table-wrapper">
            {activeTab === 'income' && (
              <table>
                <thead>
                  <tr><th>Financial Year</th><th>Source Type</th><th>Description</th><th>Amount</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {income.length > 0 ? income.map(i => (
                    <tr key={i.id}>
                      <td><span className="badge badge-indigo">{i.year_label}</span></td>
                      <td>{SOURCE_LABELS[i.source_type] || i.source_type}</td>
                      <td>{i.description || '—'}</td>
                      <td><strong>{formatCurrency(i.amount)}</strong></td>
                      <td style={{ fontSize: 13 }}>{new Date(i.created_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No income sources recorded.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'deductions' && (
              <table>
                <thead>
                  <tr><th>Financial Year</th><th>Section</th><th>Description</th><th>Amount</th><th>Max Limit</th></tr>
                </thead>
                <tbody>
                  {deductions.length > 0 ? deductions.map(d => (
                    <tr key={d.id}>
                      <td><span className="badge badge-indigo">{d.year_label}</span></td>
                      <td><strong>{d.section}</strong></td>
                      <td>{d.description || '—'}</td>
                      <td>{formatCurrency(d.amount)}</td>
                      <td>{d.max_limit ? formatCurrency(d.max_limit) : '—'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No deductions recorded.</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === 'calculations' && (
              <table>
                <thead>
                  <tr><th>Financial Year</th><th>Income</th><th>Deductions</th><th>Taxable Income</th><th>Tax</th><th>Regime</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {calculations.length > 0 ? calculations.map(c => (
                    <tr key={c.id}>
                      <td><span className="badge badge-indigo">{c.year_label}</span></td>
                      <td>{formatCurrency(c.total_income)}</td>
                      <td>{formatCurrency(c.total_deductions)}</td>
                      <td>{formatCurrency(c.taxable_income)}</td>
                      <td><strong style={{ color: '#DC2626' }}>{formatCurrency(c.total_tax)}</strong></td>
                      <td><span className={`badge ${c.tax_regime === 'new' ? 'badge-violet' : 'badge-amber'}`}>{c.tax_regime === 'new' ? 'New' : 'Old'}</span></td>
                      <td style={{ fontSize: 13 }}>{new Date(c.calculated_at).toLocaleDateString('en-IN')}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7} style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>No tax calculations yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
