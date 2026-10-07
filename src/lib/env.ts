export function authConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16);
}

export function discordOAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_DISCORD_ID &&
      process.env.AUTH_DISCORD_SECRET &&
      authConfigured(),
  );
}

export function discordBotConfigured(): boolean {
  return Boolean(process.env.DISCORD_BOT_TOKEN && process.env.DISCORD_LFG_CHANNEL_ID);
}

/** Bot + guild required to create per-party voice channels / invites. */
export function discordVoiceConfigured(): boolean {
  return Boolean(
    process.env.DISCORD_BOT_TOKEN &&
      process.env.DISCORD_GUILD_ID &&
      /^\d{17,20}$/.test(process.env.DISCORD_GUILD_ID),
  );
}

export function appUrl(): string {
  return (
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://127.0.0.1:4317"
  );
}
