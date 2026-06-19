import type { Metadata } from "next";
import { AuthNotice } from "@/components/auth/AuthNotice";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Reset Password" };

export default function ForgotPasswordPage() {
  return (
    <main className="auth-single-page">
      <section className="auth-card">
        <p className="eyebrow">Account recovery</p>
        <h1>Reset your password</h1>
        <p>We will send a secure recovery link if the account exists.</p>
        {!isSupabaseConfigured() && <AuthNotice />}
        <ForgotPasswordForm />
      </section>
    </main>
  );
}

