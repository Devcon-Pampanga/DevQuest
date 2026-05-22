import { notFound } from "next/navigation";
import { DashboardProfileDetailPage } from "@/components/profile/DashboardProfileDetailPage";
import { getDashboardProfilePayload } from "@/lib/profile/dashboardProfile";

export const dynamic = "force-dynamic";

export default async function PublicProfileRoute({
  params,
}: {
  params: { uid: string };
}) {
  const payload = await getDashboardProfilePayload(params.uid);

  if (!payload) {
    notFound();
  }

  return <DashboardProfileDetailPage payload={payload} />;
}
