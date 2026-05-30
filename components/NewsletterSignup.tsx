"use client";

import { FormEvent, useId, useState } from "react";

type Props = {
  /** Compact for footer; prominent for blog/about. */
  variant?: "compact" | "prominent";
  className?: string;
};

type Status = "idle" | "loading" | "success" | "error";

export function NewsletterSignup({ variant = "compact", className }: Props) {
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok || !data.ok) {
        setStatus("error");
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
      setError("Something went wrong. Please try again.");
    }
  }

  return (
    <aside
      className={`newsletter-signup newsletter-signup--${variant}${className ? ` ${className}` : ""}`}
      aria-label="Email updates"
    >
      {variant === "prominent" ? (
        <>
          <h2 className="newsletter-signup__title">Get listening picks by email</h2>
          <p className="newsletter-signup__lede">
            Occasional notes on new Daily shows, classic audiobooks, and collections worth exploring. Unsubscribe
            anytime.
          </p>
        </>
      ) : (
        <p className="newsletter-signup__lede">Get occasional updates on new shows and collections.</p>
      )}

      {status === "success" ? (
        <p className="newsletter-signup__success" role="status">
          Thanks — check your inbox to confirm your subscription.
        </p>
      ) : (
        <form className="newsletter-signup__form" onSubmit={handleSubmit} noValidate>
          <div className="newsletter-signup__field">
            <label className="newsletter-signup__label" htmlFor={emailId}>
              Email address
            </label>
            <input
              id={emailId}
              className="newsletter-signup__input"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              required
              disabled={status === "loading"}
              aria-invalid={status === "error" || undefined}
              aria-describedby={status === "error" ? `${emailId}-error` : undefined}
            />
          </div>
          <button className="newsletter-signup__submit" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Subscribing…" : "Subscribe"}
          </button>
          {status === "error" && error ? (
            <p className="newsletter-signup__error" id={`${emailId}-error`} role="alert">
              {error}
            </p>
          ) : null}
        </form>
      )}
    </aside>
  );
}
