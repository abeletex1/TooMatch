"use client";

import { ReactNode, useRef, useState, useTransition } from "react";
import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";
import { buttonClasses } from "@/components/ui/Button";
import { logoutAction } from "@/app/logout/actions";
import { createClient } from "@/lib/supabase/client";
import { saveProfileAction, type OnboardingPayload } from "./actions";

/* ===== Tipos y constantes ================================================ */

const TOTAL_STEPS = 7;

const VALUES_OPTIONS = [
  "Honestidad",
  "Humor",
  "Curiosidad",
  "Empatía",
  "Aventura",
  "Calma",
  "Ambición",
  "Lealtad",
  "Creatividad",
  "Familia",
  "Cultura",
  "Deporte",
  "Naturaleza",
  "Espiritualidad",
];

type Data = {
  self_description: string;
  partner_description: string;
  values: string[];
  gender: "male" | "female" | "other" | null;
  seeking: "male" | "female" | "both" | null;
  age: number;
  age_min: number;
  age_max: number;
  distance_km: number;
  photos: string[];
};

const DEFAULT_DATA: Data = {
  self_description: "",
  partner_description: "",
  values: [],
  gender: null,
  seeking: null,
  age: 28,
  age_min: 22,
  age_max: 38,
  distance_km: 50,
  photos: [],
};

/* ===== Helpers presentacionales =========================================== */

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = (current / total) * 100;
  return (
    <div className="px-7 pt-4">
      <div className="h-[2px] bg-bg-3 rounded-full overflow-hidden">
        <div
          className="h-full bg-rose rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function StepHeader({
  step,
  title,
  titleEm,
  subtitle,
}: {
  step: number;
  title: string;
  titleEm?: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4">
      <p className="text-[10px] uppercase tracking-[0.12em] text-ink-3 mb-2">
        Paso {step} de {TOTAL_STEPS}
      </p>
      <h2 className="font-serif text-[26px] text-ink font-medium leading-[1.2] mb-2">
        {title}{" "}
        {titleEm ? (
          <em className="italic text-rose">{titleEm}</em>
        ) : null}
      </h2>
      <p className="text-[13px] text-ink-2 font-light leading-[1.65]">
        {subtitle}
      </p>
    </div>
  );
}

function AiHint({ children }: { children: ReactNode }) {
  return (
    <div className="bg-rose-light rounded-xl px-3.5 py-2.5 mb-4 flex items-start gap-2">
      <div className="w-[6px] h-[6px] rounded-full bg-rose shrink-0 mt-[6px]" />
      <p className="text-[12px] text-rose-dark font-light leading-[1.5]">
        {children}
      </p>
    </div>
  );
}

