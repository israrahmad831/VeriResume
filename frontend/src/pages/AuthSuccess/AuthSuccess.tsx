import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');
    if (error) {
      console.error('OAuth error:', error);
      // Redirect to login page with error
      // preserve error in query so login page can display it if desired
      window.location.replace('/login?oauth_error=' + encodeURIComponent(error));
      return;
    }
    if (token) {
      localStorage.setItem('token', token);
      // Use a full-page redirect so the app loads with the token present
      window.location.replace('/');
    } else {
      window.location.replace('/login');
    }
  }, [navigate]);

  return <div>Processing authentication...</div>;
};

export default AuthSuccess;
