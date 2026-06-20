"use client";

import { useState } from "react";
import { ProfilePhotoField } from "@/components/profile/ProfilePhotoField";
import {
  AVATAR_BUCKET,
  buildAvatarPath,
  isAvatarPath,
  validateAvatarFile,
} from "@/lib/avatar";
import { COURSE_OPTIONS } from "@/lib/courses";
import { createClient } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/progress";

export function ProfileForm({
  userId,
  email,
  profile,
  currentAvatarUrl,
}: {
  userId: string;
  email?: string;
  profile: ProfileRow | null;
  currentAvatarUrl?: string | null;
}) {
  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [school, setSchool] = useState(profile?.school ?? "");
  const [course, setCourse] = useState(profile?.course === "CS" ? "CS" : "IT");
  const [leaderboardOptIn, setLeaderboardOptIn] = useState(Boolean(profile?.leaderboard_opt_in));
  const [avatarPath, setAvatarPath] = useState(profile?.avatar_path ?? null);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [photoResetKey, setPhotoResetKey] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) {
      setMessage({ type: "error", text: "Account storage is not configured." });
      return;
    }

    if (avatarFile) {
      const validationError = validateAvatarFile(avatarFile);
      if (validationError) {
        setMessage({ type: "error", text: validationError });
        return;
      }
    }

    setSaving(true);
    setMessage(null);

    let nextAvatarPath = removeAvatar ? null : avatarPath;
    let uploadedAvatarPath: string | null = null;

    if (avatarFile) {
      uploadedAvatarPath = buildAvatarPath(userId, avatarFile.type);
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(uploadedAvatarPath, avatarFile, {
          cacheControl: "31536000",
          contentType: avatarFile.type,
          upsert: false,
        });

      if (uploadError) {
        setSaving(false);
        setMessage({ type: "error", text: uploadError.message });
        return;
      }
      nextAvatarPath = uploadedAvatarPath;
    }

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: displayName.trim(),
      school: school.trim() || null,
      course,
      avatar_path: nextAvatarPath,
      leaderboard_opt_in: leaderboardOptIn,
    });

    if (error) {
      if (uploadedAvatarPath) {
        await supabase.storage.from(AVATAR_BUCKET).remove([uploadedAvatarPath]);
      }
      setSaving(false);
      setMessage({ type: "error", text: error.message });
      return;
    }

    let cleanupWarning = false;
    if (avatarPath && avatarPath !== nextAvatarPath && isAvatarPath(avatarPath)) {
      const { error: cleanupError } = await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath]);
      cleanupWarning = Boolean(cleanupError);
    }

    const nextAvatarUrl = nextAvatarPath
      ? supabase.storage.from(AVATAR_BUCKET).getPublicUrl(nextAvatarPath).data.publicUrl
      : null;

    setAvatarPath(nextAvatarPath);
    setAvatarUrl(nextAvatarUrl);
    setAvatarFile(null);
    setRemoveAvatar(false);
    setPhotoResetKey((value) => value + 1);
    setSaving(false);
    setMessage({
      type: cleanupWarning ? "error" : "success",
      text: cleanupWarning
        ? "Profile saved, but the previous photo could not be removed. Try saving again later."
        : "Profile saved.",
    });
  }

  return (
    <form className="profile-form" onSubmit={submit}>
      <ProfilePhotoField
        currentAvatarUrl={avatarUrl}
        disabled={saving}
        displayName={displayName}
        key={`${avatarUrl ?? "no-avatar"}-${photoResetKey}`}
        onFileChange={setAvatarFile}
        onRemoveChange={setRemoveAvatar}
        removeRequested={removeAvatar}
      />
      <label htmlFor="profile-email">Account email</label>
      <input id="profile-email" type="email" value={email ?? ""} readOnly />
      <p className="field-help">Email changes are managed by Supabase Auth.</p>
      <label htmlFor="profile-name">Display name</label>
      <input id="profile-name" maxLength={80} required value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
      <label htmlFor="profile-school">School <span>optional</span></label>
      <input id="profile-school" maxLength={120} value={school} onChange={(event) => setSchool(event.target.value)} />
      <label htmlFor="profile-course">Course</label>
      <select id="profile-course" value={course} onChange={(event) => setCourse(event.target.value)}>
        {COURSE_OPTIONS.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <label className="check-field" htmlFor="profile-leaderboard">
        <input
          id="profile-leaderboard"
          type="checkbox"
          checked={leaderboardOptIn}
          onChange={(event) => setLeaderboardOptIn(event.target.checked)}
        />
        <span>Show me on the class leaderboard</span>
      </label>
      <p className="field-help">
        Public cards show your profile photo, display name, course, readiness score, rank, broad topic strengths, and recent activity only.
      </p>
      {message && <p className={`form-message ${message.type}`} role="status">{message.text}</p>}
      <button className="button primary" type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
    </form>
  );
}
