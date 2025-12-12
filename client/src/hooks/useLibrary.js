import { useState, useEffect } from 'react';

const API_URL = 'http://localhost:5000/api/media';

export function useLibrary() {
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLibrary = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setLibrary(data);
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
