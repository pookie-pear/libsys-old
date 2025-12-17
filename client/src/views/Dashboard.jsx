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
