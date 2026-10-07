import { PartyDeepLink } from "@/components/game-lobby";
import { openParties } from "@/lib/data";
import { getPublishedParty } from "@/lib/party-store";
import { notFound } from "next/navigation";

export default async function PartyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const party =
    openParties.find((item) => item.id === id) ?? getPublishedParty(id);
  if (!party) notFound();
  return <PartyDeepLink party={party} />;
}
