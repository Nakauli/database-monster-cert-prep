"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/progress";

export function ProfileForm({
  userId,
  email,
  profile,
}: {
  userId: string;
  email?: string;
  profile: ProfileRow | null;
}) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [school, setSchool] = useState(profile?.school ?? "");
  const [course, setCourse] = useState(profile?.course ?? "");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setMessage({ type: "error", text: "Account storage is not configured." });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: displayName.trim(),
      school: school.trim() || null,
      course: course.trim() || null,
    });
    setSaving(false);
    setMessage(error ? { type: "error", text: error.message } : { type: "success", text: "Profile saved." });
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <label htmlFor="profile-email">Account email</label>
      <input id="profile-email" type="email" value={email ?? ""} readOnly />
      <p className="field-help">Email changes are managed by Supabase Auth.</p>
      <label htmlFor="profile-name">Display name</label>
      <input id="profile-name" maxLength={80} required value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
      <label htmlFor="profile-school">School <span>optional</span></label>
      <input id="profile-school" maxLength={120} value={school} onChange={(event) => setSchool(event.target.value)} />
      <label htmlFor="profile-course">Course or program <span>optional</span></label>
      <input id="profile-course" maxLength={120} value={course} onChange={(event) => setCourse(event.target.value)} />
      {message && <p className={`form-message ${message.type}`} role="status">{message.text}</p>}
      <button className="button primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
    </form>
  );
}

