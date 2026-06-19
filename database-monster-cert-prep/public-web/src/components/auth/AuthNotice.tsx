import Link from "next/link";

export function AuthNotice() {
  return (
    <div className="auth-config-notice" role="alert">
      <strong>Account setup is not connected yet.</strong>
      <p>
        Add the Supabase URL and anon key, run the included migrations, then restart the app.
        The public roadmap and labs remain available.
      </p>
      <Link href="/about">Read the setup status</Link>
    </div>
  );
}

