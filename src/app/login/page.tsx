import { auth } from "@/auth";
import { LoginForm } from "@/components/login-form";
import { SiteChrome } from "@/components/site-chrome";
import { discordOAuthConfigured } from "@/lib/env";
import { redirect } from "next/navigation";
import { LoginCopy } from "@/components/login-copy";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <SiteChrome subtle>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <LoginCopy />
        <LoginForm discordEnabled={discordOAuthConfigured()} />
      </main>
    </SiteChrome>
  );
}
