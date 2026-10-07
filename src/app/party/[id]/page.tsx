import { PartyDeepLink } from "@/components/game-lobby";
import { openParties } from "@/lib/data";
import { notFound } from "next/navigation";

export default async function PartyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const party = openParties.find((item) => item.id === id);
  if (!party) notFound();
  return <PartyDeepLink party={party} />;
}
