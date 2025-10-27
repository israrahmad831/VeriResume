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
      let data: any = null;
      try {
        data = await res.json();
      } catch (parseErr) {
        const text = await res.text();
        throw new Error(text || "Login failed");
      }
      if (!res.ok) throw new Error(data?.message || "Login failed");
      console.log(
        "[Login] Login successful, token received:",
        data.token ? `${data.token.substring(0, 20)}...` : "null"
      );
      console.log("[Login] Calling login(token)...");
      login(data.token);
      console.log(
        "[Login] login() called, now storing in localStorage directly as backup"
      );
      localStorage.setItem("token", data.token);
      console.log("[Login] Token stored, about to redirect");
      // Small delay to ensure storage completes
      setTimeout(() => {
        console.log("[Login] Redirecting to /");
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
          onClick={() => {
            const apiUrl =
              import.meta.env.VITE_API_URL || "http://localhost:3000";
            console.log(
              "[Login] Opening Google OAuth at:",
              `${apiUrl}/auth/google`
            );
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
