import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Memoized checkAuthStatus to verify the Flask session
  // This is the core of the "User Strategy" - it asks the server "Who is this?"
  const checkAuthStatus = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/check-auth', {
        credentials: 'include', // Vital for Flask sessions to send the cookie
      });
      
      if (response.ok) {
        const data = await response.json();
        // Sets the user based on the server's session data
        setUser({ name: data.user });
      } else {
        // If 401 or other error, ensure local user state is cleared
        setUser(null); 
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      // Always stop the loading spinner, even if the request fails
      setLoading(false);
    }
  }, []);

  // 2. Run initial check when the app first loads or refreshes
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // 3. Login: Re-verifies the session with the server after a successful login attempt
  const login = async () => {
    setLoading(true); 
    try {
      await checkAuthStatus();
    } catch (err) {
      console.error("Login verification failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Logout: Clears UI immediately for a snappy feel and notifies the backend
  const logout = async () => {
    try {
      // Step 1: Clear the frontend state immediately for best UX
      setUser(null); 
      
      // Step 2: Tell the Flask backend to destroy the session cookie
      await fetch('http://localhost:5000/api/logout', {
        method: 'POST',
        credentials: 'include', // Crucial to identify which session to logout
      });
    } catch (error) {
      console.error("Logout request failed:", error);
    }
  };

  return (
    // Providing 'checkAuthStatus' allows other components to trigger a re-check if they hit a 401 error
    <AuthContext.Provider value={{ user, login, logout, loading, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);