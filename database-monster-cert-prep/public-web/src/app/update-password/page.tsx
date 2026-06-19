import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Update Password" };

export default async function UpdatePasswordPage() {
  await requireUser();
  return (
    <main className="auth-single-page">
      <section className="auth-card">
        <p className="eyebrow">Secure account</p>
        <h1>Choose a new password</h1>
        <p>Use a password you do not reuse on another website.</p>
        <UpdatePasswordForm />
      </section>
    </main>
  );
}

