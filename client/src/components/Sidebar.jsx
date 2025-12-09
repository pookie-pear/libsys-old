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
