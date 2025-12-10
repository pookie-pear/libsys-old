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
