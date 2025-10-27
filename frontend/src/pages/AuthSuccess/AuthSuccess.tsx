import { useEffect } from 'react';

const AuthSuccess = () => {
  useEffect(() => {
    console.log('[AuthSuccess] Component mounted, checking query params');
    console.log('[AuthSuccess] Current URL:', window.location.href);
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    console.log('[AuthSuccess] token:', token ? `${token.substring(0, 20)}...` : 'null', 'error:', error);
    
    if (error) {
      console.error('[AuthSuccess] OAuth error detected:', error);
      window.location.replace('/login?oauth_error=' + encodeURIComponent(error));
      return;
    }
    
    if (token) {
      console.log('[AuthSuccess] Token found, storing in localStorage');
      localStorage.setItem('token', token);
      const stored = localStorage.getItem('token');
      console.log('[AuthSuccess] Verification - token stored:', stored ? 'YES' : 'NO');
      if (stored) {
        console.log('[AuthSuccess] Token confirmed stored, redirecting to / after 100ms');
        setTimeout(() => {
          console.log('[AuthSuccess] Redirecting now to /');
          window.location.replace('/');
        }, 100);
      } else {
        console.error('[AuthSuccess] ERROR: Token was NOT stored in localStorage!');
        window.location.replace('/login?oauth_error=storage_failed');
      }
    } else {
      console.log('[AuthSuccess] No token or error found, redirecting to /login');
      window.location.replace('/login');
    }
  }, []); // Empty deps - run only once on mount

  return <div>Processing authentication...</div>;
};

export default AuthSuccess;
