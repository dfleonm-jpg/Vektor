import { AnatomyMap } from "@/components/anatomy/AnatomyMap";
import { VektorLogo } from "@/components/VektorLogo";
import type { MuscleRankState } from "@/lib/ranking-engine";
import type { MuscleGroup } from "@/lib/rank-config";

/**
 * Datos de demostración para el mapa anatómico mientras no hay backend
 * conectado (el Paso 3 reemplaza esto con estados derivados de sets reales).
 * Cubre los casos clave: con datos, a punto de subir de rango (pulso),
 * músculo rezagado y zonas sin datos (estado neutro).
 */
const DEMO_STATES: Partial<Record<MuscleGroup, MuscleRankState>> = {
  CHEST: {
    rank: "DIAMOND",
    subTier: "II",
    progressPct: 92,
    normalizedScore: 70,
    weeklySets: 16,
    bestPrLabel: "110 kg × 3",
    exercises: ["Press de banca con barra", "Press inclinado con barra"],
    hasData: true,
  },
  QUADS: {
    rank: "EMERALD",
    subTier: "I",
    progressPct: 40,
    normalizedScore: 58,
    weeklySets: 14,
    bestPrLabel: "160 kg × 2",
    exercises: ["Sentadilla con barra", "Prensa de piernas"],
    hasData: true,
  },
  BICEPS: {
    rank: "BRONZE",
    subTier: "III",
    progressPct: 30,
    normalizedScore: 20,
    weeklySets: 6,
    bestPrLabel: "22 kg × 6",
    exercises: ["Curl de bíceps con barra"],
    hasData: true,
  },
  CORE: {
    rank: "GOLD",
    subTier: "II",
    progressPct: 88,
    normalizedScore: 45,
    weeklySets: 9,
    bestPrLabel: "L-sit 32 s",
    exercises: ["Plancha abdominal", "L-sit"],
    hasData: true,
  },
};

const GLOBAL_SCORE = 55;

export default function HomePage() {
  return (
    <main className="mx-auto max-w-md px-5 py-6">
      <header className="mb-6 flex items-center gap-3">
        <VektorLogo size={36} />
        <div>
          <h1 className="text-xl font-bold tracking-tight">Vektor</h1>
          <p className="text-xs text-[#A1A1AA]">Mapa anatómico · Rango global 55</p>
        </div>
      </header>

      <section className="rounded-2xl border border-zinc-800 bg-[#121215] p-4">
        <AnatomyMap states={DEMO_STATES} globalScore={GLOBAL_SCORE} />
      </section>

      <p className="mt-4 text-center text-xs text-[#A1A1AA]">
        Toca un músculo para ver su rango, progreso y volumen semanal.
      </p>
    </main>
  );
}
