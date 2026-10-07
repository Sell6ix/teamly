"use client";

import { PartyProvider } from "@/components/party-context";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LocaleProvider } from "@/lib/i18n/context";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider, useTheme } from "next-themes";

function ThemedToaster() {
  const { resolvedTheme } = useTheme();
  return (
    <Toaster
      richColors
      position="top-center"
      theme={resolvedTheme === "light" ? "light" : "dark"}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <LocaleProvider>
          <TooltipProvider>
            <PartyProvider>
              {children}
              <ThemedToaster />
            </PartyProvider>
          </TooltipProvider>
        </LocaleProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
