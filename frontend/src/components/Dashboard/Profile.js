import React, { useEffect, useState } from 'react';
import API from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', pan_number: '', date_of_birth: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    API.get('/auth/profile').then(res => {
      const u = res.data.user;
      setForm({
        full_name: u.full_name || '',
        email: u.email || '',
        phone: u.phone || '',
        pan_number: u.pan_number || '',
        date_of_birth: u.date_of_birth ? u.date_of_birth.split('T')[0] : '',
        address: u.address || '',
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await API.put('/auth/profile', form);
      setMessage('Profile updated successfully!');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = form.full_name?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  return (
    <>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your personal details</p>
      </div>
      <div className="page-body">
        {loading ? (
          <div className="page-loading"><span className="spinner"></span> Loading profile…</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
            {/* Avatar card */}
            <div className="card" style={{ height: 'fit-content' }}>
              <div className="card-body" style={{ textAlign: 'center', padding: '32px 20px' }}>
                <div className="avatar" style={{ width: 72, height: 72, margin: '0 auto 16px', fontSize: 26 }}>{initials}</div>
                <h3 style={{ fontSize: 16 }}>{form.full_name}</h3>
                <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{form.email}</p>
                {form.pan_number && (
                  <div style={{ marginTop: 16, padding: '8px 14px', background: '#EEF2FF', borderRadius: 8, fontSize: 13, color: '#4F46E5', fontWeight: 500 }}>
                    PAN: {form.pan_number}
                  </div>
                )}
              </div>
            </div>

            {/* Edit form */}
            <div className="card">
              <div className="card-header"><h3>Edit Profile</h3></div>
              <div className="card-body">
                {message && (
                  <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'}`}>
                    {message}
                  </div>
                )}
                <form onSubmit={handleSave}>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input type="text" className="form-control" value={form.full_name}
                        onChange={e => setForm({ ...form, full_name: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" value={form.email} disabled
                        style={{ background: '#F8FAFC', color: '#64748B' }} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input type="tel" className="form-control" value={form.phone}
                        onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">PAN Number</label>
                      <input type="text" className="form-control" value={form.pan_number}
                        onChange={e => setForm({ ...form, pan_number: e.target.value.toUpperCase() })}
                        maxLength={10} placeholder="ABCDE1234F" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Date of Birth</label>
                      <input type="date" className="form-control" value={form.date_of_birth}
                        onChange={e => setForm({ ...form, date_of_birth: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <textarea className="form-control" rows={3} value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      placeholder="Your address…" />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <><span className="spinner"></span> Saving…</> : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
