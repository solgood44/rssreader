import { NextResponse } from "next/server";
import { KIT_API_SUBSCRIBE_URL } from "@/lib/newsletter";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const apiKey = process.env.KIT_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: "Newsletter API is not configured. Use the on-page signup form." },
      { status: 503 },
    );
  }

  let email = "";
  try {
    const body = (await request.json()) as { email?: string };
    email = body.email?.trim() ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  try {
    const kitRes = await fetch(KIT_API_SUBSCRIBE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ api_key: apiKey, email }),
    });

    const data = (await kitRes.json()) as {
      subscription?: { id?: number };
      error?: string;
      message?: string;
    };

    if (kitRes.ok && data.subscription?.id) {
      return NextResponse.json({ ok: true });
    }

    const message = data.message || data.error || "Could not subscribe right now. Try again in a moment.";
    return NextResponse.json({ error: message }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "Could not subscribe right now. Try again in a moment." }, { status: 502 });
  }
}
