import React, { useEffect, useState } from 'react';
import API from '../../utils/api';

export default function AdminFinancialYears() {
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ year_label: '', start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchYears = () => {
    setLoading(true);
    API.get('/admin/financial-years')
      .then(res => setYears(res.data.financial_years))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchYears(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ year_label: '', start_date: '', end_date: '' });
    setError('');
    setShowModal(true);
  };

  const openEdit = (fy) => {
    setEditing(fy);
    setForm({
      year_label: fy.year_label,
      start_date: fy.start_date?.slice(0, 10),
      end_date: fy.end_date?.slice(0, 10),
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editing) {
        await API.put(`/admin/financial-years/${editing.id}`, form);
      } else {
        await API.post('/admin/financial-years', form);
      }
      setShowModal(false);
      fetchYears();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>Financial Years</h1>
        <p>Manage assessment periods</p>
      </div>
      <div className="page-body">
        <div className="card">
          <div className="card-header">
            <h3>All Financial Years</h3>
            <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Financial Year</button>
          </div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Year Label</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5}><div className="page-loading"><span className="spinner"></span> Loading…</div></td></tr>
                ) : years.length > 0 ? years.map(fy => (
                  <tr key={fy.id}>
                    <td style={{ color: '#94a3b8', fontSize: 12 }}>#{fy.id}</td>
                    <td><strong><span className="badge badge-violet">{fy.year_label}</span></strong></td>
                    <td>{new Date(fy.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>{new Date(fy.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(fy)}>Edit</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>No financial years configured.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Edit Financial Year' : 'Add Financial Year'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Year Label (e.g. 2026-27)</label>
                  <input
                    className="form-control"
                    value={form.year_label}
                    onChange={e => setForm({ ...form, year_label: e.target.value })}
                    placeholder="2026-27"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.start_date}
                      onChange={e => setForm({ ...form, start_date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.end_date}
                      onChange={e => setForm({ ...form, end_date: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : (editing ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
