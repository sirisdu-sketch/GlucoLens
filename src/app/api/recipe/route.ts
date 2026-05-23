import {
  mockRecipe,
  normalizeRecipe,
  parseRecipeJson,
  streamGeminiText,
} from "@/lib/gemini";
import { buildPrompt } from "@/lib/prompt";
import type { Preferences } from "@/types/recipe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Evt =
  | { type: "start" }
  | { type: "chunk"; received: number }
  | { type: "done"; recipe: import("@/types/recipe").Recipe }
  | { type: "error"; message: string };

export async function POST(req: Request) {
  let prefs: Preferences;
  try {
    prefs = (await req.json()) as Preferences;
  } catch {
    return new Response(JSON.stringify({ error: "bad json" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, evt: Evt) =>
    controller.enqueue(encoder.encode(JSON.stringify(evt) + "\n"));

  const stream = new ReadableStream({
    async start(controller) {
      send(controller, { type: "start" });

      try {
        if (!process.env.GEMINI_API_KEY) {
          // Mock 路径：模拟流式体验
          for (let i = 1; i <= 5; i++) {
            await new Promise((r) => setTimeout(r, 350));
            send(controller, { type: "chunk", received: i * 220 });
          }
          send(controller, { type: "done", recipe: mockRecipe() });
        } else {
          const prompt = buildPrompt(prefs);
          const text = await streamGeminiText(prompt, (n) => {
            send(controller, { type: "chunk", received: n });
          });
          const recipe = normalizeRecipe(parseRecipeJson(text));
          send(controller, { type: "done", recipe });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown error";
        send(controller, { type: "error", message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
