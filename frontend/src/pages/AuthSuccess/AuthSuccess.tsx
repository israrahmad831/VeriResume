import { useEffect } from 'react';

const AuthSuccess = () => {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    
    if (error) {
      window.location.replace('/login?oauth_error=' + encodeURIComponent(error));
      return;
    }
    
    if (token) {
      localStorage.setItem('token', token);
      const stored = localStorage.getItem('token');
      if (stored) {
        setTimeout(() => {
          window.location.replace('/');
        }, 100);
      } else {
        window.location.replace('/login?oauth_error=storage_failed');
      }
    } else {
      window.location.replace('/login');
    }
  }, []);

  return <div>Processing authentication...</div>;
};

export default AuthSuccess;
