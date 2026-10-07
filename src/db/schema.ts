import { integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = sqliteTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: integer("emailVerified", { mode: "timestamp_ms" }),
  image: text("image"),
});

export const accounts = sqliteTable(
  "accounts",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ],
);

export const sessions = sqliteTable("sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
});

export const verificationTokens = sqliteTable(
  "verificationTokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })],
);

export const profiles = sqliteTable("profiles", {
  userId: text("userId")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  displayName: text("displayName").notNull().default(""),
  steamProfileUrl: text("steamProfileUrl").notNull().default(""),
  discordUrl: text("discordUrl").notNull().default(""),
  riotTag: text("riotTag").notNull().default(""),
  faceitUrl: text("faceitUrl").notNull().default(""),
  region: text("region").notNull().default("msk"),
  voicePlatform: text("voicePlatform").notNull().default("discord"),
  language: text("language").notNull().default("ru"),
  discordWebhookUrl: text("discordWebhookUrl").notNull().default(""),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const blacklist = sqliteTable(
  "blacklist",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    personId: text("personId").notNull(),
    name: text("name").notNull(),
    at: integer("at", { mode: "timestamp_ms" }).notNull(),
  },
  (row) => [primaryKey({ columns: [row.userId, row.personId] })],
);

/** Published/join sessions and looking posts (shared across browsers). */
export const joinSessions = sqliteTable("join_sessions", {
  code: text("code").primaryKey(),
  partyName: text("partyName").notNull(),
  gameId: text("gameId").notNull(),
  partySize: integer("partySize").notNull(),
  playStyle: text("playStyle").notNull(),
  skill: integer("skill").notNull(),
  hoursJson: text("hoursJson").notNull(),
  seatsJson: text("seatsJson").notNull(),
  filled: integer("filled").notNull(),
  published: integer("published", { mode: "boolean" }).notNull().default(false),
  note: text("note").notNull().default(""),
  micRequired: integer("micRequired", { mode: "boolean" }).notNull().default(true),
  leader: text("leader").notNull(),
  ready: integer("ready", { mode: "boolean" }).notNull().default(false),
  startsAt: text("startsAt"),
  region: text("region"),
  voicePlatform: text("voicePlatform"),
  language: text("language"),
  ownerUserId: text("ownerUserId"),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

export const lookingPosts = sqliteTable("looking_posts", {
  id: text("id").primaryKey(),
  personId: text("personId").notNull(),
  userId: text("userId"),
  name: text("name").notNull(),
  gameId: text("gameId").notNull(),
  payloadJson: text("payloadJson").notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});

/** Thin party-local chat keyed by join code (not DMs / lobby-wide). */
export const partyMessages = sqliteTable("party_messages", {
  id: text("id").primaryKey(),
  partyCode: text("partyCode").notNull(),
  authorName: text("authorName").notNull(),
  authorId: text("authorId"),
  body: text("body").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
});

/** One Discord voice channel + invite per party join code. */
export const partyVoiceChannels = sqliteTable("party_voice_channels", {
  partyCode: text("partyCode").primaryKey(),
  channelId: text("channelId").notNull(),
  inviteCode: text("inviteCode").notNull(),
  inviteUrl: text("inviteUrl").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp_ms" }).notNull(),
});
