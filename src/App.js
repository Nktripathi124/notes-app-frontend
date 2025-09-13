import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, Plus, Edit3, Trash2, Crown, CheckCircle } from 'lucide-react';
const API_BASE_URL = 'https://notes-app-backend-brown.vercel.app/api'


const App = () => {
  const [user, setUser] = useState(null);
  const [tenant, setTenant] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login form state
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });

  // Note form state
  const [noteForm, setNoteForm] = useState({
    title: '',
    content: '',
    editing: false,
    editingId: null
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserInfo(token);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotes();
      fetchTenantInfo();
    }
  }, [user]);

  const apiCall = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || errorData.message || 'Request failed');
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    
    return null;
  };

  const fetchUserInfo = async (token) => {
    try {
      setLoading(true);
      const userData = await apiCall('/auth/me');
      setUser(userData);
    } catch (err) {
      console.error('Failed to fetch user info:', err);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantInfo = async () => {
    try {
      if (user) {
        const tenantData = await apiCall(`/tenants/${user.tenantId}`);
        setTenant(tenantData);
      }
    } catch (err) {
      console.error('Failed to fetch tenant info:', err);
    }
  };

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const notesData = await apiCall('/notes');
      setNotes(notesData);
    } catch (err) {
      setError('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: loginForm
      });
      
      localStorage.setItem('token', response.token);
      setUser(response.user);
      setSuccess('Logged in successfully!');
      setLoginForm({ email: '', password: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setTenant(null);
    setNotes([]);
    setSuccess('Logged out successfully!');
  };

  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      if (noteForm.editing) {
        await apiCall(`/notes/${noteForm.editingId}`, {
          method: 'PUT',
          body: {
            title: noteForm.title,
            content: noteForm.content
          }
        });
        setSuccess('Note updated successfully!');
      } else {
        await apiCall('/notes', {
          method: 'POST',
          body: {
            title: noteForm.title,
            content: noteForm.content
          }
        });
        setSuccess('Note created successfully!');
      }
      
      setNoteForm({ title: '', content: '', editing: false, editingId: null });
      fetchNotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditNote = (note) => {
    setNoteForm({
      title: note.title,
      content: note.content,
      editing: true,
      editingId: note.id
    });
  };

  const handleDeleteNote = async (noteId) => {
    if (!window.confirm('Are you sure you want to delete this note?')) return;
    
    try {
      setLoading(true);
      await apiCall(`/notes/${noteId}`, { method: 'DELETE' });
      setSuccess('Note deleted successfully!');
      fetchNotes();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeTenant = async () => {
    if (!user || user.role !== 'admin') return;
    
    try {
      setLoading(true);
      await apiCall(`/tenants/${user.tenantId}/upgrade`, { method: 'POST' });
      setSuccess('Tenant upgraded to Pro successfully!');
      fetchTenantInfo();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const predefinedAccounts = [
    { email: 'admin@acme.test', label: 'Acme Admin' },
    { email: 'user@acme.test', label: 'Acme User' },
    { email: 'admin@globex.test', label: 'Globex Admin' },
    { email: 'user@globex.test', label: 'Globex User' }
  ];

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <LogIn className="mx-auto h-12 w-12 text-blue-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Sign in to Notes App
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Multi-tenant SaaS Notes Application
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
              <button
                onClick={clearMessages}
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
              >
                ×
              </button>
            </div>
          )}

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{success}</span>
              <button
                onClick={clearMessages}
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
              >
                ×
              </button>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Test Accounts</span>
              </div>
            </div>

            <div className="mt-6 grid gap-2">
              {predefinedAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => setLoginForm({ email: account.email, password: 'password' })}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {account.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-center text-gray-500">
              All test accounts use password: <strong>password</strong>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">Notes App</h1>
              {tenant && (
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {tenant.name}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tenant.plan === 'pro' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tenant.plan === 'pro' ? (
                      <>
                        <Crown className="w-3 h-3 mr-1" />
                        Pro Plan
                      </>
                    ) : (
                      'Free Plan'
                    )}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>{user.email}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                }`}>
                  {user.role}
                </span>
              </div>
              
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Messages */}
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              <span className="block sm:inline">{error}</span>
              <button
                onClick={clearMessages}
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
              >
                ×
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              <CheckCircle className="inline w-4 h-4 mr-2" />
              <span className="block sm:inline">{success}</span>
              <button
                onClick={clearMessages}
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
              >
                ×
              </button>
            </div>
          )}

          {/* Upgrade Banner */}
          {tenant && tenant.plan === 'free' && notes.length >= tenant.noteLimit && user.role === 'admin' && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div className="flex">
                  <Crown className="h-5 w-5 text-yellow-400 mr-2" />
                  <p className="text-sm text-yellow-800">
                    You've reached your note limit ({tenant.noteLimit} notes). Upgrade to Pro for unlimited notes!
                  </p>
                </div>
                <button
                  onClick={handleUpgradeTenant}
                  disabled={loading}
                  className="ml-3 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-yellow-800 bg-yellow-200 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Create Note Form */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  {noteForm.editing ? 'Edit Note' : 'Create New Note'}
                </h3>
                
                <form onSubmit={handleCreateNote} className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      required
                      value={noteForm.title}
                      onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter note title"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                      Content
                    </label>
                    <textarea
                      id="content"
                      required
                      rows={4}
                      value={noteForm.content}
                      onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enter note content"
                    />
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {noteForm.editing ? 'Update Note' : 'Create Note'}
                    </button>
                    
                    {noteForm.editing && (
                      <button
                        type="button"
                        onClick={() => setNoteForm({ title: '', content: '', editing: false, editingId: null })}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Notes List */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    My Notes
                  </h3>
                  {tenant && (
                    <span className="text-sm text-gray-500">
                      {notes.length} / {tenant.plan === 'pro' ? '∞' : tenant.noteLimit} notes
                    </span>
                  )}
                </div>
                
                {loading && notes.length === 0 ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading notes...</p>
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No notes yet. Create your first note!</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {notes.map((note) => (
                      <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">
                              {note.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {note.content}
                            </p>
                            <p className="text-xs text-gray-400">
                              Created: {new Date(note.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => handleEditNote(note)}
                              className="p-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(note.id)}
                              className="p-1 text-red-600 hover:text-red-800 focus:outline-none"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Panel */}
          {user.role === 'admin' && (
            <div className="mt-8 bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                  Admin Panel
                </h3>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Tenant Information</h4>
                    {tenant && (
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Name:</strong> {tenant.name}</p>
                        <p><strong>ID:</strong> {tenant.id}</p>
                        <p><strong>Plan:</strong> {tenant.plan}</p>
                        <p><strong>Note Limit:</strong> {tenant.plan === 'pro' ? 'Unlimited' : tenant.noteLimit}</p>
                        <p><strong>Current Notes:</strong> {notes.length}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Actions</h4>
                    {tenant && tenant.plan === 'free' && (
                      <button
                        onClick={handleUpgradeTenant}
                        disabled={loading}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade to Pro
                      </button>
                    )}
                    {tenant && tenant.plan === 'pro' && (
                      <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Already on Pro Plan
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;