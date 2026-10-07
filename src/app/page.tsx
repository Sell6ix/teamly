import { CatalogHome } from "@/components/catalog-home";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Teamly…
        </div>
      }
    >
      <CatalogHome />
    </Suspense>
  );
}
