import type { Metadata } from "next";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { getAvatarPublicUrl } from "@/lib/avatar";
import { requireUser } from "@/lib/auth";
import { getProfile } from "@/lib/progress";
import { getSupabaseConfig } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  const currentAvatarUrl = getAvatarPublicUrl(profile?.avatar_path, getSupabaseConfig()?.url);
  return (
    <main className="page-shell section-space">
      <section className="page-intro">
        <p className="eyebrow">Private profile</p>
        <h1>Keep your training identity simple.</h1>
        <p>School and course are optional. They are never used to authorize access; Row Level Security uses your Supabase user ID.</p>
      </section>
      <section className="profile-card">
        <ProfileForm
          currentAvatarUrl={currentAvatarUrl}
          email={user.email}
          profile={profile}
          userId={user.id}
        />
      </section>
    </main>
  );
}

