import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Smartphone, LogOut, ArrowLeft, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Forms
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name, email: user.email });
      fetchSessions();
    }
  }, [user]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/auth/sessions', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setSessions(data.data);
    } catch (err) {
      console.error('Failed to fetch sessions');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.data.user);
        setMessage({ text: 'Profile updated successfully!', type: 'success' });
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Update failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return setMessage({ text: 'New passwords do not match', type: 'error' });
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setMessage({ text: 'Password changed. Other devices logged out.', type: 'success' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        fetchSessions(); // Refresh sessions list
      } else {
        setMessage({ text: data.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Failed to change password', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (id) => {
    if (!window.confirm('Log out of this device?')) return;
    try {
      const res = await fetch(`/api/auth/sessions/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setSessions(sessions.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error('Failed to revoke session');
    }
  };

  const revokeAllOthers = async () => {
    if (!window.confirm('Log out of ALL other devices?')) return;
    try {
      const res = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setSessions(sessions.filter(s => s.isCurrent));
      }
    } catch (err) {
      console.error('Failed to revoke other sessions');
    }
  };

  return (
    <div className="layout-container" style={{ display: 'flex', minHeight: '100vh', padding: '24px', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <header style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <button 
            onClick={() => navigate(-1)}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--glass-border)', padding: '8px', borderRadius: '12px', color: 'white', cursor: 'pointer' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 style={{ fontSize: '2rem' }}>Profile Settings</h1>
        </header>

        {message.text && (
          <div style={{ 
            padding: '16px', borderRadius: '12px', 
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            color: message.type === 'success' ? '#10b981' : 'var(--accent-rose)',
            border: `1px solid ${message.type === 'success' ? '#10b981' : 'var(--accent-rose)'}`
          }}>
            {message.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
          
          {/* User Info Form */}
          <section className="glass-card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <User size={24} color="var(--primary)" />
              <h2 style={{ fontSize: '1.25rem' }}>Personal Information</h2>
            </div>
            <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Full Name</label>
                <input 
                  type="text" 
                  value={profileForm.name} 
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Enter your name"
                  style={{ padding: '12px', borderRadius: '10px' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email Address</label>
                <input 
                  type="email" 
                  value={profileForm.email} 
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  placeholder="Enter your email"
                  style={{ padding: '12px', borderRadius: '10px' }}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                style={{ background: 'var(--primary)', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', border: 'none' }}
              >
                <Save size={18} />
                {loading ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          </section>

          {/* Password Form */}
          <section className="glass-card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Lock size={24} color="var(--accent-cyan)" />
              <h2 style={{ fontSize: '1.25rem' }}>Change Password</h2>
            </div>
            {user?.email === 'admin@admin.com' ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Master admin password must be changed in the system environment variables.
              </p>
            ) : (
              <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Current Password</label>
                  <input 
                    type="password" 
                    value={passwordForm.currentPassword} 
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    style={{ padding: '12px', borderRadius: '10px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>New Password</label>
                  <input 
                    type="password" 
                    value={passwordForm.newPassword} 
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    style={{ padding: '12px', borderRadius: '10px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Confirm New Password</label>
                  <input 
                    type="password" 
                    value={passwordForm.confirmPassword} 
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    style={{ padding: '12px', borderRadius: '10px' }}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ background: 'var(--accent-cyan)', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', border: 'none' }}
                >
                  {loading ? 'Updating...' : 'Change Password'}
                </button>
              </form>
            )}
          </section>
        </div>

        {/* Sessions Management */}
        <section className="glass-card" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Smartphone size={24} color="var(--primary)" />
              <h2 style={{ fontSize: '1.25rem' }}>Active Sessions</h2>
            </div>
            <button 
              onClick={revokeAllOthers}
              style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '8px 16px', borderRadius: '10px', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Logout all other devices
            </button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sessions.map(session => (
              <div key={session.id} style={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)',
                border: session.isCurrent ? '1px solid var(--primary)' : '1px solid var(--glass-border)'
              }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Smartphone size={20} color={session.isCurrent ? 'var(--primary)' : 'var(--text-muted)'} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold' }}>
                        {session.userAgent?.includes('Windows') ? 'Windows PC' : 
                         session.userAgent?.includes('iPhone') ? 'iPhone' : 
                         session.userAgent?.includes('Android') ? 'Android Device' : 'Unknown Device'}
                      </span>
                      {session.isCurrent && (
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'var(--primary)', borderRadius: '10px', fontWeight: 'bold' }}>
                          CURRENT
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {session.ip} • Last active: {new Date(session.lastActive).toLocaleString()}
                    </div>
                  </div>
                </div>
                {!session.isCurrent && (
                  <button 
                    onClick={() => revokeSession(session.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
                    title="Revoke session"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
          <button 
            onClick={logout}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontWeight: 'bold' }}
          >
            <LogOut size={20} />
            Logout from all devices and clear cache
          </button>
        </section>
      </main>
    </div>
  );
};

export default Profile;
