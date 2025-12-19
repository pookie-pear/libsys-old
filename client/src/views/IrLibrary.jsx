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
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '6px 6px 6px 16px',
              borderRadius: '16px',
              border: '1px solid var(--glass-border)',
            }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.9rem', fontWeight: '800', margin: 0, color: 'white', letterSpacing: '0.02em' }}>
                  {user.name || user.email.split('@')[0]}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, opacity: 0.8 }}>
                  {user.email}
                </p>
              </div>

              <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 4px' }}></div>
              
              {isAdmin && (
                <div style={{ display: 'flex', background: 'var(--bg-dark)', borderRadius: '12px', padding: '4px', border: '1px solid var(--glass-border)' }}>
                  <button
                    onClick={() => setAdminTab('inventory')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold',
                      background: adminTab === 'inventory' ? 'var(--primary)' : 'transparent',
                      color: adminTab === 'inventory' ? 'white' : 'var(--text-muted)',
                      border: 'none', transition: 'all 0.2s'
                    }}
                  >
                    <Book size={18} /> Inventory
                  </button>
                  <button
                    onClick={() => setAdminTab('loans')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold',
                      background: adminTab === 'loans' ? 'var(--accent-cyan)' : 'transparent',
                      color: adminTab === 'loans' ? 'var(--bg-dark)' : 'var(--text-muted)',
                      border: 'none', transition: 'all 0.2s'
                    }}
                  >
                    <ShoppingCart size={18} /> 
                    Loans ({allBorrowedItems.length})
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setIsAdmin(!isAdmin);
                  setAdminTab('inventory');
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold',
                  background: isAdmin ? 'var(--accent-rose)' : 'var(--bg-card)',
                  color: 'white', border: '1px solid var(--glass-border)',
                  transition: 'all 0.2s'
                }}
              >
                <Shield size={20} />
                {isAdmin ? 'Exit Admin Mode' : 'Enter Admin Mode'}
              </button>

              <button 
                onClick={logout}
                title="Logout"
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: '40px', height: '40px', borderRadius: '12px', 
                  background: 'rgba(225, 29, 72, 0.1)',
                  color: 'var(--accent-rose)', border: '1px solid rgba(225, 29, 72, 0.2)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 20px', borderRadius: '12px', background: 'var(--primary)',
                color: 'white', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
              }}
            >
              <LogIn size={18} /> Login
            </button>
          )}
        </div>
      </header>

      {/* Conditionally Render Main Content vs Loans View */}
      {(!isAdmin || adminTab === 'inventory') ? (
        <>
          {/* Admin Add New Book Form */}
          {isAdmin && (
            <section className="glass-card" style={{ padding: '24px', marginBottom: '24px', borderLeft: '4px solid var(--accent-rose)' }}>
              <h2 style={{ marginBottom: '16px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Book size={20} color="var(--primary)" /> Add to Inventory
              </h2>
              <form onSubmit={handleAddBook} style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input 
                  type="text" placeholder="Book Title" 
                  value={newTitle} onChange={(e) => setNewTitle(e.target.value)} 
                  style={{ ...inputStyle, flex: 2, minWidth: '200px' }} required
                />
                <input 
                  type="text" placeholder="Author" 
                  value={newAuthor} onChange={(e) => setNewAuthor(e.target.value)} 
                  style={{ ...inputStyle, flex: 1, minWidth: '150px' }} required
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '0 12px', borderRadius: '8px', border: '1px solid var(--glass-border)'}}>
                  <span style={{color: 'var(--text-muted)'}}>Copies:</span>
                  <input 
                    type="number" min="1"
                    value={newCopies} onChange={(e) => setNewCopies(parseInt(e.target.value) || 1)} 
                    style={{ ...inputStyle, width: '70px', border: 'none', background: 'transparent' }} required
                  />
                </div>
                <button type="submit" style={{ padding: '10px 24px', background: 'var(--primary)', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <PlusCircle size={18} /> Add
                </button>
              </form>
            </section>
          )}

          {/* Main Inventory Table */}
          <section className="glass-card" style={{ padding: '24px' }}>
