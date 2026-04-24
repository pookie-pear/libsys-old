import { useState, useEffect } from 'react';

const API_URL = '/api/media';

export function useLibrary() {
  const [library, setLibrary] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLibrary = async (page = 1, limit = 30, filters = {}) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page,
        limit,
        ...filters
      });
      
      const res = await fetch(`${API_URL}?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      
      // Handle both old and new API format
      if (data.items && data.pagination) {
        setLibrary(data.items);
        setPagination(data.pagination);
      } else {
        setLibrary(data);
        setPagination(null);
      }
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  const refreshLibrary = () => {
    fetchLibrary();
  };

  const addMedia = async (media) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(media),
        credentials: 'include' // Important for cookie-based SSO
      });
      if (!res.ok) throw new Error('Failed to add media');
      // After adding, we should ideally refresh to get correct pagination
      fetchLibrary(1, 30); 
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const updateMedia = async (id, updates) => {
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updates),
        credentials: 'include' // Important for cookie-based SSO
      });
      if (!res.ok) throw new Error('Failed to update media');
      // Refresh current page
      if (pagination) {
        fetchLibrary(pagination.currentPage, pagination.limit);
      } else {
        fetchLibrary();
      }
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const deleteMedia = async (id) => {
    try {
       const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include' // Important for cookie-based SSO
      });
      if (!res.ok) throw new Error('Failed to delete media');
      // Refresh current page
      if (pagination) {
        fetchLibrary(pagination.currentPage, pagination.limit);
      } else {
        fetchLibrary();
      }
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };



  return {
    library,
    pagination,
    loading,
    error,
    addMedia,
    updateMedia,
    deleteMedia,
    refreshLibrary: fetchLibrary
  };
}
