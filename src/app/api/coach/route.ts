/**
 * Vektor Coach — endpoint de IA.
 *
 * Recibe el historial de chat y el contexto del atleta, inyecta el system
 * prompt con el contexto compacto y los slugs válidos del catálogo, y consulta
 * a Groq (llama-3.3-70b-versatile).
 *
 * Dos modos:
 *   - stream=true  → respuesta en streaming (texto) para dudas rápidas en el gym.
 *   - stream=false → respuesta completa; si el usuario pidió una rutina, se
 *     valida contra el catálogo y se devuelve la rutina estructurada lista para
 *     previsualizar y guardar.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { buildSystemPrompt, type SerializedCoachContext } from "@/lib/coach-context";
import { parseCoachRoutine } from "@/lib/coach-routine-parser";

export const runtime = "nodejs";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
  context: z.unknown(),
  stream: z.boolean().optional().default(false),
});

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "GROQ_API_KEY no configurada." },
      { status: 503 },
    );
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Petición inválida" }, { status: 422 });
  }
  const { messages, context, stream } = parsed.data;

  // Slugs válidos del catálogo (fuente de verdad para las rutinas de IA).
  const catalog = await prisma.exercise.findMany({ select: { slug: true } });
  const slugList = catalog.map((e) => e.slug);
  const validSlugs = new Set(slugList);

  const systemPrompt = buildSystemPrompt(
    (context ?? {}) as SerializedCoachContext,
    slugList,
  );
  const model = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

  const payload = {
    model,
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    temperature: 0.6,
    stream,
  };

  // ── Modo streaming: proxy del SSE de Groq al cliente ──
  if (stream) {
    const upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { ok: false, error: "Groq no disponible" },
        { status: 502 },
      );
    }
    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // ── Modo completo: recupera la respuesta y, si procede, valida la rutina ──
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: "Groq no disponible" }, { status: 502 });
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "";

  // ¿El atleta pidió una rutina? Intenta parsear salida estructurada.
  const routine = parseCoachRoutine(content, validSlugs);
  if (routine.ok) {
    return NextResponse.json({ ok: true, type: "routine", ...routine.data });
  }

  return NextResponse.json({ ok: true, type: "message", content });
}
