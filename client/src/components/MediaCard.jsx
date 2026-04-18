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
  const { title, type, genres, rating, review, image, category, author, year, pageCount, description, link } = item;
  const [copied, setCopied] = useState(false);
  
  const TypeIcon = typeIcons[type] || <Film size={16} />;
  const color = typeColors[type] || 'var(--primary)';
  
  const ytId = type === 'youtube' ? getYouTubeId(image) : null;
  const itemLink = link || (type === 'youtube' ? image : null);

  return (
    <div className="glass-card" style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      overflow: 'hidden', 
      position: 'relative',
      height: '420px' // Increased height for more info
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

        {/* Type Badge */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '12px',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
          padding: '4px 10px',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.75rem',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: 'white',
          border: `1px solid ${color}66`
        }}>
          {React.cloneElement(TypeIcon, { size: 12, color })}
          {type}
        </div>
      </div>

      {/* Content Area */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
            {itemLink ? (
              <a 
                href={itemLink} 
                target="_blank" 
                rel="noreferrer"
                style={{ fontSize: '1.1rem', margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-main)', textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-rose)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-main)'}
                title="Open Link"
              >
                <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{title}</span>
                <ExternalLink size={16} style={{ flexShrink: 0 }} />
              </a>
            ) : (
              <h3 style={{ fontSize: '1.1rem', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {title}
              </h3>
            )}
            
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(title);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              style={{ background: 'transparent', color: copied ? 'var(--accent-cyan)' : 'var(--text-muted)', border: 'none', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
              title="Copy Title"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--primary)', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.9rem' }}>
            {rating} <Star size={12} fill="currentColor" />
          </div>
        </div>

        {/* Extra Info (Author, Year, Pages) */}
        {(author || year || pageCount) && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
            {author && <span style={{ fontWeight: '600' }}>{author}</span>}
            {year && <span>• {year}</span>}
            {pageCount && <span>• {pageCount}</span>}
          </div>
        )}

        {/* Genres */}
        {genres && genres.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
            {genres.slice(0, 3).map((g, i) => (
              <span key={i} style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', background: 'rgba(34, 211, 238, 0.1)', padding: '1px 6px', borderRadius: '8px' }}>
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {description && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '12px' }}>
            {description}
          </p>
        )}

        {/* Review Snippet */}
        {review && (
          <p style={{ fontSize: '0.85rem', color: 'white', opacity: 0.9, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginTop: 'auto', borderLeft: '2px solid var(--primary)', paddingLeft: '8px', fontStyle: 'italic' }}>
            "{review}"
          </p>
        )}
      </div>

      {/* Inject hover styles */}
      <style>{`
        .glass-card:hover .action-btns { opacity: 1 !important; }
      `}</style>
    </div>
  );
};

export default MediaCard;
