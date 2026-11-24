import { VektorApp } from "@/components/VektorApp";

/**
 * Página raíz: monta el shell de la app (Dashboard ⇆ Modo Gimnasio).
 * El Paso 4 conecta estos datos a Supabase; aquí se alimentan con una
 * instantánea de demostración basada en el catálogo y el motor reales.
 */
export default function HomePage() {
  return <VektorApp />;
}
