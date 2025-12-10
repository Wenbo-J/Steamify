import React, { createContext, useState, useContext, useEffect } from 'react';
import { signup, login, changePassword } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth on mount
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const signIn = async (email, password) => {
    try {
      const response = await login(email, password);
      if (response.token && response.user_id) {
        const userData = { user_id: response.user_id, email };
        setToken(response.token);
        setUser(userData);
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: error.message || 'Sign in failed' };
    }
  };

  const signUp = async (email, password) => {
    try {
      const response = await signup(email, password);
      if (response.token && response.user_id) {
        const userData = { user_id: response.user_id, email };
        setToken(response.token);
        setUser(userData);
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, error: 'Sign up failed' };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error.message || 'Sign up failed' };
    }
  };

  const signInWithGoogle = async (googleUser) => {
    try {
      // Extract user info from Google response
      const email = googleUser.email;
      const name = googleUser.name;
      const googleId = googleUser.sub || googleUser.id;
      
      // For now, we'll use email as the identifier
      // In production, you'd want to handle OAuth properly with backend
      const response = await signup(email, `google_${googleId}`); // Temporary password
      
      if (response.token && response.user_id) {
        const userData = { 
          user_id: response.user_id, 
          email, 
          name,
          picture: googleUser.picture 
        };
        setToken(response.token);
        setUser(userData);
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, error: 'Google sign in failed' };
    } catch (error) {
      console.error('Google sign in error:', error);
      return { success: false, error: error.message || 'Google sign in failed' };
    }
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  };

  const updatePassword = async (oldPassword, newPassword) => {
    try {
      if (!user) throw new Error('Not authenticated');
      const response = await changePassword(user.user_id, oldPassword, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Password update error:', error);
      return { success: false, error: error.message || 'Password update failed' };
    }
  };

  const value = {
    user,
    token,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updatePassword,
    isAuthenticated: !!user && !!token
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

