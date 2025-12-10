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
