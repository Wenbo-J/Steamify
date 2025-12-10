import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

const Login = () => {
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      // Decode the JWT token to get user info
      const base64Url = credentialResponse.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const googleUser = JSON.parse(jsonPayload);
      setLoading(true);
      setError('');
      const result = await signInWithGoogle(googleUser);
      
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError(result.error || 'Google sign in failed');
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign in was cancelled or failed');
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="glass-panel p-8 md:p-12 max-w-md w-full animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-black mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#1DB954] via-[#EDEDED] to-[#53C8F3]">
            Welcome to Steamify
          </h1>
          <p className="text-[#A5A5A5] text-sm md:text-base">
            Sign in with Google to start creating playlists
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Google Sign In - Only authentication method */}
        {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          <div className="mb-6">
            {loading && (
              <div className="mb-4 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              size="large"
              text="signin_with"
              shape="rectangular"
              logo_alignment="left"
              width="100%"
            />
          </div>
        ) : (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm">
            Google OAuth is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.
          </div>
        )}

        <div className="mt-6 text-center text-sm text-[#A5A5A5]">
          <p>After signing in, you can optionally link your Steam and Spotify accounts in your profile.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
