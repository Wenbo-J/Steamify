import React, { createContext, useState, useContext, useEffect } from 'react';

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


  const signInWithGoogle = async (googleUser) => {
    try {
      // Extract user info from Google response
      const email = googleUser.email;
      const name = googleUser.name;
      const googleId = googleUser.sub || googleUser.id;
      const picture = googleUser.picture;
      
      // Call backend Google auth endpoint
      const { googleAuth } = await import('../services/api');
      const response = await googleAuth(email, name, picture, googleId);
      
      if (response.user_id) {
        const userData = { 
          user_id: response.user_id, 
          email, 
          name,
          picture: picture,
          steam_id: response.steam_id,
          spotify_id: response.spotify_id
        };
        // Generate a simple token (in production, backend should return JWT)
        const token = `google_${googleId}_${Date.now()}`;
        setToken(token);
        setUser(userData);
        localStorage.setItem('auth_token', token);
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


  const value = {
    user,
    token,
    loading,
    signInWithGoogle,
    signOut,
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

