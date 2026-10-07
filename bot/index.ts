/**
 * Teamly Discord bot.
 *
 * Env:
 *   DISCORD_BOT_TOKEN
 *   DISCORD_LFG_CHANNEL_ID  — default channel for /lfg
 *   DISCORD_GUILD_ID        — optional, faster slash-command deploy
 *   APP_URL                 — link prefix in posts (default http://127.0.0.1:4317)
 */
import {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN;
const channelId = process.env.DISCORD_LFG_CHANNEL_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const appUrl = process.env.APP_URL || process.env.AUTH_URL || "http://127.0.0.1:4317";

if (!token) {
  console.error("DISCORD_BOT_TOKEN is required. Copy .env.example → .env.local");
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName("lfg")
    .setDescription("Опубликовать сбор Teamly в канал")
    .addStringOption((opt) =>
      opt.setName("game").setDescription("Игра / slug (valorant, bunker…)").setRequired(true),
    )
    .addStringOption((opt) =>
      opt.setName("note").setDescription("Короткий текст сбора").setRequired(true),
    )
    .addStringOption((opt) =>
      opt.setName("code").setDescription("Код /join (например AB12C)").setRequired(false),
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName("party")
    .setDescription("Ссылка на лобби Teamly")
    .addStringOption((opt) =>
      opt.setName("game").setDescription("Slug игры").setRequired(true),
    )
    .toJSON(),
];

async function registerCommands(clientId: string) {
  const rest = new REST({ version: "10" }).setToken(token!);
  if (guildId) {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log(`Slash commands registered for guild ${guildId}`);
  } else {
    await rest.put(Routes.applicationCommands(clientId), { body: commands });
    console.log("Slash commands registered globally (may take up to ~1h)");
  }
}

async function handleLfg(interaction: ChatInputCommandInteraction) {
  const game = interaction.options.getString("game", true).trim();
  const note = interaction.options.getString("note", true).trim();
  const code = interaction.options.getString("code")?.trim();
  const lobby = `${appUrl}/g/${encodeURIComponent(game)}`;
  const join = code ? `${appUrl}/join/${encodeURIComponent(code.toUpperCase())}` : null;
  const lines = [
    `**Teamly LFG · ${game}**`,
    note,
    `Лобби: ${lobby}`,
    join ? `Join: ${join}` : null,
    `От ${interaction.user}`,
  ].filter(Boolean);

  const target =
    (channelId
      ? await interaction.client.channels.fetch(channelId).catch(() => null)
      : null) ?? interaction.channel;

  if (!target || !target.isTextBased()) {
    await interaction.reply({
      content: "Некуда постить: задайте DISCORD_LFG_CHANNEL_ID или пишите в текстовом канале.",
      ephemeral: true,
    });
    return;
  }

  await (target as TextChannel).send(lines.join("\n"));
  await interaction.reply({ content: "Сбор опубликован.", ephemeral: true });
}

async function handleParty(interaction: ChatInputCommandInteraction) {
  const game = interaction.options.getString("game", true).trim();
  await interaction.reply({
    content: `Лобби Teamly: ${appUrl}/g/${encodeURIComponent(game)}`,
    ephemeral: true,
  });
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async (ready) => {
  console.log(`Teamly bot ready as ${ready.user.tag}`);
  await registerCommands(ready.user.id);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    if (interaction.commandName === "lfg") await handleLfg(interaction);
    if (interaction.commandName === "party") await handleParty(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.isRepliable()) {
      const msg = { content: "Ошибка бота. Смотрите логи.", ephemeral: true };
      if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
      else await interaction.reply(msg);
    }
  }
});

void client.login(token);
