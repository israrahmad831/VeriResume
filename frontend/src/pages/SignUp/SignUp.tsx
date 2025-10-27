import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const res = await fetch(`${apiBase}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      let data: any = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        const text = await res.text();
        throw new Error(text || 'Signup failed');
      }
      if (!res.ok) throw new Error(data?.message || 'Signup failed');
      console.log('[SignUp] Signup successful, token received:', data.token ? `${data.token.substring(0, 20)}...` : 'null');
      console.log('[SignUp] Calling login(token)...');
      login(data.token);
      console.log('[SignUp] login() called, storing directly as backup');
      localStorage.setItem('token', data.token);
      console.log('[SignUp] Token stored, about to redirect');
      setTimeout(() => {
        console.log('[SignUp] Redirecting to /');
        window.location.replace('/');
      }, 100);
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
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <button type="submit">Sign Up</button>
      </form>

      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={() => {
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          console.log('[SignUp] Opening Google OAuth at:', `${apiUrl}/auth/google`);
          window.location.href = `${apiUrl}/auth/google`;
        }}>Sign up with Google</button>
      </div>
    </div>
  );
};

export default SignUp;
