"use client";

import { PartyProvider } from "@/components/party-context";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider>
        <PartyProvider>
          {children}
          <Toaster richColors position="top-center" theme="dark" />
        </PartyProvider>
      </TooltipProvider>
    </SessionProvider>
  );
}
