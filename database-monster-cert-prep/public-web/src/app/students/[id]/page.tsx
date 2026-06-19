import Link from "next/link";
import type { Metadata } from "next";
import { PublicStudentProfile } from "@/components/leaderboard/PublicStudentProfile";
import { Button } from "@/components/ui/button";
import { getPublicStudentProfile } from "@/lib/leaderboard";

export const metadata: Metadata = { title: "Student Profile" };

export default async function PublicStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await getPublicStudentProfile(id).catch(() => null);

  if (!student) {
    return (
      <main className="page-shell section-space">
        <section className="page-intro">
          <p className="eyebrow">Public study card</p>
          <h1>This student is not public.</h1>
          <p>
            They may not have opted into the leaderboard yet, or this public card no longer exists.
          </p>
          <div className="button-row">
            <Button asChild><Link href="/leaderboard">Back to leaderboard</Link></Button>
            <Button asChild variant="outline"><Link href="/profile">Manage your profile</Link></Button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell section-space">
      <section className="page-intro">
        <p className="eyebrow">Public study card</p>
        <h1>{student.display_name}&apos;s readiness snapshot.</h1>
        <p>Only opt-in aggregate stats are shown here. Private answer history and mistakes stay private.</p>
      </section>
      <PublicStudentProfile student={student} />
    </main>
  );
}
