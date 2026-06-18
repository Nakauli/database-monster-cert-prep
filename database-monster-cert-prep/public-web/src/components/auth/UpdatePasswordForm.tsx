"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      setMessage({ type: "error", text: "Use at least 8 characters." });
      return;
    }
    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    const supabase = createClient();
    if (!supabase) {
      setMessage({ type: "error", text: "Supabase is not configured for this deployment." });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "success", text: "Password updated." });
    window.setTimeout(() => router.replace("/dashboard"), 700);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label htmlFor="new-password">New password</label>
      <input
        id="new-password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <label htmlFor="new-password-confirm">Confirm new password</label>
      <input
        id="new-password-confirm"
        type="password"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />
      {message && <p className={`form-message ${message.type}`} role="status">{message.text}</p>}
      <button className="button primary full" type="submit" disabled={loading}>
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

