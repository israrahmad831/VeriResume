import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [step, setStep] = useState<"email" | "otp" | "success">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiBase}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to send OTP");
      }

      setStep("otp");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3000";
      const res = await fetch(`${apiBase}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Password reset failed");
      }

      setStep("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div style={{ maxWidth: 420, margin: "2rem auto", textAlign: "center" }}>
        <h2>Password Reset Successful!</h2>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          Your password has been reset successfully. You can now login with your new password.
        </p>
        <button onClick={() => navigate("/login")} style={{ width: "100%" }}>
          Go to Login
        </button>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div style={{ maxWidth: 420, margin: "2rem auto" }}>
        <h2>Reset Password</h2>
        <p style={{ color: "#666", marginBottom: "1.5rem" }}>
          Enter the OTP sent to <strong>{email}</strong> and your new password
        </p>

        <form onSubmit={handleResetPassword}>
          <div style={{ marginBottom: "1rem" }}>
            <label>OTP</label>
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              style={{
                padding: "12px",
                fontSize: "20px",
                textAlign: "center",
                letterSpacing: "8px",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label>New Password</label>
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}

          <button type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div style={{ marginTop: "1rem", textAlign: "center" }}>
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
  }

  return (
    <div style={{ maxWidth: 420, margin: "2rem auto" }}>
      <h2>Forgot Password</h2>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>
        Enter your email address and we'll send you an OTP to reset your password
      </p>

      <form onSubmit={handleSendOTP}>
        <div style={{ marginBottom: "1rem" }}>
          <label>Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        {error && <div style={{ color: "red", marginBottom: "1rem" }}>{error}</div>}

        <button type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Sending..." : "Send OTP"}
        </button>
      </form>

      <div style={{ marginTop: "1rem", textAlign: "center" }}>
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

export default ForgotPassword;
