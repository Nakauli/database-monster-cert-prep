import { HomeDashboard } from "@/components/HomeDashboard";
import { getCurrentUser } from "@/lib/auth";
import { getPublicLeaderboard } from "@/lib/leaderboard";
import { getDashboardData } from "@/lib/progress";

export default async function Home() {
  const user = await getCurrentUser();
  const [dashboardData, leaderboardRows] = await Promise.all([
    user ? getDashboardData(user.id).catch(() => null) : null,
    getPublicLeaderboard(null, 3).catch(() => []),
  ]);

  return <HomeDashboard dashboardData={dashboardData} leaderboardRows={leaderboardRows} userEmail={user?.email} />;
}
