import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiBase}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      
      if (!res.ok) {
        // Check if email verification is required
        if (res.status === 403 && data.requiresVerification) {
          navigate('/verify-email', { state: { email: data.email } });
          return;
        }
        throw new Error(data?.message || "Login failed");
      }
      
      login(data.token);
      localStorage.setItem("token", data.token);
      setTimeout(() => {
        window.location.replace("/");
      }, 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "2rem auto" }}>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <div style={{ color: "red" }}>{error}</div>}
        <button type="submit">Login</button>
      </form>

      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={() => navigate('/forgot-password')}
          style={{
            background: "transparent",
            border: "none",
            color: "#007bff",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          Forgot Password?
        </button>
      </div>

      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          onClick={() => {
            const apiUrl =
              import.meta.env.VITE_API_URL || "http://localhost:3000";
            window.location.href = `${apiUrl}/auth/google`;
          }}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
