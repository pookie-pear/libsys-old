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
