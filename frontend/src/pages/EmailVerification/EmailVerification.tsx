import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const EmailVerification = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const email = location.state?.email || "";

  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiBase}/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Verification failed");
      }

      setSuccess("Email verified successfully! Redirecting...");
      login(data.token);
      localStorage.setItem("token", data.token);
      
      // Redirect to role-based dashboard
      const role = data.user?.role || "jobseeker";
      setTimeout(() => {
        if (role === "hr") {
          navigate("/dashboardhr");
        } else if (role === "admin") {
          navigate("/dashboardadmin");
        } else {
          navigate("/dashboardjob");
        }
      }, 1000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    setSuccess("");
    setResending(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiBase}/auth/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to resend OTP");
      }

      setSuccess("OTP resent successfully! Check your email.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setResending(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "2rem auto", textAlign: "center" }}>
      <h2>Verify Your Email</h2>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        We've sent a 6-digit OTP to <strong>{email}</strong>
      </p>
      
      <form onSubmit={handleVerify}>
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            style={{
              width: "100%",
              padding: "12px",
              fontSize: "24px",
              textAlign: "center",
              letterSpacing: "10px",
            }}
            disabled={loading}
          />
        </div>

        {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}
        {success && <div style={{ color: "green", marginBottom: "1rem" }}>{success}</div>}

        <button 
          type="submit" 
          disabled={loading || otp.length !== 6}
          style={{ width: "100%", marginBottom: "1rem" }}
        >
          {loading ? "Verifying..." : "Verify Email"}
        </button>
      </form>

      <div style={{ marginTop: "1rem" }}>
        <button
          type="button"
          onClick={handleResendOTP}
          disabled={resending}
          style={{
            background: "transparent",
            border: "none",
            color: "#007bff",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          {resending ? "Resending..." : "Resend OTP"}
        </button>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <button
          type="button"
          onClick={() => navigate("/login")}
          style={{
            background: "transparent",
            border: "none",
            color: "#666",
            cursor: "pointer",
          }}
        >
          ← Back to Login
        </button>
      </div>
    </div>
  );
};

export default EmailVerification;
