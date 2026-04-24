import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, LogIn, User, LogOut, RefreshCcw } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MediaGrid from '../components/MediaGrid';
import AddMediaModal from '../components/AddMediaModal';
import Pagination from '../components/Pagination';
import NotificationBell from '../components/NotificationBell';
import { useLibrary } from '../hooks/useLibrary';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { library, pagination, loading, error, addMedia, updateMedia, deleteMedia, refreshLibrary } = useLibrary();
  const { user, logout } = useAuth();
  const [filter, setFilter] = useState('all'); 
  const [statusFilter, setStatusFilter] = useState('all'); // all, completed, in_progress, wishlist
  const [ratingFilter, setRatingFilter] = useState(0); // 0 to 10
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate();

  // Handle page change and filters
  useEffect(() => {
    refreshLibrary(currentPage, 30, {
      type: filter,
      category: statusFilter,
      minRating: ratingFilter,
      search: searchQuery
    });
  }, [currentPage, filter, statusFilter, ratingFilter, searchQuery]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filter, statusFilter, ratingFilter, searchQuery]);

  // Poll for sync progress
  React.useEffect(() => {
    let interval;
    if (isSyncing) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/admin/sync-status', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          const data = await res.json();
          if (data.status === 'completed') {
            setIsSyncing(false);
            setSyncProgress(null);
            refreshLibrary();
            clearInterval(interval);
          } else {
            setSyncProgress(data);
          }
        } catch (err) {
          console.error('Error fetching sync status');
        }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isSyncing]);

  const handleSync = async () => {
    if (!window.confirm('This will sync your local JSON data with the database and fetch missing images. Continue?')) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        // Progress will be handled by the polling effect
      } else {
        alert('Sync failed: ' + data.message);
        setIsSyncing(false);
      }
    } catch (err) {
      alert('Error syncing data');
      setIsSyncing(false);
    }
  };

  const handleAddClick = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (item) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleSaveMedia = async (formData) => {
    if (editingItem) {
      await updateMedia(editingItem.id, formData);
    } else {
      await addMedia(formData);
    }
  };

  return (
    <div className="layout-container" style={{ display: 'flex', minHeight: '100vh', padding: '24px', gap: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      
      {/* Mobile Menu Toggle */}
      <button 
        className="mobile-menu-btn"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        style={{
          display: 'none', // Handled via CSS
          position: 'fixed', bottom: '24px', right: '24px',
          background: 'var(--primary)', color: 'white', padding: '16px', borderRadius: '50%',
          zIndex: 100, boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}
      >
        Menu
      </button>

      <div className={`sidebar-container ${isMobileMenuOpen ? 'open' : ''}`}>
        <Sidebar 
          filter={filter} 
          setFilter={(f) => { setFilter(f); setIsMobileMenuOpen(false); }} 
          onAddClick={handleAddClick} 
        />
      </div>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', width: '100%' }}>
        <header style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '24px',
          padding: '24px',
          borderRadius: '16px',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(12px)',
          border: '1px solid var(--glass-border)',
          position: 'relative',
          zIndex: 100 // Ensure header and its dropdowns (notifications) stay on top
        }}>
          {/* Progress Overlay */}
          {syncProgress && (
            <div style={{
              position: 'absolute',
              bottom: '-10px',
              left: '24px',
              right: '24px',
              background: 'var(--bg-dark)',
              padding: '12px 20px',
              borderRadius: '12px',
              border: '1px solid var(--primary)',
              zIndex: 10,
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-cyan)' }}>
                  {syncProgress.lastItem}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {syncProgress.current} / {syncProgress.total} ({syncProgress.percentage}%)
                </span>
              </div>
              <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${syncProgress.percentage}%`, 
                  height: '100%', 
                  background: 'var(--primary)', 
                  transition: 'width 0.3s ease' 
                }}></div>
              </div>
            </div>
          )}
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
              {filter === 'all' ? 'Your Library' : filter.charAt(0).toUpperCase() + filter.slice(1) + 's'}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              {pagination?.totalItems || 0} item{pagination?.totalItems !== 1 ? 's' : ''} found
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              title="Sync with local JSON data and fetch images"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '40px', height: '40px', borderRadius: '12px', 
                background: 'rgba(34, 211, 238, 0.1)',
                color: 'var(--accent-cyan)', border: '1px solid rgba(34, 211, 238, 0.2)',
                cursor: isSyncing ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
                opacity: isSyncing ? 0.5 : 1
              }}
            >
              <RefreshCcw size={18} className={isSyncing ? 'spin' : ''} />
              <style>{`
                .spin { animation: spin 2s linear infinite; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
              `}</style>
            </button>

            <input 
              type="text" 
              placeholder="Search by title or genre..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '250px' }}
            />

            {filter === 'book' && (
              <button
                onClick={() => navigate('/library')}
                style={{
                  padding: '10px 20px',
                  background: 'var(--accent-cyan)',
                  color: 'var(--bg-dark)',
                  fontWeight: 'bold',
                  borderRadius: '12px',
                  fontSize: '0.9rem'
                }}
              >
                IRL Library
              </button>
            )}

            <div style={{ height: '30px', width: '1px', background: 'var(--glass-border)', margin: '0 8px' }}></div>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <NotificationBell />
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '6px 6px 6px 16px',
                  borderRadius: '16px',
                  border: '1px solid var(--glass-border)',
                  transition: 'all 0.3s'
                }}>
                <div 
                  onClick={() => navigate('/profile')}
                  style={{ textAlign: 'right', cursor: 'pointer' }}
                  title="View Profile"
                >
                  <p style={{ fontSize: '0.9rem', fontWeight: '800', margin: 0, color: 'white', letterSpacing: '0.02em' }}>
                    {user.name || user.email.split('@')[0]}
                  </p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, opacity: 0.8 }}>
                    {user.email}
                  </p>
                </div>
                <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 4px' }}></div>
                <button 
                  onClick={logout}
                  title="Logout"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '40px', height: '40px', borderRadius: '12px', 
                    background: 'rgba(225, 29, 72, 0.1)',
                    color: 'var(--accent-rose)', border: '1px solid rgba(225, 29, 72, 0.2)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(225, 29, 72, 0.2)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(225, 29, 72, 0.1)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <LogOut size={18} />
                </button>
              </div>
            </div>
            ) : (
              <button 
                onClick={() => navigate('/login')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '12px', background: 'var(--primary)',
                  color: 'white', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                }}
              >
                <LogIn size={18} /> Login
              </button>
            )}
          </div>
        </header>


        {/* Status & Rating Filters */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
            {[
              { id: 'all', label: 'All Statuses' },
              { id: 'completed', label: 'Completed' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'wishlist', label: 'Wishlist' }
            ].map(status => (
              <button
                key={status.id}
                onClick={() => setStatusFilter(status.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  background: statusFilter === status.id ? 'var(--primary)' : 'rgba(30, 41, 59, 0.7)',
                  color: statusFilter === status.id ? 'white' : 'var(--text-muted)',
                  fontWeight: '600',
                  border: '1px solid var(--glass-border)',
                  whiteSpace: 'nowrap'
                }}
              >
                {status.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-card)', padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Min Rating:</span>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[...Array(10)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setRatingFilter(ratingFilter === i + 1 ? 0 : i + 1)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '2px',
                    cursor: 'pointer',
                    color: i < ratingFilter ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
                    transition: 'all 0.2s'
                  }}
                >
                  <Star fill={i < ratingFilter ? 'currentColor' : 'transparent'} size={18} />
                </button>
              ))}
            </div>
            {ratingFilter > 0 && (
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', minWidth: '40px' }}>{ratingFilter}+</span>
            )}
          </div>
        </div>

        <MediaGrid 
          items={library} 
          loading={loading}
          onDelete={deleteMedia} 
          onEdit={handleEditClick} 
        />

        <Pagination 
          pagination={pagination} 
          onPageChange={setCurrentPage} 
        />
      </main>

      <AddMediaModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveMedia}
        initialData={editingItem}
      />
    </div>
  );
};

export default Dashboard;
