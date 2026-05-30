import { NextResponse } from "next/server";
import { KIT_FORM_POST_URL } from "@/lib/newsletter";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
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
    const kitRes = await fetch(KIT_FORM_POST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ email_address: email }),
      redirect: "manual",
    });

    // Kit redirects to a success page on subscribe.
    if (kitRes.status === 302 || kitRes.status === 200 || kitRes.status === 201) {
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Could not subscribe right now. Try again in a moment." }, { status: 502 });
  } catch {
    return NextResponse.json({ error: "Could not subscribe right now. Try again in a moment." }, { status: 502 });
  }
}
