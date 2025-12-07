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
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
         <button
            onClick={onAddClick}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '14px',
              background: 'var(--primary)',
              color: 'white',
              fontSize: '1rem',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
            }}
             onMouseEnter={(e) => {
                e.target.style.background = 'var(--primary-hover)';
            }}
            onMouseLeave={(e) => {
                e.target.style.background = 'var(--primary)';
            }}
          >
            <PlusCircle size={20} />
            Add Media
          </button>
      </div>
    </aside>
  );
};

export default Sidebar;

