import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, CartesianGrid,
} from 'recharts';
import API from '../../utils/api';
import { formatCurrency, SOURCE_COLORS } from '../../utils/helpers';

const COLORS = ['#4F46E5', '#059669', '#D97706', '#DC2626', '#7C3AED', '#0891B2'];

export default function Reports() {
  const [summary, setSummary] = useState([]);
  const [incomeBySource, setIncomeBySource] = useState([]);
  const [deductionsBySection, setDeductionsBySection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFY, setSelectedFY] = useState('');
  const [financialYears, setFinancialYears] = useState([]);

  useEffect(() => {
    Promise.all([
      API.get('/tax/dashboard'),
      API.get('/financial-years'),
    ]).then(([summRes, fyRes]) => {
      setSummary(summRes.data.summary || []);
      setFinancialYears(fyRes.data.financial_years);
      if (fyRes.data.financial_years[0]) setSelectedFY(fyRes.data.financial_years[0].id);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedFY) return;
    Promise.all([
      API.get('/income', { params: { financial_year_id: selectedFY } }),
      API.get('/deductions', { params: { financial_year_id: selectedFY } }),
    ]).then(([incRes, dedRes]) => {
      // Group income by source
      const incMap = {};
      incRes.data.income_sources.forEach(i => {
        incMap[i.source_type] = (incMap[i.source_type] || 0) + parseFloat(i.amount);
      });
      setIncomeBySource(Object.entries(incMap).map(([k, v]) => ({ name: k, value: v })));

      // Group deductions by section
      const dedMap = {};
      dedRes.data.deductions.forEach(d => {
        dedMap[d.section] = (dedMap[d.section] || 0) + parseFloat(d.amount);
      });
      setDeductionsBySection(Object.entries(dedMap).map(([k, v]) => ({ name: k, value: v })));
    }).catch(console.error);
  }, [selectedFY]);

  const trendData = summary.map(s => ({
    year: s.year_label,
    income: parseFloat(s.total_income),
    taxable: parseFloat(s.taxable_income),
    tax: parseFloat(s.total_tax),
  })).reverse();

  const formatYAxis = (v) => v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${(v / 1000).toFixed(0)}K`;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>{label}</p>
          {payload.map((p, i) => (
            <p key={i} style={{ color: p.color }}>{p.name}: {formatCurrency(p.value)}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className="page-header">
        <h1>Reports & Charts</h1>
        <p>Visual breakdown of your income, deductions, and tax</p>
      </div>
      <div className="page-body">
        {loading ? (
          <div className="page-loading"><span className="spinner"></span> Loading reports…</div>
        ) : (
          <>
            {/* FY Selector */}
            <div style={{ marginBottom: 20 }}>
              <select className="form-control" style={{ width: 180 }} value={selectedFY} onChange={e => setSelectedFY(e.target.value)}>
                {financialYears.map(fy => <option key={fy.id} value={fy.id}>{fy.year_label}</option>)}
              </select>
            </div>

            {/* Trend line */}
            {trendData.length > 1 && (
              <div className="card" style={{ marginBottom: 20 }}>
                <div className="card-header"><h3>Multi-Year Tax Trend</h3></div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={formatYAxis} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="income" name="Gross Income" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="taxable" name="Taxable Income" stroke="#D97706" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="tax" name="Tax Payable" stroke="#DC2626" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
              {/* Income pie */}
              <div className="card">
                <div className="card-header"><h3>Income by Source</h3></div>
                <div className="card-body">
                  {incomeBySource.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={incomeBySource} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`} labelLine={false} fontSize={11}>
                          {incomeBySource.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <div className="empty-state"><p>No income data for this year.</p></div>}
                </div>
              </div>

              {/* Deductions bar */}
              <div className="card">
                <div className="card-header"><h3>Deductions by Section</h3></div>
                <div className="card-body">
                  {deductionsBySection.length > 0 ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={deductionsBySection} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={formatYAxis} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={60} />
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                        <Bar dataKey="value" name="Amount" radius={[0, 4, 4, 0]}>
                          {deductionsBySection.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : <div className="empty-state"><p>No deductions data for this year.</p></div>}
                </div>
              </div>
            </div>

            {/* Summary table */}
            {summary.length > 0 && (
              <div className="card">
                <div className="card-header"><h3>Year-wise Summary</h3></div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>FY</th>
                        <th>Gross Income</th>
                        <th>Deductions</th>
                        <th>Taxable Income</th>
                        <th>Basic Tax</th>
                        <th>Cess</th>
                        <th>Total Tax</th>
                        <th>Effective Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.map(s => {
                        const effRate = s.total_income > 0 ? ((s.total_tax / s.total_income) * 100).toFixed(1) : '0.0';
                        return (
                          <tr key={s.id}>
                            <td><strong>{s.year_label}</strong></td>
                            <td>{formatCurrency(s.total_income)}</td>
                            <td>{formatCurrency(s.total_deductions)}</td>
                            <td>{formatCurrency(s.taxable_income)}</td>
                            <td>{formatCurrency(s.basic_tax)}</td>
                            <td>{formatCurrency(s.cess)}</td>
                            <td><strong style={{ color: '#DC2626' }}>{formatCurrency(s.total_tax)}</strong></td>
                            <td><span className="badge badge-amber">{effRate}%</span></td>
                          </tr>
                        );
                      })}
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
