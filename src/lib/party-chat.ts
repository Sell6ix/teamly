import { asc, eq } from "drizzle-orm";
import { db, ensureDb } from "@/db";
import { partyMessages } from "@/db/schema";
import { normalizeCode } from "@/lib/party-store";

ensureDb();

export type PartyChatMessage = {
  id: string;
  partyCode: string;
  authorName: string;
  authorId: string | null;
  body: string;
  createdAt: number;
};

const MAX_BODY = 500;
const MAX_LIST = 80;

export function listPartyMessages(code: string): PartyChatMessage[] {
  const partyCode = normalizeCode(code);
  if (!partyCode) return [];
  const rows = db
    .select()
    .from(partyMessages)
    .where(eq(partyMessages.partyCode, partyCode))
    .orderBy(asc(partyMessages.createdAt))
    .all();
  const sliced = rows.length > MAX_LIST ? rows.slice(-MAX_LIST) : rows;
  return sliced.map((row) => ({
    id: row.id,
    partyCode: row.partyCode,
    authorName: row.authorName,
    authorId: row.authorId,
    body: row.body,
    createdAt:
      row.createdAt instanceof Date ? row.createdAt.getTime() : Number(row.createdAt),
  }));
}

export function postPartyMessage(input: {
  code: string;
  authorName: string;
  authorId?: string | null;
  body: string;
}): PartyChatMessage | { error: string } {
  const partyCode = normalizeCode(input.code);
  if (!partyCode || partyCode.length < 3) {
    return { error: "bad_code" };
  }
  const body = input.body.trim().slice(0, MAX_BODY);
  if (!body) return { error: "empty" };
  const authorName = input.authorName.trim().slice(0, 40) || "Player";
  const id = crypto.randomUUID();
  const createdAt = new Date();
  db.insert(partyMessages)
    .values({
      id,
      partyCode,
      authorName,
      authorId: input.authorId?.trim() || null,
      body,
      createdAt,
    })
    .run();
  return {
    id,
    partyCode,
    authorName,
    authorId: input.authorId?.trim() || null,
    body,
    createdAt: createdAt.getTime(),
  };
}
