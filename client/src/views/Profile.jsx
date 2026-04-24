import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, Mail, Lock, Smartphone, LogOut, ArrowLeft, Save, ShieldCheck, 
  Heart, Calendar, Search, Trash2, 
  Library, BookOpen, Film, Tv, Gamepad2, Video, MonitorPlay
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import MediaCard from '../components/MediaCard';

const Profile = () => {
  const { user, logout, setUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('wishlist'); // 'wishlist' or 'security'
  const [sessions, setSessions] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [wishlistSearch, setWishlistSearch] = useState('');
  const [wishlistFilter, setWishlistFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const wishlistCategories = [
    { id: 'all', label: 'All', icon: Library },
    { id: 'book', label: 'Books', icon: BookOpen },
    { id: 'movie', label: 'Movies', icon: Film },
    { id: 'series', label: 'TV Series', icon: Tv },
    { id: 'game', label: 'Games', icon: Gamepad2 },
    { id: 'short', label: 'Shorts', icon: Video },
    { id: 'youtube', label: 'YouTube', icon: MonitorPlay },
  ];

  const filteredWishlist = wishlist.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(wishlistSearch.toLowerCase());
    const matchesFilter = wishlistFilter === 'all' || item.type === wishlistFilter;
    return matchesSearch && matchesFilter;
  });

  // Forms
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    if (user) {
      setProfileForm({ name: user.name, email: user.email });
      fetchSessions();
      fetchWishlist();
    }
  }, [user]);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wishlist', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) setWishlist(data.data);
    } catch (err) {
      console.error('Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (id) => {
    try {
      const res = await fetch(`/api/wishlist/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setWishlist(wishlist.filter(item => item._id !== id));
      }
    } catch (err) {
      console.error('Failed to remove from wishlist');
    }
  };

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
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
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
        fetchSessions(); 
        setTimeout(() => setMessage({ text: '', type: '' }), 3000);
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

  const TabButton = ({ id, label, icon: Icon }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '16px 20px',
        width: '100%',
        background: activeTab === id ? 'var(--primary)' : 'transparent',
        color: activeTab === id ? 'white' : 'var(--text-muted)',
        border: 'none',
        borderRadius: '12px',
        fontSize: '1rem',
        fontWeight: activeTab === id ? '600' : '400',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'left'
      }}
    >
      <Icon size={20} />
      {label}
    </button>
  );

  return (
    <div className="layout-container" style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      padding: '24px', 
      gap: '24px', 
      maxWidth: '1400px', 
      margin: '0 auto' 
    }}>
      
      {/* Left Pane - Sidebar Navigation */}
      <aside style={{ width: '280px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => navigate('/')}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', padding: '8px', borderRadius: '10px', color: 'white', cursor: 'pointer' }}
            >
              <ArrowLeft size={18} />
            </button>
            <h2 style={{ fontSize: '1.25rem', color: 'white' }}>Profile</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <TabButton id="wishlist" label="My Wishlist" icon={Heart} />
            <TabButton id="security" label="Security & Account" icon={ShieldCheck} />
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
            <button 
              onClick={logout}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', width: '100%', background: 'transparent', border: 'none', color: 'var(--accent-rose)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}
            >
              <LogOut size={18} />
              Logout Session
            </button>
          </div>
        </div>
      </aside>

      {/* Right Pane - Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {message.text && (
          <div style={{ 
            padding: '16px', borderRadius: '12px', 
            background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            color: message.type === 'success' ? '#10b981' : 'var(--accent-rose)',
            border: `1px solid ${message.type === 'success' ? '#10b981' : 'var(--accent-rose)'}`,
            animation: 'fadeIn 0.3s ease'
          }}>
            {message.text}
          </div>
        )}

        {activeTab === 'wishlist' ? (
          <section className="glass-card" style={{ padding: '32px', minHeight: '80vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div>
                <h1 style={{ fontSize: '2rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Heart color="var(--accent-rose)" fill="var(--accent-rose)" />
                  Personal Wishlist
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>A dedicated space for items you're interested in.</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px 16px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                  {filteredWishlist.length} {filteredWishlist.length === 1 ? 'Item' : 'Items'} Found
                </div>
              </div>
            </div>

            {/* Wishlist Toolbar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text" 
                  placeholder="Search wishlist..." 
                  value={wishlistSearch}
                  onChange={(e) => setWishlistSearch(e.target.value)}
                  style={{ padding: '14px 16px 14px 48px', borderRadius: '14px', width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', fontSize: '1rem' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {wishlistCategories.map(cat => {
                  const Icon = cat.icon;
                  const isActive = wishlistFilter === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setWishlistFilter(cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 18px',
                        borderRadius: '12px',
                        background: isActive ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                        color: isActive ? 'white' : 'var(--text-muted)',
                        border: '1px solid ' + (isActive ? 'var(--primary)' : 'var(--glass-border)'),
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Icon size={16} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="masonry-grid">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="glass-card" style={{ height: '300px', background: 'rgba(255,255,255,0.02)', marginBottom: '24px' }}>
                    <div className="skeleton-pulse" style={{ height: '100%', width: '100%', borderRadius: '16px' }}></div>
                  </div>
                ))}
              </div>
            ) : filteredWishlist.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', color: 'var(--text-muted)', textAlign: 'center' }}>
                <Heart size={48} color="rgba(255,255,255,0.1)" style={{ marginBottom: '16px' }} />
                <h3>No items found</h3>
                <p>{wishlist.length === 0 ? 'Your wishlist is empty. Browse the library to add some!' : 'Try a different search or filter.'}</p>
              </div>
            ) : (
              <div className="masonry-grid">
                {filteredWishlist.map(item => (
                  <MediaCard 
                    key={item._id} 
                    item={{ ...item, id: item._id }} 
                    onDelete={removeFromWishlist}
                    onEdit={() => {}} 
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
              {/* Account Settings */}
              <section className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <User size={20} color="var(--primary)" />
                  <h2 style={{ fontSize: '1.25rem' }}>Personal Information</h2>
                </div>
                <form onSubmit={handleProfileUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Full Name</label>
                    <input 
                      type="text" 
                      value={profileForm.name} 
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      style={{ padding: '12px', borderRadius: '10px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Email Address</label>
                    <input 
                      type="email" 
                      value={profileForm.email} 
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      style={{ padding: '12px', borderRadius: '10px' }}
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={loading}
                    style={{ background: 'var(--primary)', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', border: 'none' }}
                  >
                    <Save size={18} />
                    {loading ? 'Saving...' : 'Update Account'}
                  </button>
                </form>
              </section>

              {/* Password Change */}
              <section className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                  <Lock size={20} color="var(--accent-cyan)" />
                  <h2 style={{ fontSize: '1.25rem' }}>Security Settings</h2>
                </div>
                {user?.isAdmin ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Master admin credentials must be managed via environment configuration for maximum security.
                  </p>
                ) : (
                  <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current Password</label>
                      <input 
                        type="password" 
                        value={passwordForm.currentPassword} 
                        onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                        style={{ padding: '10px', borderRadius: '8px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>New Password</label>
                      <input 
                        type="password" 
                        value={passwordForm.newPassword} 
                        onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                        style={{ padding: '10px', borderRadius: '8px' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Confirm Password</label>
                      <input 
                        type="password" 
                        value={passwordForm.confirmPassword} 
                        onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                        style={{ padding: '10px', borderRadius: '8px' }}
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={loading}
                      style={{ background: 'var(--accent-cyan)', color: 'white', padding: '12px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', border: 'none', marginTop: '10px' }}
                    >
                      Update Password
                    </button>
                  </form>
                )}
              </section>
            </div>

            {/* Sessions */}
            <section className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Smartphone size={20} color="var(--primary)" />
                  <h2 style={{ fontSize: '1.25rem' }}>Logged-in Devices</h2>
                </div>
                <button 
                  onClick={revokeAllOthers}
                  style={{ background: 'rgba(244, 63, 94, 0.1)', color: 'var(--accent-rose)', border: '1px solid rgba(244, 63, 94, 0.2)', padding: '6px 12px', borderRadius: '8px', fontSize: '0.8rem', cursor: 'pointer' }}
                >
                  Logout all others
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {sessions.map(session => (
                  <div key={session.id} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)',
                    border: session.isCurrent ? '1px solid var(--primary)' : '1px solid var(--glass-border)'
                  }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <Smartphone size={18} color={session.isCurrent ? 'var(--primary)' : 'var(--text-muted)'} />
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                          {session.userAgent?.includes('Windows') ? 'Windows PC' : 
                           session.userAgent?.includes('iPhone') ? 'iPhone' : 
                           session.userAgent?.includes('Android') ? 'Android Device' : 'Unknown Device'}
                          {session.isCurrent && <span style={{ marginLeft: '8px', fontSize: '0.65rem', background: 'var(--primary)', padding: '2px 6px', borderRadius: '4px' }}>YOU</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {session.ip} • {new Date(session.lastActive).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <button 
                        onClick={() => revokeSession(session.id)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
      
      <style>{`
        .wishlist-card:hover {
          transform: translateY(-4px);
          background: rgba(255, 255, 255, 0.05) !important;
          border-color: var(--accent-rose) !important;
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Profile;
