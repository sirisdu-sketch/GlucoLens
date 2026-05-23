import {
  mockRecipe,
  normalizeRecipe,
  parseRecipeJson,
  streamGeminiText,
} from "@/lib/gemini";
import { buildPrompt } from "@/lib/prompt";
import { getClientIp, limit } from "@/lib/ratelimit";
import { validateAndPatch } from "@/lib/validateRules";
import type { Preferences } from "@/types/recipe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Evt =
  | { type: "start" }
  | { type: "chunk"; received: number }
  | { type: "done"; recipe: import("@/types/recipe").Recipe }
  | { type: "error"; message: string };

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = limit(ip);
  if (!rl.ok) {
    const msg =
      rl.scope === "minute"
        ? `请求过快，${rl.retryInSec} 秒后再试`
        : `今日额度已用完，${Math.ceil((rl.retryInSec ?? 0) / 3600)} 小时后重置`;
    return new Response(JSON.stringify({ error: msg, scope: rl.scope }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(rl.retryInSec ?? 60),
      },
    });
  }

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
          send(controller, {
            type: "done",
            recipe: validateAndPatch(mockRecipe(), prefs),
          });
        } else {
          const prompt = buildPrompt(prefs);
          let text = "";
          let parsed: unknown;
          let lastErr: unknown;
          // 一次重试：Gemini 偶尔会吐出破损 JSON
          for (let attempt = 0; attempt < 2; attempt++) {
            try {
              text = await streamGeminiText(prompt, (n) => {
                send(controller, { type: "chunk", received: n });
              });
              parsed = parseRecipeJson(text);
              lastErr = null;
              break;
            } catch (e) {
              lastErr = e;
              if (attempt === 0) {
                send(controller, { type: "chunk", received: 0 }); // 重置进度
              }
            }
          }
          if (lastErr || !parsed) throw lastErr ?? new Error("Gemini 返回非 JSON 内容");
          const raw = normalizeRecipe(parsed);
          const recipe = validateAndPatch(raw, prefs);
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
