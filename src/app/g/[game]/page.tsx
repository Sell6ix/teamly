import { GameLobby } from "@/components/game-lobby";
import { gameById } from "@/lib/matching";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default async function GamePage({
  params,
}: {
  params: Promise<{ game: string }>;
}) {
  const { game: gameId } = await params;
  const game = gameById(gameId);
  if (!game) notFound();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center text-sm text-white/50">
          Открываем лобби…
        </div>
      }
    >
      <GameLobby game={game} />
    </Suspense>
  );
}
