import React, { useState } from 'react';
import { Star, BookOpen, Film, Tv, Video, MonitorPlay, Trash2, Edit2, Copy, Check, ExternalLink, Gamepad2 } from 'lucide-react';

const typeIcons = {
  book: <BookOpen size={16} />,
  movie: <Film size={16} />,
  series: <Tv size={16} />,
  short: <Video size={16} />,
  youtube: <MonitorPlay size={16} />,
  game: <Gamepad2 size={16} />,
};

const typeColors = {
  book: '#6366f1', // Indigo
  movie: '#f43f5e', // Rose
  series: '#8b5cf6', // Violet
  short: '#10b981', // Emerald
  youtube: '#ef4444', // Red
  game: '#f59e0b', // Amber
};

const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const MediaCard = ({ item, onDelete, onEdit }) => {
  const { title, type, genres, rating, review, image, category } = item;
  const [copied, setCopied] = useState(false);
  
  const TypeIcon = typeIcons[type] || <Film size={16} />;
  const color = typeColors[type] || 'var(--primary)';
  
  const ytId = type === 'youtube' ? getYouTubeId(image) : null;

  return (
    <div className="glass-card" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden', 
      position: 'relative',
      height: '380px'
    }}>
      {/* Action Buttons (visible on hover) */}
      <div 
        className="action-btns"
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          gap: '8px',
          zIndex: 10,
          opacity: 0,
          transition: 'all 0.2s',
        }}>
        <button 
          onClick={() => onEdit(item)}
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            color: 'var(--text-muted)',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <Edit2 size={16} />
        </button>

        <button 
          onClick={() => onDelete(item.id)}
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            color: 'var(--text-muted)',
            padding: '8px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-rose)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Image / Video Area */}
      <div style={{ height: '200px', width: '100%', position: 'relative', backgroundColor: 'var(--bg-dark)' }}>
        {type === 'youtube' && ytId ? (
          <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${ytId}`}
            title={title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        ) : image ? (
          <img 
            src={image} 
            alt={title} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        
        {/* Placeholder if no image, no video, or image error */}
        <div style={{ 
          display: (!image && type !== 'youtube') || (type === 'youtube' && !ytId) ? 'flex' : 'none', 
          width: '100%', 
          height: '100%', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: `linear-gradient(45deg, var(--bg-dark), ${color}33)`
        }}>
          {React.cloneElement(TypeIcon, { size: 48, color: 'rgba(255,255,255,0.2)' })}
        </div>

