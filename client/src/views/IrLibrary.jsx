import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, User, Calendar, PlusCircle, Trash2, CheckCircle, Shield, ShoppingCart, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api/irl-books';

const IrLibrary = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState('inventory'); // 'inventory' or 'loans'
  
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCopies, setNewCopies] = useState(1);

  // Modal for checkout
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutBookId, setCheckoutBookId] = useState(null);
  const [borrowerName, setBorrowerName] = useState('');
  const [dueDate, setDueDate] = useState('');

  const fetchBooks = async () => {
    try {
      const res = await fetch(API_URL, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      setBooks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!newTitle.trim() || !newAuthor.trim() || newCopies < 1) return;

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          title: newTitle, 
          author: newAuthor,
          totalCopies: newCopies 
        })
      });
      const data = await res.json();
      setBooks([...books, data]);
      setNewTitle('');
      setNewAuthor('');
      setNewCopies(1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await fetch(`${API_URL}/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setBooks(books.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturn = async (bookId, borrowerId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    const book = books.find(b => b.id === bookId);
    if (!book) return;

    try {
      const updatedBookData = {
        ...book,
        borrowers: book.borrowers.filter(b => b.id !== borrowerId)
      };

      const res = await fetch(`${API_URL}/${bookId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedBookData)
      });
      const updated = await res.json();
      setBooks(books.map(b => b.id === bookId ? updated : b));
    } catch (err) {
      console.error(err);
    }
  };

  const openCheckoutModal = (id) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setCheckoutBookId(id);
    setBorrowerName('');
    setDueDate('');
    setIsCheckoutModalOpen(true);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    const book = books.find(b => b.id === checkoutBookId);
    if (!book) return;

    // Optional validation to prevent over-borrowing in case
    const available = book.totalCopies - (book.borrowers?.length || 0);
    if (available <= 0) return;

    try {
      const newBorrowerItem = {
        id: Date.now().toString(),
        name: borrowerName,
        dueDate: dueDate
      };

      const updatedBookData = {
        ...book,
        borrowers: [...(book.borrowers || []), newBorrowerItem]
      };

      const res = await fetch(`${API_URL}/${checkoutBookId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedBookData)
      });
      const updated = await res.json();
      setBooks(books.map(b => b.id === checkoutBookId ? updated : b));
      setIsCheckoutModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };


  const inputStyle = {
    padding: '10px',
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    color: 'white',
    outline: 'none',
  };

  // Get flat list of all borrowed books across inventory
  const allBorrowedItems = books.reduce((acc, book) => {
    if (book.borrowers && book.borrowers.length > 0) {
      book.borrowers.forEach(borrower => {
        acc.push({ bookId: book.id, title: book.title, borrower });
      });
    }
    return acc;
  }, []);

  return (
    <div style={{ minHeight: '100vh', padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <button 
            onClick={() => navigate('/')}
            style={{ background: 'var(--bg-card)', padding: '12px', borderRadius: '50%', color: 'white', border: '1px solid var(--glass-border)' }}
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 style={{ fontSize: '2.5rem', margin: 0 }}>IRL Library System</h1>
            <p style={{ color: 'var(--text-muted)' }}>Track physical books loaned to friends.</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {user ? (
