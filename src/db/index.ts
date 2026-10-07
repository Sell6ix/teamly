import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const defaultPath = path.join(process.cwd(), "data", "teamly.db");
const dbPath = process.env.DATABASE_URL?.replace(/^file:/, "") || defaultPath;

fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { sqlite };

let migrated = false;

/** Idempotent schema bootstrap for the demo (no separate migrate step required). */
export function ensureDb() {
  if (migrated) return;
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      emailVerified INTEGER,
      image TEXT
    );
    CREATE TABLE IF NOT EXISTS accounts (
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      providerAccountId TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at INTEGER,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      PRIMARY KEY (provider, providerAccountId)
    );
    CREATE TABLE IF NOT EXISTS sessions (
      sessionToken TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS verificationTokens (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL,
      expires INTEGER NOT NULL,
      PRIMARY KEY (identifier, token)
    );
    CREATE TABLE IF NOT EXISTS profiles (
      userId TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      displayName TEXT NOT NULL DEFAULT '',
      steamProfileUrl TEXT NOT NULL DEFAULT '',
      discordUrl TEXT NOT NULL DEFAULT '',
      riotTag TEXT NOT NULL DEFAULT '',
      faceitUrl TEXT NOT NULL DEFAULT '',
      region TEXT NOT NULL DEFAULT 'msk',
      voicePlatform TEXT NOT NULL DEFAULT 'discord',
      language TEXT NOT NULL DEFAULT 'ru',
      discordWebhookUrl TEXT NOT NULL DEFAULT '',
      updatedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS blacklist (
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      personId TEXT NOT NULL,
      name TEXT NOT NULL,
      at INTEGER NOT NULL,
      PRIMARY KEY (userId, personId)
    );
    CREATE TABLE IF NOT EXISTS join_sessions (
      code TEXT PRIMARY KEY,
      partyName TEXT NOT NULL,
      gameId TEXT NOT NULL,
      partySize INTEGER NOT NULL,
      playStyle TEXT NOT NULL,
      skill INTEGER NOT NULL,
      hoursJson TEXT NOT NULL,
      seatsJson TEXT NOT NULL,
      filled INTEGER NOT NULL,
      published INTEGER NOT NULL DEFAULT 0,
      note TEXT NOT NULL DEFAULT '',
      micRequired INTEGER NOT NULL DEFAULT 1,
      leader TEXT NOT NULL,
      ready INTEGER NOT NULL DEFAULT 0,
      startsAt TEXT,
      region TEXT,
      voicePlatform TEXT,
      language TEXT,
      ownerUserId TEXT,
      updatedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS looking_posts (
      id TEXT PRIMARY KEY,
      personId TEXT NOT NULL,
      userId TEXT,
      name TEXT NOT NULL,
      gameId TEXT NOT NULL,
      payloadJson TEXT NOT NULL,
      updatedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS party_messages (
      id TEXT PRIMARY KEY,
      partyCode TEXT NOT NULL,
      authorName TEXT NOT NULL,
      authorId TEXT,
      body TEXT NOT NULL,
      createdAt INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS party_messages_code_created
      ON party_messages (partyCode, createdAt);
    CREATE TABLE IF NOT EXISTS party_voice_channels (
      partyCode TEXT PRIMARY KEY,
      channelId TEXT NOT NULL,
      inviteCode TEXT NOT NULL,
      inviteUrl TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL
    );
  `);
  // Lightweight migrations for existing local DBs
  try {
    sqlite.exec(`ALTER TABLE profiles ADD COLUMN language TEXT NOT NULL DEFAULT 'ru'`);
  } catch {
    /* already present */
  }
  try {
    sqlite.exec(`ALTER TABLE join_sessions ADD COLUMN language TEXT`);
  } catch {
    /* already present */
  }
  migrated = true;
}

ensureDb();
