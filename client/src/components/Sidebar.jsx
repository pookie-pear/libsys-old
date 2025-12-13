import React from 'react';
import { 
  Library, 
  BookOpen, 
  Film, 
  Tv, 
  Video, 
  MonitorPlay,
  PlusCircle,
  Gamepad2,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ filter, setFilter, onAddClick }) => {
  const { user, logout } = useAuth();
  const navItems = [
    { id: 'all', label: 'All Media', icon: Library },
    { id: 'book', label: 'Books', icon: BookOpen },
    { id: 'movie', label: 'Movies', icon: Film },
    { id: 'series', label: 'TV Series', icon: Tv },
    { id: 'game', label: 'Games', icon: Gamepad2 },
    { id: 'short', label: 'Short Films', icon: Video },
    { id: 'youtube', label: 'YouTube', icon: MonitorPlay },
  ];

  return (
    <aside className="glass-card" style={{ width: '260px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', height: 'fit-content' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'var(--primary)', padding: '8px', borderRadius: '12px' }}>
          <Library size={24} color="white" />
        </div>
        <h2 style={{ fontSize: '1.5rem', color: 'white' }}>OmniShelf</h2>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = filter === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-muted)',
                textAlign: 'left',
                fontSize: '1rem',
                fontWeight: isActive ? '600' : '400',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.target.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.target.style.color = 'var(--text-main)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = 'var(--text-muted)';
                }
              }}
            >
