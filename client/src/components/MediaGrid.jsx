import React from 'react';
import MediaCard from './MediaCard';

const MediaGrid = ({ items, onDelete, onEdit }) => {
  if (!items || items.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        color: 'var(--text-muted)',
        textAlign: 'center'
      }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '8px', color: 'var(--text-main)' }}>Your shelf is empty</h3>
        <p>Click "Add Media" to start tracking your favorites.</p>
      </div>
    );
  }

  return (
    <div className="masonry-grid" style={{
      columnCount: 'auto',
      columnWidth: '280px',
      columnGap: '24px',
      padding: '24px 0',
      width: '100%'
    }}>
      {items.map(item => (
        <MediaCard key={item.id} item={item} onDelete={onDelete} onEdit={onEdit} />
      ))}
    </div>
  );
};

export default MediaGrid;
