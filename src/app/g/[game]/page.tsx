import { GameLobby } from "@/components/game-lobby";
import { gameById } from "@/lib/matching";
import { notFound } from "next/navigation";

export default async function GamePage({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game: gameId } = await params;
  const game = gameById(gameId);
  if (!game) notFound();
  return <GameLobby game={game} />;
}
