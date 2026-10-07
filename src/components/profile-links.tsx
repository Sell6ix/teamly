import { ExternalLink } from "lucide-react";

export function ProfileLinks({
  steamProfileUrl,
  discordUrl,
  riotTag,
  compact = false,
}: {
  steamProfileUrl?: string | null;
  discordUrl?: string | null;
  riotTag?: string | null;
  compact?: boolean;
}) {
  const steam = steamProfileUrl?.trim();
  const discord = discordUrl?.trim();
  const riot = riotTag?.trim();
  if (!steam && !discord && !riot) return null;

  const chip =
    "inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[11px] font-normal transition hover:border-white/25";

  return (
    <span className={`inline-flex flex-wrap items-center gap-1 ${compact ? "" : "mt-0.5"}`}>
      {steam ? (
        <a
          href={steam}
          target="_blank"
          rel="noopener noreferrer"
          className={`${chip} text-[#8fbcff] hover:bg-[#8fbcff]/10`}
          onClick={(event) => event.stopPropagation()}
        >
          Steam
          <ExternalLink className="size-3" />
        </a>
      ) : null}
      {discord ? (
        <a
          href={discord}
          target="_blank"
          rel="noopener noreferrer"
          className={`${chip} text-[#a5b4fc] hover:bg-[#5865f2]/15`}
          onClick={(event) => event.stopPropagation()}
        >
          Discord
          <ExternalLink className="size-3" />
        </a>
      ) : null}
      {riot ? (
        <span
          className={`${chip} cursor-default text-[#ff4655]/90`}
          title="Riot ID"
        >
          {riot}
        </span>
      ) : null}
    </span>
  );
}
