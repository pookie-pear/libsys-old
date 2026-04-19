import { useState, useEffect } from 'react';

const API_URL = '/api/media';

export function useLibrary() {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLibrary = async (pageNum = 1, filters = {}) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);

      const { search = '', type = 'all', status = 'all' } = filters;
      const query = new URLSearchParams({
        page: pageNum,
        limit: 24, // Optimized chunk size
        search,
        type,
        status
      }).toString();

      const res = await fetch(`${API_URL}?${query}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();

      if (pageNum === 1) {
        setLibrary(data.items);
      } else {
        setLibrary(prev => [...prev, ...data.items]);
      }

      setTotal(data.total);
      setHasMore(data.page < data.pages);
      setPage(data.page);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = (filters) => {
    if (!loadingMore && hasMore) {
      fetchLibrary(page + 1, filters);
    }
  };

  const refreshLibrary = (filters) => {
    setPage(1);
    fetchLibrary(1, filters);
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
      const newMedia = await res.json();
      setLibrary([...library, newMedia]);
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
      const updatedMedia = await res.json();
      setLibrary(library.map(item => item.id === id ? updatedMedia : item));
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
      setLibrary(library.filter(item => item.id !== id));
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };



  return {
    library,
    loading,
    error,
    addMedia,
    updateMedia,
    deleteMedia,
    refreshLibrary: fetchLibrary
  };
}
