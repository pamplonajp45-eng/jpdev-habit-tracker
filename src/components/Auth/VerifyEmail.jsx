import React, { useState } from "react";
import api from "../../utils/api";

const VerifyEmail = ({ userId, email, onSuccess }) => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/verify", { userId, code });
      localStorage.setItem("token", res.data.token);
      onSuccess(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2
        className="stats-title"
        style={{
          textAlign: "center",
          fontSize: "1.5rem",
          marginBottom: "1rem",
        }}
      >
        Verify Email
      </h2>
      <p
        style={{ textAlign: "center", color: "#a0a0b8", marginBottom: "1rem" }}
      >
        Enter the 6-digit code sent to {email}
      </p>
      {error && (
        <div
          className="error-message"
          style={{
            color: "#ef4444",
            marginBottom: "1rem",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="auth-form"
        style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
      >
        <input
          type="text"
          placeholder="Verification Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
          className="habit-textbox"
          maxLength={6}
          style={{
            textAlign: "center",
            letterSpacing: "0.5em",
            fontSize: "1.2rem",
          }}
        />
        <button type="submit" className="habit-submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </div>
  );
};

export default VerifyEmail;
