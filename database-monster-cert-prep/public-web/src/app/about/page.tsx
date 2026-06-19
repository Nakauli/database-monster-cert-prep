import type { Metadata } from "next";
import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  const configured = isSupabaseConfigured();
  return (
    <main className="page-shell section-space">
      <section className="page-intro">
        <p className="eyebrow">About the simulator</p>
        <h1>Original practice. Serious preparation. No exam dumps.</h1>
        <p>
          Database Monster is an unofficial Certiport-style practice system for database fundamentals.
          It is not affiliated with or endorsed by Certiport.
        </p>
      </section>
      <section className="about-grid">
        <article className="content-card">
          <h2>What it stores</h2>
          <p>When accounts are configured, Supabase stores each user&apos;s attempts, question results, topic mastery, profile, and mistake notebook.</p>
        </article>
        <article className="content-card">
          <h2>What it never stores</h2>
          <p>No passwords are handled by this app, and no service-role key is exposed. Supabase Auth owns password verification.</p>
        </article>
        <article className="content-card">
          <h2>Account status</h2>
          <p>{configured ? "Supabase account services are configured for this deployment." : "This build is waiting for Supabase environment variables and migrations."}</p>
        </article>
      </section>
      <div className="button-row">
        <Link className="button primary" href={configured ? "/register" : "/roadmap"}>{configured ? "Create account" : "View public roadmap"}</Link>
        <Link className="button secondary" href="/labs">Open public SQL labs</Link>
      </div>
    </main>
  );
}

