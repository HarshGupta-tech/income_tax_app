import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../../utils/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  
  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', password: '', role: 'user' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = useCallback((page = 1, searchTerm = search) => {
    setLoading(true);
    API.get('/admin/users', { params: { page, limit: 15, search: searchTerm } })
      .then(res => {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => { fetchUsers(1, ''); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    fetchUsers(1, searchInput);
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This will remove all their data.`)) return;
    setDeleting(userId);
    try {
      await API.delete(`/admin/users/${userId}`);
      fetchUsers(pagination.page, search);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeleting(null);
    }
  };

  const handleRoleChange = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;
    try {
      await API.put(`/admin/users/${userId}/role`, { role: newRole });
      fetchUsers(pagination.page, search);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update role.');
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await API.post('/admin/users', addForm);
      setShowAddModal(false);
      setAddForm({ full_name: '', email: '', password: '', role: 'user' });
      fetchUsers(1, '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add user.');
    } finally {
      setSaving(false);
    }
  };


  const pages = [];
  for (let i = 1; i <= pagination.totalPages; i++) pages.push(i);

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>User Management</h1>
          <p>View and manage all registered users</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add User / Admin
        </button>
      </div>
      <div className="page-body">
        {/* Search bar */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-body" style={{ padding: '14px 20px' }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, email, or PAN..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                style={{ maxWidth: 400 }}
              />
              <button type="submit" className="btn btn-primary btn-sm">Search</button>
              {search && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setSearchInput(''); setSearch(''); fetchUsers(1, ''); }}>
                  Clear
                </button>
              )}
              <div style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b', alignSelf: 'center' }}>
                {pagination.total} user{pagination.total !== 1 ? 's' : ''} found
              </div>
            </form>
          </div>
        </div>

        {/* Users table */}
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>PAN</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8}><div className="page-loading"><span className="spinner"></span> Loading…</div></td></tr>
                ) : users.length > 0 ? users.map(u => (
                  <tr key={u.id}>
                    <td style={{ color: '#94a3b8', fontSize: 12 }}>#{u.id}</td>
                    <td><strong>{u.full_name}</strong></td>
                    <td>{u.email}</td>
                    <td><code style={{ fontSize: 12, background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{u.pan_number || '—'}</code></td>
                    <td>{u.phone || '—'}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-violet' : 'badge-slate'}`}>
                        {u.role === 'admin' ? '🛡️ Admin' : 'User'}
                      </span>
                    </td>
                    <td style={{ fontSize: 13 }}>{new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to={`/admin/users/${u.id}`} className="btn btn-ghost btn-sm">View</Link>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleRoleChange(u.id, u.role)}
                        >
                          {u.role === 'admin' ? 'Demote' : 'Promote'}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(u.id, u.full_name)}
                          disabled={deleting === u.id || u.role === 'admin'}
                          title={u.role === 'admin' ? 'Cannot delete admin' : 'Delete user'}
                        >
                          {deleting === u.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>No users found.</td></tr>
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
                onClick={() => fetchUsers(pagination.page - 1, search)}
              >← Prev</button>
              <div className="pagination-pages">
                {pages.map(p => (
                  <button
                    key={p}
                    className={`pagination-page ${p === pagination.page ? 'active' : ''}`}
                    onClick={() => fetchUsers(p, search)}
                  >{p}</button>
                ))}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchUsers(pagination.page + 1, search)}
              >Next →</button>
            </div>
          )}
        </div>
      </div>

      {/* Add User/Admin Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add User / Admin</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddUser}>
              <div className="modal-body">
                {error && <div className="alert alert-error">{error}</div>}
                
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={addForm.full_name}
                    onChange={e => setAddForm({ ...addForm, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-control"
                    value={addForm.email}
                    onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={addForm.password}
                      onChange={e => setAddForm({ ...addForm, password: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select
                      className="form-control"
                      value={addForm.role}
                      onChange={e => setAddForm({ ...addForm, role: e.target.value })}
                    >
                      <option value="user">Regular User</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating…' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
