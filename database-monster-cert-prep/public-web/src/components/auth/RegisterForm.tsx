"use client";

import Link from "next/link";
import { useState } from "react";
import { COURSE_OPTIONS } from "@/lib/courses";
import { createClient } from "@/lib/supabase/client";

function validatePassword(password: string) {
  if (password.length < 8) return "Use at least 8 characters.";
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) return "Add both uppercase and lowercase letters.";
  if (!/\d/.test(password)) return "Add at least one number.";
  return null;
}

export function RegisterForm() {
  const [displayName, setDisplayName] = useState("");
  const [course, setCourse] = useState("IT");
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const passwordIssue = password ? validatePassword(password) : null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    const issue = validatePassword(password);
    if (issue) {
      setMessage({ type: "error", text: issue });
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
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName.trim(),
          course,
          leaderboard_opt_in: leaderboardOptIn,
        },
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/dashboard`,
      },
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    setMessage({
      type: "success",
      text: data.session
        ? "Account created. You can open your dashboard now."
        : "Account created. Check your email to confirm your address.",
    });
    setLoading(false);
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label htmlFor="register-name">Display name</label>
      <input
        id="register-name"
        type="text"
        autoComplete="name"
        required
        maxLength={80}
        value={displayName}
        onChange={(event) => setDisplayName(event.target.value)}
        placeholder="How classmates know you"
      />
      <label htmlFor="register-course">Course</label>
      <select
        id="register-course"
        required
        value={course}
        onChange={(event) => setCourse(event.target.value)}
      >
        {COURSE_OPTIONS.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <label className="check-field" htmlFor="register-leaderboard">
        <input
          id="register-leaderboard"
          type="checkbox"
          checked={leaderboardOptIn}
          onChange={(event) => setLeaderboardOptIn(event.target.checked)}
        />
        <span>Show me on the class leaderboard</span>
      </label>
      <p className="field-help">
        Public leaderboard cards show only your name, course, readiness score, broad topic strengths, and recent activity.
      </p>
      <label htmlFor="register-email">Email address</label>
      <input
        id="register-email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
      />
      <label htmlFor="register-password">Password</label>
      <input
        id="register-password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        aria-describedby="password-help"
      />
      <p id="password-help" className={`field-help ${passwordIssue ? "invalid" : ""}`}>
        8+ characters with uppercase, lowercase, and a number.
      </p>
      <label htmlFor="register-confirm">Confirm password</label>
      <input
        id="register-confirm"
        type="password"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
      />
      {message && <p className={`form-message ${message.type}`} role="status">{message.text}</p>}
      <button className="button primary full" type="submit" disabled={loading}>
        {loading ? "Creating account…" : "Create account"}
      </button>
      <p className="auth-switch">Already registered? <Link href="/login">Sign in</Link></p>
    </form>
  );
}
