// supabase/functions/ask/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { question, guestId, sessionId, history } = await req.json();
  // TODO: Реальная логика ИИ, проверка лимитов, сохранение в БД
  // Это заглушка
  const answer = `Это пример ответа на ваш вопрос: "${question}". В реальной системе здесь будет ответ от ИИ.`;
  return new Response(
    JSON.stringify({
      success: true,
      answer: answer
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});