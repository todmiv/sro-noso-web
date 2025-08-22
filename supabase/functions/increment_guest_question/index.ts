// supabase/functions/increment_guest_question/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { guest_id } = await req.json();
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const limit = 3; // Лимит из ТЗ

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // Используем upsert для атомарного обновления или вставки
  const { data, error } = await supabaseAdmin.from('daily_limits')
    .upsert(
      { guest_id, date: today, question_count: 1 }, // Вставляем 1, если записи нет
      { onConflict: 'guest_id,date' } // Конфликт по guest_id и date
    )
    .select('question_count')
    .single();

  if (error) {
    console.error('Error in increment_guest_question:', error);
    return new Response(
      JSON.stringify({ is_limit_exceeded: true }), // В случае ошибки блокируем
      { headers: { "Content-Type": "application/json" } },
    );
  }

  const currentCount = data.question_count;
  const isLimitExceeded = currentCount > limit;

  if (!isLimitExceeded && currentCount > 1) {
     // Если лимит не превышен и счетчик > 1, значит мы делали upsert с увеличением
     // Нужно обновить счетчик
     await supabaseAdmin.from('daily_limits')
       .update({ question_count: currentCount })
       .eq('guest_id', guest_id)
       .eq('date', today);
  }

  // Или более простой подход с select+update/insert
  // const { data: existingData, error: fetchError } = await supabaseAdmin
  //   .from('daily_limits')
  //   .select('question_count')
  //   .eq('guest_id', guest_id)
  //   .eq('date', today)
  //   .maybeSingle();

  // let newCount = 1;
  // if (existingData) {
  //   newCount = existingData.question_count + 1;
  // }

  // const isLimitExceeded = newCount > limit;

  // await supabaseAdmin.from('daily_limits').upsert({
  //   guest_id,
  //   date: today,
  //   question_count: newCount
  // }, { onConflict: 'guest_id,date' });

  return new Response(
    JSON.stringify({ is_limit_exceeded: isLimitExceeded }),
    { headers: { "Content-Type": "application/json" } },
  );
});