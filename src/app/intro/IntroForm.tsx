"use client";

import { useState, useTransition, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import Input, { FormLabel } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { saveIntroAction } from "./actions";

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
  const t = useTranslations("intro");
  const tCommon = useTranslations("common");

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

    const eventTag = typeof window !== "undefined"
      ? (localStorage.getItem("too-match:event") ?? "")
      : "";
    if (eventTag) formData.set("event_tag", eventTag);

    startTransition(async () => {
      const res = await saveIntroAction(formData);
      if (res?.error) setError(res.error);
      else router.push("/welcome");
    });
  }

  return (
    <MobileShell>
      <Topbar right={tCommon("day0")} />

      <main className="flex flex-1 flex-col px-7 pt-8 pb-7 overflow-y-auto">
        <h1 className="font-serif text-[30px] text-ink font-medium leading-[1.2] mb-2">
          {t("title1")}{" "}
          <em className="italic text-rose">{t("title2")}</em>
        </h1>
        <p className="text-[13px] text-ink-2 font-light mb-7">
          {t("subtitle")}
        </p>

        <div className="flex flex-col gap-6">
          <div>
            <FormLabel htmlFor="display_name">{t("nameLabel")}</FormLabel>
            <Input
              id="display_name"
              type="text"
              placeholder={t("namePlaceholder")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
            />
          </div>

          <div>
            <FormLabel htmlFor="age">{t("ageLabel")}</FormLabel>
            <Input
              id="age"
              type="number"
              inputMode="numeric"
              placeholder={t("agePlaceholder")}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min={18}
              max={70}
              className="[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>

          <div>
            <FormLabel>{t("iAm")}</FormLabel>
            <div className="grid grid-cols-2 gap-2.5 mt-1">
              <PrefBig selected={gender === "male"} onClick={() => setGender("male")}>
                {t("man")}
              </PrefBig>
              <PrefBig selected={gender === "female"} onClick={() => setGender("female")}>
                {t("woman")}
              </PrefBig>
            </div>
          </div>

          <div>
            <FormLabel>{t("lookingFor")}</FormLabel>
            <div className="grid grid-cols-3 gap-2.5 mt-1">
              <PrefBig selected={seeking === "male"} onClick={() => setSeeking("male")}>
                {t("men")}
              </PrefBig>
              <PrefBig selected={seeking === "female"} onClick={() => setSeeking("female")}>
                {t("women")}
              </PrefBig>
              <PrefBig selected={seeking === "both"} onClick={() => setSeeking("both")}>
                {t("both")}
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
            {isPending ? tCommon("saving") : tCommon("continueArrow")}
          </Button>
        </div>
      </main>
    </MobileShell>
  );
}
