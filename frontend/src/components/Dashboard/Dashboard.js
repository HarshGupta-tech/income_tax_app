import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import API from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/tax/dashboard')
      .then(res => setSummary(res.data.summary || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const latest = summary[0] || null;

  const chartData = summary.map(s => ({
    year: s.year_label,
    income: parseFloat(s.total_income),
    tax: parseFloat(s.total_tax),
  }));

  return (
    <>
      <div className="page-header">
        <h1>Welcome back, {user?.full_name?.split(' ')[0]} 👋</h1>
        <p>Here's your income tax overview</p>
      </div>
      <div className="page-body">
        {loading ? (
          <div className="page-loading"><span className="spinner"></span> Loading dashboard…</div>
        ) : (
          <>
            <div className="stat-grid">
              <div className="stat-card indigo">
                <div className="stat-card-label">Total Income (Latest)</div>
                <div className="stat-card-value">{latest ? formatCurrency(latest.total_income) : '—'}</div>
                <div className="stat-card-sub">{latest?.year_label || 'No data yet'}</div>
              </div>
              <div className="stat-card green">
                <div className="stat-card-label">Total Deductions</div>
                <div className="stat-card-value">{latest ? formatCurrency(latest.total_deductions) : '—'}</div>
                <div className="stat-card-sub">Claimed deductions</div>
              </div>
              <div className="stat-card amber">
                <div className="stat-card-label">Taxable Income</div>
                <div className="stat-card-value">{latest ? formatCurrency(latest.taxable_income) : '—'}</div>
                <div className="stat-card-sub">After deductions</div>
              </div>
              <div className="stat-card red">
                <div className="stat-card-label">Tax Payable</div>
                <div className="stat-card-value">{latest ? formatCurrency(latest.total_tax) : '—'}</div>
                <div className="stat-card-sub">{latest?.tax_regime === 'new' ? 'New Regime' : 'Old Regime'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Year-wise chart */}
              <div className="card">
                <div className="card-header"><h3>Income vs Tax (Year-wise)</h3></div>
                <div className="card-body">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData}>
                        <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Bar dataKey="income" name="Income" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="tax" name="Tax" fill="#DC2626" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="empty-state">
                      <p>No calculations yet. <Link to="/tax-calculator">Calculate your tax</Link></p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div className="card">
                <div className="card-header"><h3>Quick Actions</h3></div>
                <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <Link to="/income" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
                    💰 Add Income Source
                  </Link>
                  <Link to="/deductions" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
                    📋 Add Deduction
                  </Link>
                  <Link to="/tax-calculator" className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>
                    🧮 Calculate Tax Now
                  </Link>
                  <Link to="/reports" className="btn btn-ghost" style={{ justifyContent: 'flex-start' }}>
                    📊 View Reports
                  </Link>
                </div>
              </div>
            </div>

            {/* History table */}
            {summary.length > 0 && (
              <div className="card" style={{ marginTop: 20 }}>
                <div className="card-header"><h3>Calculation History</h3></div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Financial Year</th>
                        <th>Gross Income</th>
                        <th>Deductions</th>
                        <th>Taxable Income</th>
                        <th>Tax Payable</th>
                        <th>Regime</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map(s => (
                        <tr key={s.id}>
                          <td><strong>{s.year_label}</strong></td>
                          <td>{formatCurrency(s.total_income)}</td>
                          <td>{formatCurrency(s.total_deductions)}</td>
                          <td>{formatCurrency(s.taxable_income)}</td>
                          <td><strong style={{ color: '#DC2626' }}>{formatCurrency(s.total_tax)}</strong></td>
                          <td><span className={`badge ${s.tax_regime === 'new' ? 'badge-indigo' : 'badge-amber'}`}>{s.tax_regime === 'new' ? 'New' : 'Old'}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
