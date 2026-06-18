import type { Metadata } from "next";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { LoginForm } from "@/components/auth/LoginForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const configured = isSupabaseConfigured();

  return (
    <main className="auth-page">
      <section className="auth-side">
        <p className="eyebrow">Return to your command center</p>
        <h1>Your progress should follow you—not the browser.</h1>
        <p>Sign in to save exam history, mastery scores, and your private mistake notebook.</p>
        <div className="auth-signal-grid" aria-hidden="true">
          <span>SELECT</span><span>JOIN</span><span>COMMIT</span><span>PASS</span>
        </div>
      </section>
      <section className="auth-card">
        <p className="eyebrow">Member access</p>
        <h2>Sign in</h2>
        <p>Use the account connected to your personal training history.</p>
        {!configured && <AuthNotice />}
        {params.error === "configuration" && configured && (
          <p className="form-message error">Account configuration could not be loaded.</p>
        )}
        <LoginForm nextPath={params.next} />
      </section>
    </main>
  );
}

