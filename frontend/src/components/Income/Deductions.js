import React, { useEffect, useState } from 'react';
import API from '../../utils/api';
import { formatCurrency, DEDUCTION_SECTIONS } from '../../utils/helpers';
import { validatePositiveAmount } from '../../utils/validation';

function DeductionModal({ open, onClose, onSave, financialYears, editData }) {
  const [form, setForm] = useState({ financial_year_id: '', section: '80C', description: '', amount: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    if (editData) {
      setForm({ financial_year_id: editData.financial_year_id, section: editData.section, description: editData.description || '', amount: editData.amount });
    } else {
      setForm({ financial_year_id: financialYears[0]?.id || '', section: '80C', description: '', amount: '' });
    }
  }, [editData, financialYears, open]);

  if (!open) return null;

  const selectedSection = DEDUCTION_SECTIONS.find(s => s.value === form.section);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.financial_year_id) return setError('Please select a financial year.');
    if (!validatePositiveAmount(form.amount)) return setError('Amount must be a positive number.');

    setLoading(true);
    try {
      if (editData) {
        await API.put(`/deductions/${editData.id}`, form);
      } else {
        await API.post('/deductions', form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving deduction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{editData ? 'Edit Deduction' : 'Add Deduction'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label className="form-label">Financial Year</label>
              <select className="form-control" value={form.financial_year_id}
                onChange={e => setForm({ ...form, financial_year_id: e.target.value })} required>
                <option value="">Select year</option>
                {financialYears.map(fy => <option key={fy.id} value={fy.id}>{fy.year_label}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Section</label>
              <select className="form-control" value={form.section}
                onChange={e => setForm({ ...form, section: e.target.value })}>
                {DEDUCTION_SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {selectedSection?.max && (
                <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  Maximum limit: {formatCurrency(selectedSection.max)}
                </p>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <input type="text" className="form-control" placeholder="e.g. PPF contribution"
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
            <button type="submit" className="btn btn-success" disabled={loading}>
              {loading ? <><span className="spinner"></span> Saving…</> : (editData ? 'Update' : 'Add Deduction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Deductions() {
  const [deductions, setDeductions] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);
  const [selectedFY, setSelectedFY] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dRes, fyRes] = await Promise.all([
        API.get('/deductions', { params: { financial_year_id: selectedFY || undefined } }),
        API.get('/financial-years'),
      ]);
      setDeductions(dRes.data.deductions);
      setFinancialYears(fyRes.data.financial_years);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [selectedFY]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this deduction?')) return;
    try {
      await API.delete(`/deductions/${id}`);
      fetchData();
    } catch (err) {
      alert('Error deleting deduction.');
    }
  };

  const totalDeductions = deductions.reduce((s, d) => s + parseFloat(d.amount), 0);

  return (
    <>
      <div className="page-header">
        <h1>Deductions</h1>
        <p>Manage 80C, 80D, HRA and other deductions</p>
      </div>
      <div className="page-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <select className="form-control" style={{ width: 180 }} value={selectedFY} onChange={e => setSelectedFY(e.target.value)}>
            <option value="">All years</option>
            {financialYears.map(fy => <option key={fy.id} value={fy.id}>{fy.year_label}</option>)}
          </select>
          <button className="btn btn-success" onClick={() => { setEditData(null); setModalOpen(true); }}>
            + Add Deduction
          </button>
        </div>

        {deductions.length > 0 && (
          <div className="stat-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card green">
              <div className="stat-card-label">Total Deductions</div>
              <div className="stat-card-value">{formatCurrency(totalDeductions)}</div>
              <div className="stat-card-sub">{deductions.length} entry/entries</div>
            </div>
          </div>
        )}

        <div className="card">
          {loading ? (
            <div className="page-loading"><span className="spinner"></span> Loading…</div>
          ) : deductions.length === 0 ? (
            <div className="empty-state">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              <p>No deductions found. Add your first one!</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Description</th>
                    <th>Financial Year</th>
                    <th>Max Limit</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {deductions.map(d => (
                    <tr key={d.id}>
                      <td><span className="badge badge-green">{d.section}</span></td>
                      <td>{d.description || '—'}</td>
                      <td>{d.year_label}</td>
                      <td>{d.max_limit ? formatCurrency(d.max_limit) : 'No limit'}</td>
                      <td><strong>{formatCurrency(d.amount)}</strong></td>
                      <td>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditData(d); setModalOpen(true); }}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(d.id)}>Delete</button>
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

      <DeductionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={() => { setModalOpen(false); fetchData(); }}
        financialYears={financialYears}
        editData={editData}
      />
    </>
  );
}
