import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Home from './pages/Home';
import GameTracks from './pages/GameTracks';
import BrowseMusic from './pages/BrowseMusic';
import UserPlaylists from './pages/UserPlaylists';
import Analytics from './pages/Analytics';
import Login from './pages/Login';

// Google OAuth Client ID - Replace with your actual client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Log for debugging
console.log('Google Client ID loaded:', GOOGLE_CLIENT_ID ? 'Yes' : 'No');
if (GOOGLE_CLIENT_ID) {
  console.log('Google Client ID (first 20 chars):', GOOGLE_CLIENT_ID.substring(0, 20) + '...');
}

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" state={{ from: { pathname: window.location.pathname } }} />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/tracks/:gameId" element={<GameTracks />} />
      <Route path="/browse" element={<BrowseMusic />} />
      <Route path="/login" element={<Login />} />
      <Route path="/playlists" element={<UserPlaylists />} />
      <Route path="/analytics" element={<Analytics />} />
    </Routes>
  );
}

function App() {
  console.log('Steamify: App component rendering, Google Client ID:', GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
  
  // Wrap with GoogleOAuthProvider only if client ID is available
  const appContent = (
    <AuthProvider>
    <Router>
      <Layout>
          <AppRoutes />
      </Layout>
    </Router>
    </AuthProvider>
  );

  return (
    <ErrorBoundary>
      {GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          {appContent}
        </GoogleOAuthProvider>
      ) : (
        appContent
      )}
    </ErrorBoundary>
  );
}

export default App;
