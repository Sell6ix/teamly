import { CatalogHome } from "@/components/catalog-home";
import { Suspense } from "react";

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0b0b0d] text-white/50">
          Загрузка каталога…
        </div>
      }
    >
      <CatalogHome />
    </Suspense>
  );
}
