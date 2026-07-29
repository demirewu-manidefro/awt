import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * Handles the redirect from Google OAuth callback.
 * The backend redirects here with ?token=<accessToken>
 */
export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      toast.error('Authentication failed.');
      navigate('/login', { replace: true });
      return;
    }
    // Store token in memory (same as normal login)
    window.__accessToken = token;
    // Refresh user info from /auth/me
    refreshUser()
      .then(() => {
        toast.success('Signed in with Google!');
        navigate('/dashboard', { replace: true });
      })
      .catch(() => {
        toast.error('Could not fetch user info.');
        navigate('/login', { replace: true });
      });
  }, []);

  return (
    <div className="page-loader">
      <div className="spinner" />
      <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '14px' }}>
        Completing sign-in…
      </p>
    </div>
  );
}
