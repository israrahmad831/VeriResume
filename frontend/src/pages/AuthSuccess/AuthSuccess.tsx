import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type UserType = { id: string; email: string; name?: string; role?: string } | null;

const AuthSuccess = () => {
  const [role, setRole] = useState<'jobseeker' | 'hr' | null>(null);
  const [user, setUser] = useState<UserType>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get('token');
    const errorParam = params.get('error');
    if (errorParam) {
      setError(errorParam);
      setLoading(false);
      return;
    }
    if (tokenParam) {
      setToken(tokenParam);
      localStorage.setItem('token', tokenParam);
      // Fetch user info from backend
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${tokenParam}` }
      })
        .then(res => res.json())
        .then(data => {
          setUser(data.user);
          if (data.user?.role && ["jobseeker", "hr", "admin"].includes(data.user.role)) {
            // Redirect to dashboard
            if (data.user.role === "hr") navigate("/dashboardhr");
            else if (data.user.role === "admin") navigate("/dashboardadmin");
            else navigate("/dashboardjob");
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    } else {
      setError("No token");
      setLoading(false);
    }
  }, [navigate]);

  const handleRoleSelect = async () => {
    if (!role || !token) return;
    setLoading(true);
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiBase}/auth/set-role`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ role })
    });
    const data = await res.json();
    if (res.ok) {
      if (role === "hr") navigate("/dashboardhr");
      else navigate("/dashboardjob");
    } else {
      setError(data.message || "Failed to set role");
      setLoading(false);
    }
  };

  if (loading) return <div>Processing authentication...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
  if (!user || user.role) return null;

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto' }}>
      <h2>Select your role</h2>
      <div>
        <label>
          <input type="radio" name="role" value="jobseeker" checked={role === 'jobseeker'} onChange={() => setRole('jobseeker')} /> Job Seeker
        </label>
        <label style={{ marginLeft: 16 }}>
          <input type="radio" name="role" value="hr" checked={role === 'hr'} onChange={() => setRole('hr')} /> HR
        </label>
      </div>
      <button style={{ marginTop: 16 }} onClick={handleRoleSelect} disabled={!role}>Continue</button>
    </div>
  );
};

export default AuthSuccess;
