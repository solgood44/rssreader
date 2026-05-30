"use client";

import { KIT_FORM_POST_URL } from "@/lib/newsletter";

function kitAcceptedResponse(res: Response): boolean {
  return (
    res.status === 302 ||
    res.status === 200 ||
    res.status === 201 ||
    res.type === "opaqueredirect"
  );
}

/** Fallback: real browser form POST (Kit expects a browser, not a server proxy). */
function subscribeViaHiddenForm(email: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const iframeName = `kit-newsletter-${Date.now()}`;
    const iframe = document.createElement("iframe");
    iframe.name = iframeName;
    iframe.title = "Newsletter signup";
    iframe.setAttribute("aria-hidden", "true");
    iframe.hidden = true;

    const form = document.createElement("form");
    form.method = "post";
    form.action = KIT_FORM_POST_URL;
    form.target = iframeName;
    form.style.display = "none";

    const input = document.createElement("input");
    input.type = "hidden";
    input.name = "email_address";
    input.value = email;
    form.appendChild(input);

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      form.remove();
      iframe.remove();
      ok ? resolve() : reject(new Error("Kit form submit failed"));
    };

    iframe.addEventListener("load", () => finish(true));
    iframe.addEventListener("error", () => finish(false));
    const timer = window.setTimeout(() => finish(true), 4000);

    document.body.appendChild(iframe);
    document.body.appendChild(form);
    form.submit();
  });
}

/** Subscribe from the visitor's browser so Kit records the address. */
export async function subscribeToKit(email: string): Promise<void> {
  try {
    const res = await fetch(KIT_FORM_POST_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ email_address: email }),
      redirect: "manual",
    });
    if (kitAcceptedResponse(res)) return;
  } catch {
    // Try iframe fallback below.
  }

  await subscribeViaHiddenForm(email);
}
