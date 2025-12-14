import React, { useState, useEffect } from 'react';
import { X, Star } from 'lucide-react';

const AddMediaModal = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'movie',
    genres: '',
    rating: 0,
    review: '',
    image: '',
    category: 'completed'
  });
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        genres: Array.isArray(initialData.genres) ? initialData.genres.join(', ') : ''
      });
    } else {
      setFormData({ title: '', type: 'movie', genres: '', rating: 0, review: '', image: '', category: 'completed' });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const genresArray = formData.genres.split(',').map(g => g.trim()).filter(Boolean);
    onSave({
      ...formData,
      genres: genresArray,
    });
    onClose();
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-fetch YouTube title
    if (name === 'image' && formData.type === 'youtube' && value.includes('youtube.com') || value.includes('youtu.be')) {
      try {
        const res = await fetch(`http://localhost:5000/api/yt-title?url=${encodeURIComponent(value)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.title) {
            setFormData(prev => ({ ...prev, title: data.title }));
          }
        }
      } catch (err) {
        console.error('Failed to fetch YouTube title', err);
      }
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    color: 'white',
    fontSize: '0.95rem',
    marginBottom: '16px'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '6px',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-muted)'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative'
      }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem' }}>{initialData ? 'Edit Media' : 'Add to Library'}</h2>
          <button type="button" onClick={onClose} style={{ background: 'transparent', color: 'var(--text-muted)' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input required type="text" name="title" value={formData.title} onChange={handleChange} style={inputStyle} placeholder="Enter title" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Type</label>
              <select name="type" value={formData.type} onChange={handleChange} style={inputStyle}>
                <option value="movie">Movie</option>
                <option value="series">TV Series</option>
                <option value="book">Book</option>
                <option value="short">Short Film</option>
                <option value="youtube">YouTube</option>
                <option value="game">Game</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select name="category" value={formData.category} onChange={handleChange} style={inputStyle}>
                <option value="completed">Completed</option>
                <option value="in_progress">In Progress</option>
                <option value="wishlist">Wishlist</option>
              </select>
            </div>
          </div>

          <div>
             <label style={labelStyle}>Rating (Personal)</label>
             <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
               {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                 <Star
                   key={star}
                   size={24}
                   onClick={() => setFormData({ ...formData, rating: star })}
                   onMouseEnter={() => setHoverRating(star)}
                   onMouseLeave={() => setHoverRating(0)}
                   fill={(hoverRating || formData.rating) >= star ? 'var(--primary)' : 'transparent'}
                   color={(hoverRating || formData.rating) >= star ? 'var(--primary)' : 'var(--text-muted)'}
                   style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                 />
               ))}
               <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>{formData.rating}/10</span>
             </div>
          </div>

          <div>
            <label style={labelStyle}>Genres (comma separated)</label>
            <input type="text" name="genres" value={formData.genres} onChange={handleChange} style={inputStyle} placeholder="Sci-Fi, Thriller, Action" />
          </div>

          <div>
            <label style={labelStyle}>Image URL or YouTube Link (Optional)</label>
            <input type="url" name="image" value={formData.image} onChange={handleChange} style={inputStyle} placeholder="https://..." />
          </div>

          <div>
            <label style={labelStyle}>Review / Notes</label>
            <textarea name="review" value={formData.review} onChange={handleChange} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} placeholder="What did you think?" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--glass-border)' }}>
              Cancel
            </button>
            <button type="submit" style={{ padding: '10px 24px', background: 'var(--primary)', color: 'white', fontWeight: 'bold' }}>
              {initialData ? 'Save Changes' : 'Save Media'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMediaModal;
