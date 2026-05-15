"use client";

import { useState, useTransition } from "react";
import { resendConfirmationAction } from "./actions";

export default function ResendButton({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleResend() {
    setError(null);
    startTransition(async () => {
      const res = await resendConfirmationAction(email);
      if (res?.error) setError(res.error);
      else setSent(true);
    });
  }

  if (sent) {
    return (
      <p className="text-[12px] text-rose-dark font-light mt-4">
        Correo reenviado. Revisa tu bandeja (y spam).
      </p>
    );
  }

  return (
    <div className="mt-4">
      {error && (
        <p className="text-[12px] text-rose-dark font-light mb-2">{error}</p>
      )}
      <button
        onClick={handleResend}
        disabled={isPending}
        className="text-[12px] text-rose underline underline-offset-2 disabled:opacity-50"
      >
        {isPending ? "Enviando…" : "Reenviar correo de confirmación"}
      </button>
    </div>
  );
}
