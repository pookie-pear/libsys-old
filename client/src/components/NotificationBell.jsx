import React, { useState, useRef, useEffect } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, X, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: '', message: '', type: 'info' });
  const dropdownRef = useRef(null);
  const { user } = useAuth();

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (data.success) setNotifications(data.data);
    } catch (err) {
      console.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowAddForm(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddNotification = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newNotif)
      });
      const data = await res.json();
      if (data.success) {
        setNotifications([data.data, ...notifications]);
        setNewNotif({ title: '', message: '', type: 'info' });
        setShowAddForm(false);
      }
    } catch (err) {
      console.error('Failed to add notification');
    }
  };

  const deleteNotification = async (id) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(notifications.filter(n => n._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete notification');
    }
  };

  const clearAllNotifications = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Failed to clear notifications');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'warning': return <AlertTriangle size={16} color="#fbbf24" />;
      case 'success': return <CheckCircle size={16} color="#10b981" />;
      case 'error': return <X size={16} color="var(--accent-rose)" />;
      default: return <Info size={16} color="var(--primary)" />;
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid var(--glass-border)',
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.2s',
          zIndex: 1001
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
      >
        <Bell size={20} />
        {notifications.length > 0 && (
          <span style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            width: '10px',
            height: '10px',
            background: 'var(--accent-rose)',
            borderRadius: '50%',
            border: '2px solid var(--bg-card)',
            boxShadow: '0 0 10px var(--accent-rose)'
          }} />
        )}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '52px',
          right: '0',
          width: '350px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--glass-border)',
          borderRadius: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
          zIndex: 9999,
          overflow: 'hidden',
          animation: 'slideDown 0.2s ease'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>Notifications</h3>
            {user?.isAdmin && (
              <button 
                onClick={() => setShowAddForm(!showAddForm)}
                style={{ background: 'var(--primary)', color: 'white', width: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {showAddForm ? <X size={14} /> : <Plus size={14} />}
              </button>
            )}
          </div>
          
          {showAddForm && user?.isAdmin && (
            <form onSubmit={handleAddNotification} style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)' }}>
              <input 
                placeholder="Title" 
                value={newNotif.title}
                onChange={e => setNewNotif({...newNotif, title: e.target.value})}
                style={{ width: '100%', marginBottom: '8px', padding: '8px', fontSize: '0.85rem' }}
                required
              />
              <textarea 
                placeholder="Message" 
                value={newNotif.message}
                onChange={e => setNewNotif({...newNotif, message: e.target.value})}
                style={{ width: '100%', marginBottom: '8px', padding: '8px', fontSize: '0.85rem', minHeight: '60px' }}
                required
              />
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                {['info', 'success', 'warning', 'error'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewNotif({...newNotif, type: t})}
                    style={{
                      flex: 1, padding: '4px', fontSize: '0.7rem', textTransform: 'capitalize',
                      background: newNotif.type === t ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--glass-border)'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <button type="submit" style={{ width: '100%', background: 'var(--primary)', color: 'white', padding: '8px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                Post Notification
              </button>
            </form>
          )}

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {loading && notifications.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bell size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                <p style={{ fontSize: '0.85rem' }}>No new notifications</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div key={notif._id} style={{
                  padding: '16px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  gap: '12px',
                  transition: 'background 0.2s',
                  cursor: 'default',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  if (user?.isAdmin) e.currentTarget.querySelector('.del-btn').style.opacity = 1;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  if (user?.isAdmin) e.currentTarget.querySelector('.del-btn').style.opacity = 0;
                }}
                >
                  <div style={{ marginTop: '2px' }}>
                    {getIcon(notif.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.85rem' }}>{notif.title}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{getTimeAgo(notif.addedAt)}</span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                      {notif.message}
                    </p>
                  </div>
                  {user?.isAdmin && (
                    <button 
                      className="del-btn"
                      onClick={() => deleteNotification(notif._id)}
                      style={{ 
                        position: 'absolute', top: '8px', right: '8px', 
                        background: 'transparent', color: 'var(--accent-rose)', 
                        opacity: 0, transition: 'opacity 0.2s', padding: '4px'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          
          {notifications.length > 0 && user?.isAdmin && (
            <div style={{ padding: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <span 
                onClick={clearAllNotifications}
                style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', fontWeight: '600', cursor: 'pointer' }}
              >
                Clear All Notifications
              </span>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
