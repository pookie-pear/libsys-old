import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, User, Calendar, PlusCircle, Trash2, CheckCircle, Shield, ShoppingCart, LogIn, LogOut, X, RefreshCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Pagination from '../components/Pagination';
import Skeleton from '../components/Skeleton';
import NotificationBell from '../components/NotificationBell';

const API_URL = '/api/irl-books';

const IrLibrary = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [books, setBooks] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminTab, setAdminTab] = useState('inventory'); // 'inventory' or 'loans'
  
  const [newTitle, setNewTitle] = useState('');
  const [newAuthor, setNewAuthor] = useState('');
  const [newCopies, setNewCopies] = useState(1);
  const [newImage, setNewImage] = useState('');
  const [newGenre, setNewGenre] = useState('');
  const [newIsbn, setNewIsbn] = useState('');

  // Modal for checkout
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutBookId, setCheckoutBookId] = useState(null);
  const [borrowerName, setBorrowerName] = useState(user ? (user.name || user.email.split('@')[0]) : '');
  const [borrowerEmail, setBorrowerEmail] = useState(user ? (user.email || '') : '');
  const [dueDate, setDueDate] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (!window.confirm('This will sync your local JSON data with the database and fetch missing images. Continue?')) return;
    setIsSyncing(true);
    try {
      const res = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Sync completed successfully!');
        fetchBooks(currentPage);
      } else {
        alert('Sync failed: ' + data.message);
      }
    } catch (err) {
      alert('Error syncing data');
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchBooks = async (page = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}?page=${page}&limit=30`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (data.items && data.pagination) {
        setBooks(data.items);
        setPagination(data.pagination);
      } else {
        setBooks(Array.isArray(data) ? data : []);
        setPagination(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks(currentPage);
  }, [currentPage]);

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (books.length >= 1000) {
      alert('IRL Library is full (1000 items). Oldest items will be automatically replaced.');
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
          totalCopies: newCopies,
          image: newImage,
          genre: newGenre,
          isbn: newIsbn
        })
      });
      await res.json();
      fetchBooks(currentPage);
      setNewTitle('');
      setNewAuthor('');
      setNewCopies(1);
      setNewImage('');
      setNewGenre('');
      setNewIsbn('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!user?.isAdmin) {
      alert('Only admins can delete books from the library.');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this book?')) return;
    try {
      await fetch(`${API_URL}/${id}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchBooks(currentPage);
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
      await res.json();
      fetchBooks(currentPage);
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
    setBorrowerName(user.name || user.email.split('@')[0]);
    setBorrowerEmail(user.email || '');
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
        userId: user.id, // Linked shared user ID
        userEmail: borrowerEmail || user.email,
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
      await res.json();
      fetchBooks(currentPage);
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
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', position: 'relative', zIndex: 100 }}>
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
          <button
            onClick={handleSync}
            disabled={isSyncing}
            title="Sync with local JSON data and fetch images"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px', borderRadius: '12px', 
              background: 'rgba(34, 211, 238, 0.1)',
              color: 'var(--accent-cyan)', border: '1px solid rgba(34, 211, 238, 0.2)',
              cursor: isSyncing ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
              opacity: isSyncing ? 0.5 : 1
            }}
          >
            <RefreshCcw size={18} className={isSyncing ? 'spin' : ''} />
            <style>{`
              .spin { animation: spin 2s linear infinite; }
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            `}</style>
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <NotificationBell />
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '6px 6px 6px 16px',
                borderRadius: '16px',
                border: '1px solid var(--glass-border)',
              }}>
              <div 
                onClick={() => navigate('/profile')}
                style={{ textAlign: 'right', cursor: 'pointer' }}
                title="View Profile"
              >
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
              <form onSubmit={handleAddBook} style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input 
                    type="text" placeholder="Book Title *" 
                    value={newTitle} onChange={(e) => setNewTitle(e.target.value)} 
                    style={{ ...inputStyle, flex: 2, minWidth: '200px' }} required
                  />
                  <input 
                    type="text" placeholder="Author *" 
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
                </div>
                
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input 
                    type="url" placeholder="Image URL (Optional)" 
                    value={newImage} onChange={(e) => setNewImage(e.target.value)} 
                    style={{ ...inputStyle, flex: 2, minWidth: '200px' }}
                  />
                  <input 
                    type="text" placeholder="Genre (Optional)" 
                    value={newGenre} onChange={(e) => setNewGenre(e.target.value)} 
                    style={{ ...inputStyle, flex: 1, minWidth: '150px' }}
                  />
                  <input 
                    type="text" placeholder="ISBN (Optional)" 
                    value={newIsbn} onChange={(e) => setNewIsbn(e.target.value)} 
                    style={{ ...inputStyle, flex: 1, minWidth: '150px' }}
                  />
                  <button type="submit" style={{ padding: '10px 24px', background: 'var(--primary)', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PlusCircle size={18} /> Add
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* Main Inventory Table */}
          <section className="glass-card" style={{ padding: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Book Title</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Author</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Copies</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '16px' }}><Skeleton width="150px" height="20px" /></td>
                      <td style={{ padding: '16px' }}><Skeleton width="100px" height="20px" /></td>
                      <td style={{ padding: '16px' }}><Skeleton width="50px" height="20px" /></td>
                      <td style={{ padding: '16px' }}><Skeleton width="80px" height="24px" borderRadius="4px" /></td>
                      <td style={{ padding: '16px', textAlign: 'right' }}><Skeleton width="120px" height="32px" borderRadius="8px" /></td>
                    </tr>
                  ))
                ) : books.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>No books found in inventory.</td></tr>
                ) : (
                  books.map(book => {
                    const available = book.totalCopies - (book.borrowers?.length || 0);
                    return (
                      <tr key={book.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontWeight: 'bold' }}>{book.title}</div>
                        </td>
                        <td style={{ padding: '16px' }}>{book.author}</td>
                        <td style={{ padding: '16px' }}>{available} / {book.totalCopies}</td>
                        <td style={{ padding: '16px' }}>
                          {available > 0 ? (
                            <span style={{ color: 'var(--accent-cyan)', fontSize: '0.8rem', background: 'rgba(34, 211, 238, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>Available</span>
                          ) : (
                            <span style={{ color: 'var(--accent-rose)', fontSize: '0.8rem', background: 'rgba(225, 29, 72, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>All Out</span>
                          )}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button 
                              onClick={() => openCheckoutModal(book.id)}
                              disabled={available <= 0}
                              style={{ padding: '6px 12px', fontSize: '0.85rem', background: 'var(--primary)', color: 'white', opacity: available <= 0 ? 0.5 : 1 }}
                            >
                              Checkout
                            </button>
                            {isAdmin && (
                              <button 
                                onClick={() => handleDelete(book.id)}
                                style={{ padding: '6px', background: 'rgba(225, 29, 72, 0.1)', color: 'var(--accent-rose)', border: '1px solid rgba(225, 29, 72, 0.2)' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </section>

          <Pagination 
            pagination={pagination} 
            onPageChange={setCurrentPage} 
          />
        </>
      ) : (
        /* Loans View */
        <section className="glass-card" style={{ padding: '24px' }}>
          <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ShoppingCart size={24} color="var(--accent-cyan)" /> Active Loans
          </h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Book</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Borrower</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Due Date</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {allBorrowedItems.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px' }}>No active loans.</td></tr>
              ) : (
                allBorrowedItems.map((item, idx) => (
                  <tr key={`${item.bookId}-${idx}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px' }}><strong>{item.title}</strong></td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 'bold' }}>{item.borrower.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.borrower.userEmail}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} />
                        {item.borrower.dueDate || 'No date'}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleReturn(item.bookId, item.borrower.id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--accent-cyan)', color: 'var(--bg-dark)', fontWeight: 'bold' }}
                      >
                        <CheckCircle size={14} /> Return
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>
      )}

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '400px', padding: '32px', position: 'relative' }}>
            <button onClick={() => setIsCheckoutModalOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', color: 'var(--text-muted)' }}>
              <X size={20} />
            </button>
            
            <h2 style={{ marginBottom: '24px' }}>Checkout Book</h2>
            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Borrower Name</label>
                <input 
                  type="text" required value={borrowerName} 
                  onChange={(e) => setBorrowerName(e.target.value)} 
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Borrower Email (Linked Account)</label>
                <input 
                  type="email" value={borrowerEmail} 
                  onChange={(e) => setBorrowerEmail(e.target.value)} 
                  placeholder="Linked account email"
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Due Date</label>
                <input 
                  type="date" required value={dueDate} 
                  onChange={(e) => setDueDate(e.target.value)} 
                  style={{ ...inputStyle, width: '100%' }}
                />
              </div>
              <button type="submit" style={{ marginTop: '12px', padding: '14px', background: 'var(--primary)', color: 'white', fontWeight: 'bold' }}>
                Confirm Checkout
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IrLibrary;
