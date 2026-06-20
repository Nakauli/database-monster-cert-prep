import type { Metadata } from "next";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Create Account" };

export default function RegisterPage() {
  const configured = isSupabaseConfigured();
  return (
    <main className="auth-page">
      <section className="auth-side register-side">
        <p className="eyebrow">Build a private training record</p>
        <h1>One account. Every attempt. A clearer path to ready.</h1>
        <p>Your scores and mistakes are protected per user by Supabase Row Level Security.</p>
        <ul>
          <li>Private exam history</li>
          <li>Topic mastery tracking</li>
          <li>Personal mistake notebook</li>
        </ul>
      </section>
      <section className="auth-card">
        <p className="eyebrow">New member</p>
        <h2>Create account</h2>
        <p>Your study history stays private. Public leaderboard visibility and a profile photo are always optional.</p>
        {!configured && <AuthNotice />}
        <RegisterForm />
      </section>
    </main>
  );
}

