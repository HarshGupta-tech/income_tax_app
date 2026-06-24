import React, { useEffect, useState } from 'react';
import API from '../../utils/api';
import { formatCurrency } from '../../utils/helpers';

export default function TaxCalculator() {
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedFY, setSelectedFY] = useState('');
  const [regime, setRegime] = useState('new');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/financial-years').then(res => {
      setFinancialYears(res.data.financial_years);
      if (res.data.financial_years.length > 0) setSelectedFY(res.data.financial_years[0].id);
    });
  }, []);

  const handleCalculate = async () => {
    if (!selectedFY) return setError('Please select a financial year.');
    setError('');
    setLoading(true);
    try {
      const res = await API.post('/tax/calculate', { financial_year_id: selectedFY, tax_regime: regime });
      setResult(res.data.calculation);
    } catch (err) {
      setError(err.response?.data?.message || 'Calculation failed.');
    } finally {
      setLoading(false);
    }
  };

  const SelectedFYLabel = financialYears.find(f => f.id == selectedFY)?.year_label || '';

  return (
    <>
      <div className="page-header">
        <h1>Tax Calculator</h1>
        <p>Calculate your income tax based on Indian tax slabs (FY 2024-25)</p>
      </div>
      <div className="page-body">
        <div className="card" style={{ maxWidth: 560, marginBottom: 24 }}>
          <div className="card-header"><h3>Select Parameters</h3></div>
          <div className="card-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Financial Year</label>
              <select className="form-control" value={selectedFY} onChange={e => setSelectedFY(e.target.value)}>
                {financialYears.map(fy => <option key={fy.id} value={fy.id}>{fy.year_label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Tax Regime</label>
              <div className="regime-toggle">
                <button className={`regime-btn ${regime === 'new' ? 'active' : ''}`} onClick={() => setRegime('new')}>New Regime</button>
                <button className={`regime-btn ${regime === 'old' ? 'active' : ''}`} onClick={() => setRegime('old')}>Old Regime</button>
              </div>
              <p style={{ fontSize: 12, color: '#64748b' }}>
                {regime === 'new'
                  ? '⚡ New regime: Lower rates, but most deductions not allowed.'
                  : '📋 Old regime: Higher rates, but all 80C/80D deductions apply.'}
              </p>
            </div>
            <button className="btn btn-primary" onClick={handleCalculate} disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
              {loading ? <><span className="spinner"></span> Calculating…</> : '🧮 Calculate Tax'}
            </button>
          </div>
        </div>

        {result && (
          <>
            <div className="stat-grid">
              <div className="stat-card indigo">
                <div className="stat-card-label">Gross Income</div>
                <div className="stat-card-value">{formatCurrency(result.total_income)}</div>
                <div className="stat-card-sub">FY {SelectedFYLabel}</div>
              </div>
              <div className="stat-card green">
                <div className="stat-card-label">Deductions</div>
                <div className="stat-card-value">{formatCurrency(result.total_deductions)}</div>
                <div className="stat-card-sub">{regime === 'new' ? 'Not applicable (new regime)' : 'All sections'}</div>
              </div>
              <div className="stat-card amber">
                <div className="stat-card-label">Taxable Income</div>
                <div className="stat-card-value">{formatCurrency(result.taxable_income)}</div>
                <div className="stat-card-sub">After deductions</div>
              </div>
              <div className="stat-card red">
                <div className="stat-card-label">Total Tax Payable</div>
                <div className="stat-card-value">{formatCurrency(result.total_tax)}</div>
                <div className="stat-card-sub">Including 4% cess</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Tax Breakdown */}
              <div className="card">
                <div className="card-header"><h3>Tax Computation</h3></div>
                <div className="card-body">
                  {[
                    { label: 'Gross Income', value: result.total_income },
                    { label: 'Less: Deductions', value: -result.total_deductions },
                    { label: 'Taxable Income', value: result.taxable_income, bold: true },
                    { label: 'Basic Tax', value: result.basic_tax },
                    { label: 'Surcharge', value: result.surcharge },
                    { label: 'Health & Education Cess (4%)', value: result.cess },
                  ].map((r, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between',
                      padding: '9px 0',
                      borderBottom: i < 5 ? '1px solid #F1F5F9' : 'none',
                      fontWeight: r.bold ? 600 : 400,
                    }}>
                      <span style={{ fontSize: 14, color: '#334155' }}>{r.label}</span>
                      <span style={{ fontSize: 14, color: r.value < 0 ? '#059669' : '#0F172A' }}>
                        {r.value < 0 ? `(${formatCurrency(Math.abs(r.value))})` : formatCurrency(r.value)}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0', fontWeight: 700, fontSize: 16, borderTop: '2px solid #4F46E5', marginTop: 4 }}>
                    <span>Total Tax</span>
                    <span style={{ color: '#DC2626' }}>{formatCurrency(result.total_tax)}</span>
                  </div>
                </div>
              </div>

              {/* Slab Breakdown */}
              <div className="card">
                <div className="card-header"><h3>Slab-wise Tax ({regime === 'new' ? 'New' : 'Old'} Regime)</h3></div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Income Slab</th>
                        <th>Rate</th>
                        <th>Tax</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.slab_breakdown.map((s, i) => (
                        <tr key={i}>
                          <td style={{ fontSize: 13 }}>{s.slab}</td>
                          <td><span className="badge badge-slate">{s.rate}</span></td>
                          <td><strong>{formatCurrency(s.tax)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Income breakdown */}
            {result.income_breakdown?.length > 0 && (
              <div className="card" style={{ marginTop: 20 }}>
                <div className="card-header"><h3>Income Breakdown</h3></div>
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>Source</th><th>Amount</th></tr></thead>
                    <tbody>
                      {result.income_breakdown.map((i, idx) => (
                        <tr key={idx}>
                          <td>{i.source_type}</td>
                          <td>{formatCurrency(i.total)}</td>
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
