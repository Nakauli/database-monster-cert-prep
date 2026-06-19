"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setMessage({ type: "error", text: "Supabase is not configured for this deployment." });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/confirm?next=/update-password`,
    });
    setLoading(false);
    setMessage(
      error
        ? { type: "error", text: error.message }
        : { type: "success", text: "If that account exists, a reset link has been sent." },
    );
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label htmlFor="reset-email">Email address</label>
      <input
        id="reset-email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />
      {message && <p className={`form-message ${message.type}`} role="status">{message.text}</p>}
      <button className="button primary full" type="submit" disabled={loading}>
        {loading ? "Sending…" : "Send reset link"}
      </button>
      <p className="auth-switch"><Link href="/login">Back to sign in</Link></p>
    </form>
  );
}

