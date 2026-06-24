import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';

export default function AdminTaxOverview() {
  const [calculations, setCalculations] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [financialYears, setFinancialYears] = useState([]);
  const [filters, setFilters] = useState({ financial_year_id: '', tax_regime: '', search: '' });
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCalculations = useCallback((page = 1, overrideFilters) => {
    setLoading(true);
    const f = overrideFilters || filters;
    const params = { page, limit: 15 };
    if (f.financial_year_id) params.financial_year_id = f.financial_year_id;
    if (f.tax_regime) params.tax_regime = f.tax_regime;
    if (f.search) params.search = f.search;

    API.get('/admin/tax-calculations', { params })
      .then(res => {
        setCalculations(res.data.calculations);
        setPagination(res.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    API.get('/admin/financial-years').then(res => setFinancialYears(res.data.financial_years)).catch(() => {});
    fetchCalculations(1, { financial_year_id: '', tax_regime: '', search: '' });
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchCalculations(1, newFilters);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange('search', searchInput);
  };

  const clearFilters = () => {
    setFilters({ financial_year_id: '', tax_regime: '', search: '' });
    setSearchInput('');
    fetchCalculations(1, { financial_year_id: '', tax_regime: '', search: '' });
  };

  // Summary stats
  const totalTax = calculations.reduce((s, c) => s + parseFloat(c.total_tax), 0);
  const totalIncome = calculations.reduce((s, c) => s + parseFloat(c.total_income), 0);

  const pages = [];
  for (let i = 1; i <= pagination.totalPages; i++) pages.push(i);

  return (
    <>
      <div className="page-header">
        <h1>Tax Overview</h1>
        <p>All tax calculations across the platform</p>
      </div>
      <div className="page-body">
        {/* Filters */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body" style={{ padding: '14px 20px' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                className="form-control"
                style={{ maxWidth: 180 }}
                value={filters.financial_year_id}
                onChange={e => handleFilterChange('financial_year_id', e.target.value)}
              >
                <option value="">All Financial Years</option>
                {financialYears.map(fy => (
                  <option key={fy.id} value={fy.id}>{fy.year_label}</option>
                ))}
              </select>

              <select
                className="form-control"
                style={{ maxWidth: 150 }}
                value={filters.tax_regime}
                onChange={e => handleFilterChange('tax_regime', e.target.value)}
              >
                <option value="">All Regimes</option>
                <option value="new">New Regime</option>
                <option value="old">Old Regime</option>
              </select>

              <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by user..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  style={{ maxWidth: 220 }}
                />
                <button type="submit" className="btn btn-primary btn-sm">Search</button>
              </form>

              {(filters.financial_year_id || filters.tax_regime || filters.search) && (
                <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear All</button>
              )}

              <div style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b' }}>
                {pagination.total} result{pagination.total !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Summary mini-stats */}
        {calculations.length > 0 && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
            <div className="stat-card" style={{ flex: 1, padding: 14 }}>
              <div className="stat-card-label">Page Total Income</div>
              <div className="stat-card-value" style={{ fontSize: 20 }}>{formatCurrency(totalIncome)}</div>
            </div>
            <div className="stat-card" style={{ flex: 1, padding: 14 }}>
              <div className="stat-card-label">Page Total Tax</div>
              <div className="stat-card-value" style={{ fontSize: 20, color: '#DC2626' }}>{formatCurrency(totalTax)}</div>
            </div>
          </div>
        )}

        {/* Calculations table */}
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Financial Year</th>
                  <th>Gross Income</th>
                  <th>Deductions</th>
                  <th>Taxable Income</th>
                  <th>Tax Payable</th>
                  <th>Regime</th>
                  <th>Calculated On</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8}><div className="page-loading"><span className="spinner"></span> Loading…</div></td></tr>
                ) : calculations.length > 0 ? calculations.map(c => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/admin/users/${c.user_id}`} style={{ textDecoration: 'none', color: '#7C3AED', fontWeight: 500 }}>
                        {c.full_name}
                      </Link>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.email}</div>
                    </td>
                    <td><span className="badge badge-indigo">{c.year_label}</span></td>
                    <td>{formatCurrency(c.total_income)}</td>
                    <td>{formatCurrency(c.total_deductions)}</td>
                    <td>{formatCurrency(c.taxable_income)}</td>
                    <td><strong style={{ color: '#DC2626' }}>{formatCurrency(c.total_tax)}</strong></td>
                    <td><span className={`badge ${c.tax_regime === 'new' ? 'badge-violet' : 'badge-amber'}`}>{c.tax_regime === 'new' ? 'New' : 'Old'}</span></td>
                    <td style={{ fontSize: 13 }}>{new Date(c.calculated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>No tax calculations found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="btn btn-ghost btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchCalculations(pagination.page - 1)}
              >← Prev</button>
              <div className="pagination-pages">
                {pages.map(p => (
                  <button
                    key={p}
                    className={`pagination-page ${p === pagination.page ? 'active' : ''}`}
                    onClick={() => fetchCalculations(p)}
                  >{p}</button>
                ))}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchCalculations(pagination.page + 1)}
              >Next →</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
