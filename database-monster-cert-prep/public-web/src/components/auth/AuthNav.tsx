"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
        <Button asChild className="justify-start" size="sm" variant="ghost">
          <Link href="/login" onClick={closeMenu}>Sign in</Link>
        </Button>
        <Button asChild className="justify-start" size="sm">
          <Link href="/register" onClick={closeMenu}>Create account</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <Button asChild className="justify-start" size="sm" variant="ghost">
        <Link href="/dashboard" onClick={closeMenu}>Dashboard</Link>
      </Button>
      <Button asChild className="justify-start" size="sm" variant="ghost">
        <Link href="/history" onClick={closeMenu}>History</Link>
      </Button>
      <Button asChild className="justify-start" size="sm" variant="ghost">
        <Link href="/profile" onClick={closeMenu}>Profile</Link>
      </Button>
      <Button className="justify-start" size="sm" type="button" variant="outline" onClick={logout}>Log out</Button>
    </>
  );
}

