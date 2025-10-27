import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'jobseeker' | 'hr'>('jobseeker');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiBase}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data?.message || 'Signup failed');
      
      // Redirect to email verification page
      if (data.requiresVerification) {
        navigate('/verify-email', { state: { email: data.email } });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '2rem auto' }}>
      <h2>Sign Up</h2>
      <form onSubmit={submit}>
        <div>
          <label>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div>
          <label>Register as:</label>
          <select value={role} onChange={e => setRole(e.target.value as 'jobseeker' | 'hr')}>
            <option value="jobseeker">Job Seeker</option>
            <option value="hr">HR</option>
          </select>
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit">Sign Up</button>
      </form>

      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={() => {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          window.location.href = `${apiUrl}/auth/google`;
        }}>Sign up with Google</button>
      </div>
    </div>
  );
};

export default SignUp;
