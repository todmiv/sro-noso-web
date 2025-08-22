// supabase/functions/verify-inn/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { inn } = await req.json();
  // TODO: Реальная логика проверки ИНН
  // Это заглушка
  if (inn === "123456789012") { // Пример корректного ИНН
    return new Response(
      JSON.stringify({
        success: true,
        inn: inn,
        fullName: "ООО Тестовая Организация",
        status: "Действующий",
        membershipExpirationDate: "2025-12-31T00:00:00Z"
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } else {
    return new Response(
      JSON.stringify({
        success: false,
        inn: inn,
        message: "ИНН не найден в реестре СРО НОСО."
      }),
      { headers: { "Content-Type": "application/json" }, status: 400 },
    );
  }
});