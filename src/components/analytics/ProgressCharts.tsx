"use client";

/**
 * Vektor — Gráficas de progreso (Recharts, tema Obsidian).
 *
 * - Evolución de 1RM estimado / marca máxima por ejercicio seleccionable.
 * - Tonelaje total y series efectivas por sesión.
 * - Histórico de peso corporal superpuesto con la fuerza relativa.
 */

import { useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Legend,
} from "recharts";

export interface OneRmPoint {
  date: string;
  value: number;
}
export interface TonnagePoint {
  date: string;
  tonnageKg: number;
  sets: number;
}
export interface BodyWeightPoint {
  date: string;
  weightKg: number;
  relativeStrength: number;
}

export interface ProgressChartsProps {
  /** Series de 1RM/marca por ejercicio (clave = nombre del ejercicio). */
  oneRmByExercise: Record<string, OneRmPoint[]>;
  tonnage: TonnagePoint[];
  bodyWeight: BodyWeightPoint[];
}

const AXIS = "#71717A";
const GRID = "#27272A";

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#121215] p-4">
      <h2 className="mb-3 text-sm font-semibold text-[#FAFAFA]">{title}</h2>
      <div className="h-56 w-full">{children}</div>
    </section>
  );
}

const tooltipStyle = {
  backgroundColor: "#09090B",
  border: "1px solid #27272A",
  borderRadius: 12,
  color: "#FAFAFA",
  fontFamily: "JetBrains Mono, monospace",
  fontSize: 12,
};

export function ProgressCharts({
  oneRmByExercise,
  tonnage,
  bodyWeight,
}: ProgressChartsProps) {
  const exercises = Object.keys(oneRmByExercise);
  const [selected, setSelected] = useState(exercises[0] ?? "");
  const oneRmSeries = oneRmByExercise[selected] ?? [];

  return (
    <div className="space-y-4">
      <ChartCard title="Evolución de 1RM estimado / marca máxima">
        {exercises.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {exercises.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setSelected(ex)}
                className={`rounded-lg px-2.5 py-1 text-xs active:scale-95 ${
                  selected === ex
                    ? "bg-[#3B82F6] text-white"
                    : "bg-zinc-800 text-[#A1A1AA]"
                }`}
              >
                {ex}
              </button>
            ))}
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={oneRmSeries} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke={AXIS} fontSize={11} />
            <YAxis stroke={AXIS} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#00E5FF"
              strokeWidth={2}
              dot={{ r: 3, fill: "#00E5FF" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Tonelaje y series efectivas por sesión">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={tonnage} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke={AXIS} fontSize={11} />
            <YAxis stroke={AXIS} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: AXIS }} />
            <Bar dataKey="tonnageKg" name="Tonelaje (kg)" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="sets" name="Series" fill="#A855F7" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Peso corporal y fuerza relativa">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={bodyWeight} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke={AXIS} fontSize={11} />
            <YAxis yAxisId="w" stroke={AXIS} fontSize={11} />
            <YAxis yAxisId="r" orientation="right" stroke={AXIS} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11, color: AXIS }} />
            <Line
              yAxisId="w"
              type="monotone"
              dataKey="weightKg"
              name="Peso (kg)"
              stroke="#EAB308"
              strokeWidth={2}
              dot={false}
            />
            <Line
              yAxisId="r"
              type="monotone"
              dataKey="relativeStrength"
              name="Fuerza relativa"
              stroke="#10B981"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

export default ProgressCharts;
