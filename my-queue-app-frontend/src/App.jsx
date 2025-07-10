import React, { useEffect, useState } from 'react';
import { Moon, Sun, Users, Plus, LogOut, UserPlus, LogIn, Trash2, Play, AlertCircle } from 'lucide-react';

export default function App() {
  const [queues, setQueues] = useState([]);
  const [selectedQueue, setSelectedQueue] = useState(null);
  const [selectedQueueName, setSelectedQueueName] = useState('');
  const [tokens, setTokens] = useState([]);
  const [queueName, setQueueName] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const backend = 'https://queue-management-backend-jltg.onrender.com';

  // Save theme preference
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  // Simple fetch wrapper for API calls
  const apiCall = async (url, options = {}) => {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API call failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  };

  const showSuccess = (message) => {
    setSuccess(message);
    setError('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const showError = (message) => {
    setError(message);
    setSuccess('');
    setTimeout(() => setError(''), 5000);
  };

  const handleLogin = async () => {
    if (!username || !password) {
      showError('Please enter both username and password');
      return;
    }

    setLoading(true);
    
    try {
      const result = await apiCall(`${backend}/users/login`, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (result.success) {
        setIsLoggedIn(true);
        showSuccess('Login successful!');
        await fetchQueues();
      }
    } catch (error) {
      showError(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!username || !password) {
      showError('Please enter both username and password');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    
    try {
      const result = await apiCall(`${backend}/users/register`, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (result.success) {
        showSuccess('Account created successfully! Please log in.');
        setIsSignup(false);
        setUsername('');
        setPassword('');
      }
    } catch (error) {
      showError(error.message || 'Registration failed. Username may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQueues = async () => {
    try {
      const result = await apiCall(`${backend}/queues`);
      setQueues(result);
    } catch (error) {
      showError('Failed to fetch queues');
    }
  };

  const createQueue = async () => {
    if (!queueName.trim()) {
      showError('Please enter a queue name');
      return;
    }

    try {
      const result = await apiCall(`${backend}/queues`, {
        method: 'POST',
        body: JSON.stringify({ name: queueName }),
      });

      if (result.success) {
        setQueueName('');
        showSuccess('Queue created successfully!');
        await fetchQueues();
      }
    } catch (error) {
      showError(error.message || 'Failed to create queue');
    }
  };

  const loadTokens = async (queueId, queueName) => {
    setSelectedQueue(queueId);
    setSelectedQueueName(queueName);
    try {
      const result = await apiCall(`${backend}/queues/${queueId}/tokens`);
      setTokens(result);
    } catch (error) {
      showError('Failed to load tokens');
    }
  };

  const addToken = async () => {
    if (!tokenName.trim()) {
      showError('Please enter a person name');
      return;
    }

    try {
      const result = await apiCall(`${backend}/queues/${selectedQueue}/tokens`, {
        method: 'POST',
        body: JSON.stringify({ name: tokenName }),
      });

      if (result.success) {
        setTokenName('');
        showSuccess('Token added successfully!');
        await loadTokens(selectedQueue, selectedQueueName);
      }
    } catch (error) {
      showError(error.message || 'Failed to add token');
    }
  };

  const assignTop = async () => {
    try {
      const result = await apiCall(`${backend}/queues/${selectedQueue}/assign`, {
        method: 'PUT',
      });

      if (result.success) {
        showSuccess('Token assigned successfully!');
        await loadTokens(selectedQueue, selectedQueueName);
      }
    } catch (error) {
      showError(error.message || 'No waiting tokens to assign');
    }
  };

  const cancelToken = async (tokenId) => {
    try {
      const result = await apiCall(`${backend}/tokens/${tokenId}`, {
        method: 'DELETE',
      });

      if (result.success) {
        showSuccess('Token cancelled successfully!');
        await loadTokens(selectedQueue, selectedQueueName);
      }
    } catch (error) {
      showError(error.message || 'Failed to cancel token');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSelectedQueue(null);
    setSelectedQueueName('');
    setTokens([]);
    setUsername('');
    setPassword('');
    setError('');
    setSuccess('');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const themeClasses = isDarkMode 
    ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white'
    : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900';

  const cardClasses = isDarkMode
    ? 'bg-gray-800/50 backdrop-blur-sm border-gray-700'
    : 'bg-white/70 backdrop-blur-sm border-gray-200';

  const inputClasses = isDarkMode
    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
    : 'bg-white/50 border-gray-300 text-gray-900 placeholder-gray-500';

  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned': return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'cancelled': return 'border-red-500 bg-red-50 dark:bg-red-900/20 opacity-60';
      default: return isDarkMode ? 'border-gray-600' : 'border-gray-300';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'assigned': return 'bg-green-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  if (!isLoggedIn) {
    return (
      <div className={`min-h-screen ${themeClasses} flex items-center justify-center p-4`}>
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-full ${isDarkMode ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-gray-800 hover:bg-gray-700'} transition-colors`}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-gray-900" /> : <Moon className="w-5 h-5 text-white" />}
          </button>
        </div>
        
        <div className={`${cardClasses} border rounded-xl p-8 max-w-md w-full shadow-xl`}>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {isSignup ? 'Join our queue management system' : 'Sign in to manage your queues'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <div className="space-y-4">
            <input
              placeholder="Username"
              className={`${inputClasses} border rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
              value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (isSignup ? handleSignup() : handleLogin())}
            />
            <input
              placeholder="Password"
              type="password"
              className={`${inputClasses} border rounded-lg p-3 w-full focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && (isSignup ? handleSignup() : handleLogin())}
            />
            
            {isSignup ? (
              <div className="space-y-3">
                <button
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg w-full font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50"
                  onClick={handleSignup}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Create Account
                    </>
                  )}
                </button>
                <button
                  className={`${isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'} underline w-full py-2 transition-colors`}
                  onClick={() => setIsSignup(false)}
                >
                  Already have an account? Sign In
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <button
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg w-full font-semibold transition-all transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50"
                  onClick={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </>
                  )}
                </button>
                <button
                  className={`${isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'} underline w-full py-2 transition-colors`}
                  onClick={() => setIsSignup(true)}
                >
                  Need an account? Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses} p-4`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Queue Management
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${isDarkMode ? 'bg-yellow-500 hover:bg-yellow-400' : 'bg-gray-800 hover:bg-gray-700'} transition-colors`}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-gray-900" /> : <Moon className="w-5 h-5 text-white" />}
            </button>
            
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-4 py-2 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Create Queue Section */}
        <div className={`${cardClasses} border rounded-xl p-6 mb-8 shadow-lg`}>
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-6 h-6 text-purple-500" />
            Create New Queue
          </h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter queue name..."
              value={queueName}
              onChange={(e) => setQueueName(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && createQueue()}
              className={`${inputClasses} border rounded-lg p-3 flex-1 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
            />
            <button
              onClick={createQueue}
              className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Queue
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Queues List */}
          <div className={`${cardClasses} border rounded-xl p-6 shadow-lg`}>
            <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-green-500" />
              Active Queues ({queues.length})
            </h2>
            <div className="space-y-3">
              {queues.length === 0 ? (
                <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  No queues created yet. Create your first queue above!
                </p>
              ) : (
                queues.map((q) => (
                  <div
                    key={q.id}
                    className={`border rounded-lg p-4 flex justify-between items-center transition-all hover:shadow-md ${
                      selectedQueue === q.id 
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
                        : `${isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}`
                    }`}
                  >
                    <div>
                      <h3 className="font-semibold text-lg">{q.name}</h3>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Queue ID: {q.id}
                      </p>
                    </div>
                    <button
                      onClick={() => loadTokens(q.id, q.name)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedQueue === q.id
                          ? 'bg-purple-500 text-white'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white'
                      }`}
                    >
                      {selectedQueue === q.id ? 'Selected' : 'Open'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Queue Details */}
          <div className={`${cardClasses} border rounded-xl p-6 shadow-lg`}>
            {selectedQueue ? (
              <>
                <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <Play className="w-6 h-6 text-orange-500" />
                  {selectedQueueName}
                </h2>

                {/* Add Token */}
                <div className="mb-6">
                  <div className="flex gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Enter person name..."
                      value={tokenName}
                      onChange={(e) => setTokenName(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addToken()}
                      className={`${inputClasses} border rounded-lg p-3 flex-1 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                    />
                    <button
                      onClick={addToken}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add
                    </button>
                  </div>

                  <button
                    onClick={assignTop}
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 flex items-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    Assign Next Token
                  </button>
                </div>

                {/* Tokens List */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg mb-4">Queue Tokens ({tokens.length})</h3>
                  {tokens.length === 0 ? (
                    <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      No tokens in this queue yet.
                    </p>
                  ) : (
                    tokens.map((t, index) => (
                      <div
                        key={t.id}
                        className={`border rounded-lg p-4 flex justify-between items-center transition-all ${getStatusColor(t.status)}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getStatusBadgeColor(t.status)}`}>
                            {index + 1}
                          </div>
                          <div>
                            <h4 className="font-semibold">{t.name}</h4>
                            <p className={`text-sm capitalize ${
                              t.status === 'assigned' ? 'text-green-600' : 
                              t.status === 'cancelled' ? 'text-red-600' : 
                              isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              {t.status}
                            </p>
                          </div>
                        </div>
                        {t.status === 'waiting' && (
                          <button
                            onClick={() => cancelToken(t.id)}
                            className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Cancel Token"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <Users className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No Queue Selected
                </h3>
                <p className={`${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  Select a queue from the left to view and manage tokens
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
