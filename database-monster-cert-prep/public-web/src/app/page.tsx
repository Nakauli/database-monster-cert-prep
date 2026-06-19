import { HomeDashboard } from "@/components/HomeDashboard";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/progress";

export default async function Home() {
  const user = await getCurrentUser();
  const dashboardData = user ? await getDashboardData(user.id).catch(() => null) : null;

  return <HomeDashboard dashboardData={dashboardData} userEmail={user?.email} />;
}
