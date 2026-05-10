"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import Input, { FormLabel } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { saveIntroAction } from "./actions";
import { ReactNode } from "react";

function PrefBig({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-4 rounded-2xl text-[14px] text-center transition-colors ${
        selected
          ? "border-2 border-rose bg-rose-light text-rose-dark font-medium"
          : "border-[1.5px] border-border-strong bg-bg text-ink-2 font-normal hover:bg-bg-2"
      }`}
    >
      {children}
    </button>
  );
}

export default function IntroForm() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [seeking, setSeeking] = useState<"male" | "female" | "both" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function canSubmit() {
    return name.trim().length > 0 && Number(age) >= 18 && gender !== null && seeking !== null;
  }

  function handleSubmit() {
    setError(null);
    const formData = new FormData();
    formData.set("display_name", name.trim());
    formData.set("age", age);
    formData.set("gender", gender!);
    formData.set("seeking", seeking!);

    startTransition(async () => {
      const res = await saveIntroAction(formData);
      if (res?.error) setError(res.error);
      else router.push("/welcome");
    });
  }

  return (
    <MobileShell>
      <Topbar right="Día 0" />

      <main className="flex flex-1 flex-col px-7 pt-8 pb-7 overflow-y-auto">
        <h1 className="font-serif text-[30px] text-ink font-medium leading-[1.2] mb-2">
          Cuéntanos un poco{" "}
          <em className="italic text-rose">sobre ti</em>
        </h1>
        <p className="text-[13px] text-ink-2 font-light mb-7">
          Solo lo básico para empezar.
        </p>

        <div className="flex flex-col gap-6">

          {/* Nombre */}
          <div>
            <FormLabel htmlFor="display_name">Tu nombre</FormLabel>
            <Input
              id="display_name"
              type="text"
              placeholder="¿Cómo te llamas?"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
            />
          </div>

          {/* Edad */}
          <div>
            <FormLabel htmlFor="age">Tu edad</FormLabel>
            <Input
              id="age"
              type="number"
              inputMode="numeric"
              placeholder="Ej. 28"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min={18}
              max={70}
              className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          {/* Género */}
          <div>
            <FormLabel>Soy</FormLabel>
            <div className="grid grid-cols-2 gap-2.5 mt-1">
              <PrefBig selected={gender === "male"} onClick={() => setGender("male")}>
                Hombre
              </PrefBig>
              <PrefBig selected={gender === "female"} onClick={() => setGender("female")}>
                Mujer
              </PrefBig>
            </div>
          </div>

          {/* Busco */}
          <div>
            <FormLabel>Busco</FormLabel>
            <div className="grid grid-cols-3 gap-2.5 mt-1">
              <PrefBig selected={seeking === "male"} onClick={() => setSeeking("male")}>
                Hombres
              </PrefBig>
              <PrefBig selected={seeking === "female"} onClick={() => setSeeking("female")}>
                Mujeres
              </PrefBig>
              <PrefBig selected={seeking === "both"} onClick={() => setSeeking("both")}>
                Ambos
              </PrefBig>
            </div>
          </div>

          {error && (
            <p className="text-[12px] text-rose-dark font-light">{error}</p>
          )}

          <Button
            variant="ink"
            fullWidth
            disabled={!canSubmit() || isPending}
            onClick={handleSubmit}
            className="mt-2"
          >
            {isPending ? "Guardando…" : "Continuar →"}
          </Button>
        </div>
      </main>
    </MobileShell>
  );
}
