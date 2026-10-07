import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";
import { SiteChrome } from "@/components/site-chrome";
import { discordOAuthConfigured } from "@/lib/env";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <SiteChrome subtle>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <h1 className="font-display text-4xl text-white">Вход</h1>
        <p className="mt-3 text-sm text-white/60">
          Discord OAuth — когда заданы env. Без них работает демо-вход в локальную БД.
        </p>
        <LoginForm discordEnabled={discordOAuthConfigured()} />
      </main>
    </SiteChrome>
  );
}
