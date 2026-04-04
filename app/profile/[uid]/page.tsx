import { notFound } from "next/navigation";
import { PublicProfilePage } from "@/components/profile/PublicProfilePage";
import { getPublicProfilePayload } from "@/lib/profile/publicProfile";

export default async function PublicProfileRoute({
  params,
}: {
  params: { uid: string };
}) {
  const payload = await getPublicProfilePayload(params.uid);

  if (!payload) {
    notFound();
  }

  return <PublicProfilePage payload={payload} />;
}
