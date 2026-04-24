import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Trash2, ArrowLeft, Search, Shield, Activity, Calendar, UserX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AdminUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }
    fetchUsers();
  }, [user]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (err) {
      setStatusMsg({ text: 'Failed to fetch users', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you SURE you want to delete user "${userName}"? This will remove all their personal data and sessions.`)) return;
    
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(users.filter(u => u.id !== userId));
        setStatusMsg({ text: `User ${userName} deleted successfully`, type: 'success' });
      } else {
        setStatusMsg({ text: data.message, type: 'error' });
      }
    } catch (err) {
      setStatusMsg({ text: 'Deletion failed', type: 'error' });
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="layout-container" style={{ display: 'flex', minHeight: '100vh', padding: '24px', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <button 
              onClick={() => navigate('/')}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '12px', color: 'white', cursor: 'pointer' }}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 style={{ fontSize: '1.75rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Users color="var(--primary)" />
                User Management
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{users.length} registered accounts</p>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: '12px 16px 12px 40px', borderRadius: '12px', width: '350px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)' }}
            />
          </div>
        </header>

        {statusMsg.text && (
          <div style={{ 
            padding: '16px', borderRadius: '12px', 
            background: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            color: statusMsg.type === 'success' ? '#10b981' : 'var(--accent-rose)',
            border: `1px solid ${statusMsg.type === 'success' ? '#10b981' : 'var(--accent-rose)'}`
          }}>
            {statusMsg.text}
          </div>
        )}

        <section className="glass-card" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>User</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>Account Info</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600' }}>Activity</th>
                <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td colSpan="4" style={{ padding: '24px', textAlign: 'center' }}>
                      <div className="skeleton-pulse" style={{ height: '20px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}></div>
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No users found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>
                          {u.name?.charAt(0) || u.email?.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 'bold', color: 'white' }}>{u.name || 'No Name'}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} color="var(--text-muted)" />
                          Joined {new Date(u.createdAt).toLocaleDateString()}
                        </div>
                        {u.email === process.env.ADMIN_EMAIL && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', background: 'rgba(34, 211, 238, 0.1)', padding: '2px 8px', borderRadius: '4px', width: 'fit-content', fontWeight: 'bold' }}>
                            SUPER ADMIN
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{u.wishlistCount}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>WISHLIST</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{u.sessionCount}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SESSIONS</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      {u.email !== process.env.ADMIN_EMAIL && (
                        <button 
                          onClick={() => deleteUser(u.id, u.name || u.email)}
                          style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)', color: 'var(--accent-rose)', padding: '8px 12px', borderRadius: '10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                          <UserX size={16} />
                          Delete Account
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
};

export default AdminUsers;
