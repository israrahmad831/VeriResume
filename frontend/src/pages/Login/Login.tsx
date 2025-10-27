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
      // Redirect based on role
      const role = data.user?.role || "jobseeker";
      if (role === "hr") {
        navigate("/dashboardhr");
      } else if (role === "admin") {
        navigate("/dashboardadmin");
      } else {
        navigate("/dashboardjob");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input 
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button 
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Login
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => navigate('/forgot-password')}
          className="text-blue-600 hover:underline text-sm"
        >
          Forgot Password?
        </button>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => {
            const apiUrl =
              import.meta.env.VITE_API_URL || "http://localhost:3000";
            window.location.href = `${apiUrl}/auth/google`;
          }}
          className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
