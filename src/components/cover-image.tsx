"use client";

import { coverFallbackSrc, coverSrc } from "@/lib/covers";
import type { GameId } from "@/lib/types";
import { useState } from "react";

export function CoverImage({
  gameId,
  alt = "",
  className,
}: {
  gameId: GameId;
  alt?: string;
  className?: string;
}) {
  const [src, setSrc] = useState(coverSrc(gameId));

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        const fallback = coverFallbackSrc(gameId);
        if (src !== fallback) setSrc(fallback);
      }}
    />
  );
}
