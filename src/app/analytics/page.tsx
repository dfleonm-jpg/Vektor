import Link from "next/link";
import { ProgressCharts } from "@/components/analytics/ProgressCharts";
import { PrWall } from "@/components/analytics/PrWall";
import { loadAnalyticsData } from "@/lib/server/analytics-data";

/** Usuario demo mientras no hay auth conectada (Supabase RLS llega con Auth). */
const DEMO_USER_ID = "00000000-0000-0000-0000-000000000000";

export default async function AnalyticsPage() {
  const data = await loadAnalyticsData(DEMO_USER_ID);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 py-5">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Analítica</h1>
        <Link href="/" className="text-sm text-[#A1A1AA]">
          ‹ Dashboard
        </Link>
      </header>

      {data.source === "demo" && (
        <p className="rounded-xl border border-zinc-800 bg-[#121215] px-3 py-2 text-xs text-[#A1A1AA]">
          Mostrando datos de demostración. Conecta Supabase y registra
          entrenamientos para ver tu progreso real.
        </p>
      )}

      <ProgressCharts
        oneRmByExercise={data.oneRmByExercise}
        tonnage={data.tonnage}
        bodyWeight={data.bodyWeight}
      />

      <PrWall entries={data.prs} />
    </main>
  );
}
