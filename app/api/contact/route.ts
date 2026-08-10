const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max = 2000): string {
  return String(value ?? "").replace(/[<>]/g, "").trim().slice(0, max);
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректные данные" }, { status: 400 });
  }

  if (clean(body.address)) return Response.json({ ok: true });
  const name = clean(body.name, 120);
  const phone = clean(body.phone, 80);
  const photos = clean(body.photos, 500);
  const message = clean(body.message);
  if (!name || !phone || !body.consent) return Response.json({ error: "Заполните обязательные поля" }, { status: 422 });

  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.CONTACT_TO_EMAIL || "79854342367@yandex.ru";
  const sender = process.env.CONTACT_FROM_EMAIL || "Wedfotobook <onboarding@resend.dev>";
  if (!apiKey || !EMAIL_PATTERN.test(recipient)) return Response.json({ error: "Отправка пока не настроена" }, { status: 503 });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      from: sender,
      to: [recipient],
      subject: `Новая заявка на фотокнигу — ${name}`,
      text: `Имя: ${name}\nТелефон: ${phone}\nСсылка на фото: ${photos || "не указана"}\nПожелания: ${message || "не указаны"}`,
      reply_to: EMAIL_PATTERN.test(clean(body.email)) ? clean(body.email) : undefined,
    }),
  });
  if (!response.ok) return Response.json({ error: "Ошибка почтового сервиса" }, { status: 502 });
  return Response.json({ ok: true });
}
