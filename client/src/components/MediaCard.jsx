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
