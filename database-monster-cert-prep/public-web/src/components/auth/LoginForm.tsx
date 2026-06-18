"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setLoading(true);

    const supabase = createClient();
    if (!supabase) {
      setMessage({ type: "error", text: "Supabase is not configured for this deployment." });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    setMessage({ type: "success", text: "Signed in. Opening your dashboard…" });
    router.replace(nextPath.startsWith("/") ? nextPath : "/dashboard");
    router.refresh();
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label htmlFor="login-email">Email address</label>
      <input
        id="login-email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
      />
      <label htmlFor="login-password">Password</label>
      <input
        id="login-password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      {message && <p className={`form-message ${message.type}`} role="status">{message.text}</p>}
      <button className="button primary full" type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
      <div className="auth-form-links">
        <Link href="/forgot-password">Forgot password?</Link>
        <Link href="/register">Create an account</Link>
      </div>
    </form>
  );
}

