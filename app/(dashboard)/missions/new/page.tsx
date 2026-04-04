import { redirect } from "next/navigation";

export default function LegacyMissionPage() {
  redirect("/subquests/new");
}