function GuideChip({
  num,
  label,
  used,
  onClick,
}: {
  num: number;
  label: string;
  used: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-2 border-[0.5px] transition-colors text-left ${
        used
          ? "border-rose-mid bg-rose-light"
          : "border-transparent hover:border-rose-mid hover:bg-rose-light"
      }`}
    >
      <span
        className={`w-[18px] h-[18px] rounded-full border-[0.5px] flex items-center justify-center text-[10px] font-medium shrink-0 ${
          used
            ? "bg-rose border-rose text-white"
            : "bg-rose-light border-rose-mid text-rose-dark"
        }`}
      >
        {num}
      </span>
      <span className="text-[12px] text-ink-2 font-light">{label}</span>
    </button>
  );
}

/* ===== Step 1: ¿Quién eres? ============================================== */

function Step1({
  data,
  update,
}: {
  data: Data;
  update: (patch: Partial<Data>) => void;
}) {
  const [usedGuides, setUsedGuides] = useState<Set<number>>(new Set());
  const minChars = 30;
  const text = data.self_description;

  const guides = [
    "Cómo te describirían otras personas",
    "Cómo eres en tu día a día cuando estás a gusto",
    "Qué te hace sentir bien de verdad",
  ];

  function appendGuide(idx: number, label: string) {
    const newText = text + (text ? "\n\n" : "") + `${label}: `;
    update({ self_description: newText });
    setUsedGuides(new Set(usedGuides).add(idx));
  }

  return (
    <>
      <StepHeader
        step={1}
        title="¿Quién"
        titleEm="eres?"
        subtitle="Cuéntalo en tus palabras, sin filtros. Es lo único que verá tu match al principio."
      />
      <AiHint>
        No pienses en quedar bien. Cuanto más tú, mejor encaja.
      </AiHint>
      <div className="flex flex-col gap-1.5 mb-3">
        {guides.map((g, i) => (
          <GuideChip
            key={i}
            num={i + 1}
            label={g}
            used={usedGuides.has(i)}
            onClick={() => appendGuide(i, g)}
          />
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => update({ self_description: e.target.value })}
        placeholder="Por ejemplo: soy diseñador, vivo lento, me gusta la fotografía analógica…"
        className="w-full h-[140px] resize-none border-[0.5px] border-border-strong rounded-xl px-3.5 py-3 text-[13px] font-light leading-[1.7] bg-bg text-ink outline-none focus:border-rose"
      />
      <p
        className={`text-[11px] text-right mt-1 ${
          text.length >= minChars ? "text-rose" : "text-ink-3"
        }`}
      >
        {text.length} / mín. {minChars}
      </p>
    </>
  );
}

/* ===== Step 2: ¿Qué buscas? ============================================== */

function Step2({
  data,
  update,
}: {
  data: Data;
  update: (patch: Partial<Data>) => void;
}) {
  const [usedGuides, setUsedGuides] = useState<Set<number>>(new Set());
  const minChars = 30;
  const text = data.partner_description;

  const guides = [
    "Cómo te gustaría que fuera esa persona en su día a día",
    "Qué tipo de vida te gustaría compartir",
    "Cómo te gustaría sentirte con esa persona",
    "Algo que sabes que no encajaría contigo",
  ];

  function appendGuide(idx: number, label: string) {
    const newText = text + (text ? "\n\n" : "") + `${label}: `;
    update({ partner_description: newText });
    setUsedGuides(new Set(usedGuides).add(idx));
  }

  return (
    <>
      <StepHeader
        step={2}
        title="¿Qué"
        titleEm="buscas?"
        subtitle="Personalidad, no perfil de LinkedIn. Cuéntanos cómo es esa persona."
      />
      <AiHint>
        Lo importante no es qué hace, sino cómo es.
      </AiHint>
      <div className="flex flex-col gap-1.5 mb-3">
        {guides.map((g, i) => (
          <GuideChip
            key={i}
            num={i + 1}
            label={g}
            used={usedGuides.has(i)}
            onClick={() => appendGuide(i, g)}
          />
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => update({ partner_description: e.target.value })}
        placeholder="Por ejemplo: alguien curioso, con sentido del humor, que me cuente cosas que no sé…"
        className="w-full h-[140px] resize-none border-[0.5px] border-border-strong rounded-xl px-3.5 py-3 text-[13px] font-light leading-[1.7] bg-bg text-ink outline-none focus:border-rose"
      />
      <p
        className={`text-[11px] text-right mt-1 ${
          text.length >= minChars ? "text-rose" : "text-ink-3"
        }`}
      >
        {text.length} / mín. {minChars}
      </p>
    </>
  );
}

/* ===== Step 3: Valores =================================================== */

function Step3({
  data,
  update,
}: {
  data: Data;
  update: (patch: Partial<Data>) => void;
}) {
  const max = 4;

  function toggle(value: string) {
    const isSelected = data.values.includes(value);
    if (isSelected) {
      update({ values: data.values.filter((v) => v !== value) });
    } else if (data.values.length < max) {
      update({ values: [...data.values, value] });
    }
  }

  return (
    <>
      <StepHeader
        step={3}
        title="Tus"
        titleEm="valores"
        subtitle={`Elige hasta ${max}. Esto pesa mucho en la compatibilidad.`}
      />
      <div className="flex flex-wrap gap-1.5">
        {VALUES_OPTIONS.map((v) => {
          const sel = data.values.includes(v);
          const disabled = !sel && data.values.length >= max;
          return (
            <button
              key={v}
              type="button"
              disabled={disabled}
              onClick={() => toggle(v)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-light border-[0.5px] transition-colors ${
                sel
                  ? "bg-rose-light border-rose text-rose-dark"
                  : "bg-bg border-border-strong text-ink-2 hover:bg-bg-2"
              } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {v}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-ink-3 font-light text-right mt-3">
        {data.values.length} / {max} seleccionados
      </p>
    </>
  );
}

/* ===== Step 4: Identidad y orientación =================================== */

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

function Step4({
  data,
  update,
}: {
  data: Data;
  update: (patch: Partial<Data>) => void;
}) {
  return (
    <>
      <StepHeader
        step={4}
        title="Sobre"
        titleEm="ti"
        subtitle="Necesitamos saber esto para que el match tenga sentido."
      />

      <p className="text-[12px] text-ink-2 mt-2 mb-2.5">Soy</p>
      <div className="grid grid-cols-2 gap-2.5 mb-5">
        <PrefBig
          selected={data.gender === "male"}
          onClick={() => update({ gender: "male" })}
        >
          Hombre
        </PrefBig>
        <PrefBig
          selected={data.gender === "female"}
          onClick={() => update({ gender: "female" })}
        >
          Mujer
        </PrefBig>
      </div>

      <p className="text-[12px] text-ink-2 mb-2.5">Busco</p>
      <div className="grid grid-cols-3 gap-2.5">
        <PrefBig
          selected={data.seeking === "male"}
          onClick={() => update({ seeking: "male" })}
        >
          Hombres
        </PrefBig>
        <PrefBig
          selected={data.seeking === "female"}
          onClick={() => update({ seeking: "female" })}
        >
          Mujeres
        </PrefBig>
        <PrefBig
          selected={data.seeking === "both"}
          onClick={() => update({ seeking: "both" })}
        >
          Ambos
        </PrefBig>
      </div>
    </>
  );
}

/* ===== Step 5: Edad y rango ============================================== */

function Step5({
  data,
  update,
}: {
  data: Data;
  update: (patch: Partial<Data>) => void;
}) {
  function updateRange(part: "min" | "max", value: number) {
    if (part === "min" && value < data.age_max - 1) {
      update({ age_min: value });
    } else if (part === "max" && value > data.age_min + 1) {
      update({ age_max: value });
    }
  }

  return (
    <>
      <StepHeader
        step={5}
        title="Tu"
        titleEm="edad"
        subtitle="Y la franja de edad que buscas en tu match."
      />

      <div className="bg-bg-2 rounded-xl px-4 py-3 flex items-center gap-3 mb-5">
        <label className="text-[13px] text-ink-2 flex-1 font-light">
          Tengo
        </label>
        <input
          type="number"
          inputMode="numeric"
          min={18}
          max={70}
          value={data.age}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v >= 18 && v <= 70) update({ age: v });
          }}
          className="text-[14px] font-medium text-ink w-[52px] text-right bg-transparent outline-none border-b border-rose [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="text-[13px] text-ink-2 font-light">años</span>
      </div>
      <input
        type="range"
        min={18}
        max={70}
        value={data.age}
        onChange={(e) => update({ age: Number(e.target.value) })}
        className="w-full mb-6"
        style={{ accentColor: "var(--color-rose)" }}
      />

      <p className="text-[12px] text-ink-2 mb-3">Busco entre</p>
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-[13px] text-ink-2 w-[40px] font-light">Min</span>
        <input
          type="range"
          min={18}
          max={70}
          value={data.age_min}
          onChange={(e) => updateRange("min", Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-rose)" }}
        />
        <span className="text-[13px] font-medium text-ink w-[36px] text-right">
          {data.age_min}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <span className="text-[13px] text-ink-2 w-[40px] font-light">Max</span>
        <input
          type="range"
          min={18}
          max={70}
          value={data.age_max}
          onChange={(e) => updateRange("max", Number(e.target.value))}
          className="flex-1"
          style={{ accentColor: "var(--color-rose)" }}
        />
        <span className="text-[13px] font-medium text-ink w-[36px] text-right">
          {data.age_max}
        </span>
      </div>
    </>
  );
}

/* ===== Step 6: Distancia ================================================= */

function Step6({
  data,
  update,
}: {
  data: Data;
  update: (patch: Partial<Data>) => void;
}) {
  // Recomendación fake basada en distancia (más adelante: real density).
  let recTone: "good" | "warn" | "low" = "good";
  let recText = "Buena densidad de usuarios en este radio.";
  if (data.distance_km < 15) {
    recTone = "low";
    recText = "Pocos usuarios a esa distancia. Considera ampliar.";
  } else if (data.distance_km > 100) {
    recTone = "warn";
    recText = "Radio muy grande, puede que viajes lejos a quedar.";
  }

  const recColors = {
    good: "bg-[#E8F5EE] border-[#7BBF9A]",
    warn: "bg-[#FDF3DC] border-[#C4963A]",
    low: "bg-rose-light border-rose",
  };
  const dotColors = {
    good: "bg-[#3A9E6A]",
    warn: "bg-[#C4963A]",
    low: "bg-rose",
  };

  return (
    <>
      <StepHeader
        step={6}
        title="¿A qué"
        titleEm="distancia?"
        subtitle="Define el radio máximo donde buscar matches."
      />

      <p className="font-serif text-[38px] text-rose text-center mt-2 mb-1">
        {data.distance_km} <span className="text-[20px]">km</span>
      </p>
      <input
        type="range"
        min={1}
        max={200}
        value={data.distance_km}
        onChange={(e) => update({ distance_km: Number(e.target.value) })}
        className="w-full mb-5"
        style={{ accentColor: "var(--color-rose)" }}
      />

      <div
        className={`rounded-xl p-3 border-[0.5px] flex items-start gap-2.5 ${recColors[recTone]}`}
      >
        <div className={`w-[7px] h-[7px] rounded-full mt-[5px] ${dotColors[recTone]}`} />
        <p className="text-[12px] text-ink font-light leading-[1.5]">
          {recText}
        </p>
      </div>
    </>
  );
}

/* ===== Step 7: Fotos (subida real con Supabase Storage) ================== */

const MAX_PHOTOS = 6;

function Step7({
  data,
  update,
}: {
  data: Data;
  update: (patch: Partial<Data>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function openPicker() {
    setUploadError(null);
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    const available = MAX_PHOTOS - data.photos.length;
    const toUpload = files.slice(0, available);

    for (const file of toUpload) {
      if (!file.type.startsWith("image/")) {
        setUploadError("Solo se aceptan imágenes.");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`"${file.name}" pesa más de 10 MB.`);
        return;
      }
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sin sesión.");

      const uploaded: string[] = [];
      for (const file of toUpload) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("profile-photos")
          .upload(path, file, { upsert: true });
        if (upErr) throw upErr;

        const { data: { publicUrl } } = supabase.storage
          .from("profile-photos")
          .getPublicUrl(path);
        uploaded.push(publicUrl);
      }

      update({ photos: [...data.photos, ...uploaded] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al subir";
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(slot: number) {
    const compacted = data.photos.filter((_, i) => i !== slot);
    update({ photos: compacted });
  }

  return (
    <>
      <StepHeader
        step={7}
        title="Tus"
        titleEm="fotos"
        subtitle="Hasta 6 fotos. La primera será tu foto principal."
      />
      <AiHint>
        Tus fotos quedan <strong>bloqueadas</strong> para tu match hasta que
        intercambiéis 5 mensajes. Nadie las ve antes.
      </AiHint>

      {/* Input oculto — acepta múltiples archivos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-3 gap-2 mb-3">
        {data.photos.map((url, i) => (
          <div
            key={url}
            className="aspect-square rounded-xl bg-bg-2 overflow-hidden relative"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(i)}
              className="absolute top-1.5 right-1.5 w-[20px] h-[20px] rounded-full bg-ink/90 text-bg text-[12px] flex items-center justify-center hover:bg-ink"
              aria-label="Quitar foto"
            >
              ×
            </button>
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider bg-rose text-white">
                Principal
              </span>
            )}
          </div>
        ))}

        {data.photos.length < MAX_PHOTOS && (
          <button
            type="button"
            disabled={uploading}
            onClick={openPicker}
            className="aspect-square rounded-xl border-[0.5px] border-dashed border-border-strong bg-bg-2 flex flex-col items-center justify-center gap-1 hover:bg-bg-3 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <span className="text-[11px] text-rose">Subiendo…</span>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-bg border-[0.5px] border-border-strong flex items-center justify-center text-ink-3 text-[16px]">
                  +
                </div>
                <span className="text-[9px] text-ink-3">
                  {data.photos.length === 0 ? "Añadir fotos" : "Añadir más"}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {uploadError ? (
        <p className="text-[11px] text-rose-dark font-light text-center">
          {uploadError}
        </p>
      ) : (
        <p className="text-[11px] text-ink-3 text-center font-light">
          Puedes seleccionar varias fotos a la vez. Puedes terminar sin fotos y añadirlas después.
        </p>
      )}
    </>
  );
}

/* ===== Componente principal ============================================== */

export default function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<Data>(DEFAULT_DATA);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update(patch: Partial<Data>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  function canProceed(): boolean {
    switch (step) {
      case 1:
        return data.self_description.trim().length >= 30;
      case 2:
        return data.partner_description.trim().length >= 30;
      case 3:
        return data.values.length >= 1;
      case 4:
        return data.gender !== null && data.seeking !== null;
      case 5:
        return data.age_min < data.age_max;
      case 6:
        return data.distance_km > 0;
      case 7:
        return true; // fotos opcionales por ahora
      default:
        return true;
    }
  }

  function handleNext() {
    setError(null);
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    // Último paso → guardar
    if (
      data.gender === null ||
      data.seeking === null
    ) {
      setError("Faltan datos obligatorios.");
      return;
    }
    const payload: OnboardingPayload = {
      ...data,
      gender: data.gender,
      seeking: data.seeking,
    };
    startTransition(async () => {
      const res = await saveProfileAction(payload);
      if (res?.error) setError(res.error);
    });
  }

  function handleBack() {
    setError(null);
    if (step > 1) setStep(step - 1);
  }

  return (
    <MobileShell>
      <Topbar back={step === 1 ? "/brand" : undefined} right="Día 0" />
      <ProgressBar current={step} total={TOTAL_STEPS} />

      <div
        key={step}
        className="animate-fade-up flex flex-1 flex-col px-7 pt-6 pb-3 overflow-y-auto"
      >
        {step === 1 && <Step1 data={data} update={update} />}
        {step === 2 && <Step2 data={data} update={update} />}
        {step === 3 && <Step3 data={data} update={update} />}
        {step === 4 && <Step4 data={data} update={update} />}
        {step === 5 && <Step5 data={data} update={update} />}
        {step === 6 && <Step6 data={data} update={update} />}
        {step === 7 && <Step7 data={data} update={update} />}

        {error ? (
          <p className="text-[12px] text-rose-dark font-light mt-3">
            {error}
          </p>
        ) : null}
      </div>

      {/* Nav buttons */}
      <div className="flex gap-2.5 px-7 pt-2 pb-3 border-t-[0.5px] border-border bg-bg">
        {step > 1 ? (
          <button
            onClick={handleBack}
            disabled={pending}
            className={`${buttonClasses("outline")} flex-1`}
          >
            ← Atrás
          </button>
        ) : null}
        <button
          onClick={handleNext}
          disabled={!canProceed() || pending}
          className={`${buttonClasses(
            step === TOTAL_STEPS ? "rose" : "ink"
          )} flex-1`}
        >
          {pending
            ? "Guardando…"
            : step === TOTAL_STEPS
            ? "Terminar →"
            : "Siguiente →"}
        </button>
      </div>

      {/* Logout sutil */}
      <form action={logoutAction} className="text-center pb-3">
        <button
          type="submit"
          className="text-[11px] text-ink-3 font-light hover:text-rose-dark hover:underline underline-offset-2"
        >
          Cerrar sesión
        </button>
      </form>
    </MobileShell>
  );
}
