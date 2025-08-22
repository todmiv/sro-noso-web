// supabase/functions/report-issue/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { email, topic, message, screenshotUrl, recaptchaToken } = await req.json();
  // TODO: Проверка reCAPTCHA, сохранение в БД, отправка уведомлений
  // Это заглушка
  const supabaseAdmin = createClient(
    // Эти переменные окружения должны быть установлены в настройках функции в Supabase
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const { data, error } = await supabaseAdmin.from('support_tickets').insert({
    email,
    topic,
    message,
    screenshot: screenshotUrl,
    status: 'open',
    created_at: new Date().toISOString()
  }).select().single();

  if (error) {
    return new Response(
      JSON.stringify({ success: false, message: 'Ошибка при создании тикета.' }),
      { headers: { "Content-Type": "application/json" }, status: 500 },
    );
  }

  return new Response(
    JSON.stringify({ success: true, ticketId: data.id }),
    { headers: { "Content-Type": "application/json" } },
  );
});