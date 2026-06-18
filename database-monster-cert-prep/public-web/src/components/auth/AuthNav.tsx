"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthNav({ closeMenu }: { closeMenu: () => void }) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setSignedIn(Boolean(data.user));
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session?.user));
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase?.auth.signOut();
    setSignedIn(false);
    closeMenu();
    router.replace("/");
    router.refresh();
  }

  if (!signedIn) {
    return (
      <>
        <Link href="/login" onClick={closeMenu}>Sign in</Link>
        <Link className="nav-cta" href="/register" onClick={closeMenu}>Create account</Link>
      </>
    );
  }

  return (
    <>
      <Link href="/dashboard" onClick={closeMenu}>Dashboard</Link>
      <Link href="/history" onClick={closeMenu}>History</Link>
      <Link href="/profile" onClick={closeMenu}>Profile</Link>
      <button className="nav-logout" type="button" onClick={logout}>Log out</button>
    </>
  );
}

