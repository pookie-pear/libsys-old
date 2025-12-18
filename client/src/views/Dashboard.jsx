import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, LogIn, User, LogOut } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import MediaGrid from '../components/MediaGrid';
import AddMediaModal from '../components/AddMediaModal';
import { useLibrary } from '../hooks/useLibrary';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { library, loading, error, addMedia, updateMedia, deleteMedia } = useLibrary();
  const { user, logout } = useAuth();
  const [filter, setFilter] = useState('all'); 
  const [statusFilter, setStatusFilter] = useState('all'); // all, completed, in_progress, wishlist
  const [ratingFilter, setRatingFilter] = useState(0); // 0 to 10
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigate = useNavigate();

  const filteredLibrary = useMemo(() => {
    return library
      .filter(item => filter === 'all' || item.type === filter)
      .filter(item => statusFilter === 'all' || item.category === statusFilter)
      .filter(item => item.rating >= ratingFilter)
      .filter(item => item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      (item.genres && item.genres.some(g => g.toLowerCase().includes(searchQuery.toLowerCase()))))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [library, filter, statusFilter, ratingFilter, searchQuery]);

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
          border: '1px solid var(--glass-border)'
        }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
              {filter === 'all' ? 'Your Library' : filter.charAt(0).toUpperCase() + filter.slice(1) + 's'}
            </h1>
            <p style={{ color: 'var(--text-muted)' }}>
              {filteredLibrary.length} item{filteredLibrary.length !== 1 ? 's' : ''} found
            </p>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
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
                <div style={{ textAlign: 'right' }}>
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

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
