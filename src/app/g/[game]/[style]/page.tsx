import { GameLobby } from "@/components/game-lobby";
import { playStylesFor } from "@/lib/game-fields";
import { isPlayStyle } from "@/lib/lobby-url";
import { gameById } from "@/lib/matching";
import { notFound } from "next/navigation";
import { Suspense } from "react";

export default async function GameStylePage({
  params,
}: {
  params: Promise<{ game: string; style: string }>;
}) {
  const { game: gameId, style } = await params;
  const game = gameById(gameId);
  if (!game || !isPlayStyle(style) || !playStylesFor(game.id).includes(style)) {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center text-sm text-white/50">
          Открываем лобби…
        </div>
      }
    >
      <GameLobby game={game} pathStyle={style} />
    </Suspense>
  );
}
