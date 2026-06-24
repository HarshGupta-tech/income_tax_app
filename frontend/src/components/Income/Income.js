import React, { useEffect, useState } from 'react';
import API from '../../utils/api';
import { formatCurrency, SOURCE_LABELS } from '../../utils/helpers';

function IncomeModal({ open, onClose, onSave, financialYears, editData }) {
  const [form, setForm] = useState({ financial_year_id: '', source_type: 'salary', description: '', amount: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editData) {
      setForm({ financial_year_id: editData.financial_year_id, source_type: editData.source_type, description: editData.description || '', amount: editData.amount });
    } else {
      setForm({ financial_year_id: financialYears[0]?.id || '', source_type: 'salary', description: '', amount: '' });
    }
  }, [editData, financialYears, open]);

  if (!open) return null;

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editData) {
        await API.put(`/income/${editData.id}`, form);
      } else {
        await API.post('/income', form);
      }
      onSave();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving income.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editData ? 'Edit Income Source' : 'Add Income Source'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Financial Year</label>
              <select className="form-control" value={form.financial_year_id}
                onChange={e => setForm({ ...form, financial_year_id: e.target.value })} required>
                <option value="">Select year</option>
                {financialYears.map(fy => <option key={fy.id} value={fy.id}>{fy.year_label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Income Type</label>
              <select className="form-control" value={form.source_type}
                onChange={e => setForm({ ...form, source_type: e.target.value })}>
                {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input type="text" className="form-control" placeholder="e.g. Annual salary from employer"
                value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input type="number" className="form-control" placeholder="0" min="0"
                value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="spinner"></span> Saving…</> : (editData ? 'Update' : 'Add Income')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Income() {
  const [income, setIncome] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedFY, setSelectedFY] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [incRes, fyRes] = await Promise.all([
        API.get('/income', { params: { financial_year_id: selectedFY || undefined } }),
        API.get('/financial-years'),
      ]);
      setIncome(incRes.data.income_sources);
      setFinancialYears(fyRes.data.financial_years);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedFY]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this income source?')) return;
    try {
      await API.delete(`/income/${id}`);
      fetchData();
    } catch (err) {
      alert('Error deleting income.');
    }
  };

  const totalIncome = income.reduce((s, i) => s + parseFloat(i.amount), 0);

  return (
    <>
      <div className="page-header">
        <h1>Income Sources</h1>
        <p>Track all your income across financial years</p>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <select className="form-control" style={{ width: 180 }} value={selectedFY} onChange={e => setSelectedFY(e.target.value)}>
            <option value="">All years</option>
            {financialYears.map(fy => <option key={fy.id} value={fy.id}>{fy.year_label}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => { setEditData(null); setModalOpen(true); }}>
            + Add Income
          </button>
        </div>

        {selectedFY && income.length > 0 && (
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card indigo">
              <div className="stat-card-label">Total Income</div>
              <div className="stat-card-value">{formatCurrency(totalIncome)}</div>
              <div className="stat-card-sub">{income.length} source(s)</div>
            </div>
          </div>
        )}

        <div className="card">
          {loading ? (
            <div className="page-loading"><span className="spinner"></span> Loading…</div>
          ) : income.length === 0 ? (
            <div className="empty-state">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p>No income sources found. Add your first one!</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Financial Year</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {income.map(item => (
                    <tr key={item.id}>
                      <td><span className="badge badge-indigo">{SOURCE_LABELS[item.source_type] || item.source_type}</span></td>
                      <td>{item.description || '—'}</td>
                      <td>{item.year_label}</td>
                      <td><strong>{formatCurrency(item.amount)}</strong></td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditData(item); setModalOpen(true); }}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <IncomeModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={() => { setModalOpen(false); fetchData(); }}
        financialYears={financialYears}
        editData={editData}
      />
    </>
  );
}
