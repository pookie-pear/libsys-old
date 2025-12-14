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
