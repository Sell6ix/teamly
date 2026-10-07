import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import { eq } from "drizzle-orm";
import { db, ensureDb } from "@/db";
import * as schema from "@/db/schema";
import { discordOAuthConfigured } from "@/lib/env";

ensureDb();

const providers = [];

if (discordOAuthConfigured()) {
  providers.push(
    Discord({
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

providers.push(
  Credentials({
    id: "demo",
    name: "Демо-вход",
    credentials: {
      name: { label: "Имя", type: "text" },
    },
    async authorize(credentials) {
      const name =
        typeof credentials?.name === "string" && credentials.name.trim()
          ? credentials.name.trim().slice(0, 40)
          : "Игрок";
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 32);
      const email = `demo-${slug || "player"}@teamly.local`;
      const existing = db.select().from(schema.users).where(eq(schema.users.email, email)).get();
      if (existing) {
        return {
          id: existing.id,
          name: existing.name ?? name,
          email: existing.email,
          image: existing.image,
        };
      }
      const id = crypto.randomUUID();
      db.insert(schema.users)
        .values({ id, name, email, emailVerified: new Date(), image: null })
        .run();
      db.insert(schema.profiles)
        .values({
          userId: id,
          displayName: name,
          updatedAt: new Date(),
        })
        .onConflictDoNothing()
        .run();
      return { id, name, email, image: null };
    },
  }),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  // Credentials requires JWT; Discord users still persist via the adapter.
  session: { strategy: "jwt" },
  providers,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
      }
      return session;
    },
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET || "teamly-dev-secret-change-me",
});
