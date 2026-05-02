"use client";

import { useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import ExpandableText from "@/components/ui/ExpandableText";
import Logo from "@/components/ui/Logo";
import {
  QuoteIcon, IDCardIcon, SearchIcon, TagIcon, ImageIcon,
  PinIcon, UserIcon, HeartIcon, CalendarIcon, CompassIcon,
} from "@/components/ui/icons";
import { logoutAction } from "@/app/logout/actions";
import { updateProfileAction, resetOnboardingAction } from "./actions";
import { createClient } from "@/lib/supabase/client";

const GENDER_LABEL: Record<string, string> = { male: "Hombre", female: "Mujer", other: "Otro" };
const SEEKING_LABEL: Record<string, string> = { male: "Hombres", female: "Mujeres", both: "Hombres y mujeres" };
const VALUES_OPTIONS = [
  "Honestidad","Humor","Curiosidad","Empatía","Aventura","Calma",
  "Ambición","Lealtad","Creatividad","Familia","Cultura","Deporte",
  "Naturaleza","Espiritualidad",
];

type Profile = {
  user_id: string;
  display_name: string | null;
  self_description: string | null;
  partner_description: string | null;
  values: string[];
  gender: string | null;
  seeking: string | null;
  age: number | null;
  age_min: number;
  age_max: number;
  distance_km: number;
  city: string | null;
  photos: string[];
};

type Sheet = "name" | "age" | "city" | "gender" | "distance" | "seeking" | "age_range" | "values" | "photo_pick" | null;

/* ─── EditSheet ─────────────────────────────────────────────────────────── */

function EditSheet({
  open, title, onClose, onSave, saving, children,
}: {
  open: boolean; title: string; onClose: () => void;
  onSave: () => void; saving: boolean; children: React.ReactNode;
}) {
  const shellEl = typeof document !== "undefined" ? document.querySelector(".shell") : null;
  if (!open || !shellEl) return null;
  return createPortal(
    <div className="absolute inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(30,27,23,0.55)" }} onClick={onClose}>
      <div className="bg-bg rounded-t-[24px] px-5 pt-4 pb-10 max-h-[75vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="w-9 h-[3px] bg-bg-3 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-serif text-[18px] text-ink font-medium">{title}</h3>
          <button onClick={onClose} className="text-ink-3 hover:text-ink text-[22px] leading-none">×</button>
        </div>
        <div className="flex flex-col gap-4">{children}</div>
        <div className="flex gap-2.5 mt-6">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border-[0.5px] border-border-strong text-[13px] text-ink-2 font-light">
            Cancelar
          </button>
          <button onClick={onSave} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl bg-ink text-bg text-[13px] disabled:opacity-50">
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>,
    shellEl
  );
}

/* ─── Sheet de fotos (sin botón Guardar, auto-save al tocar) ────────────── */

function PhotoPickSheet({
  open, photos, onPick, onClose,
}: {
  open: boolean; photos: string[]; onPick: (i: number) => void; onClose: () => void;
}) {
  const shellEl = typeof document !== "undefined" ? document.querySelector(".shell") : null;
  if (!open || !shellEl) return null;
  return createPortal(
    <div className="absolute inset-0 z-50 flex flex-col justify-end"
      style={{ background: "rgba(30,27,23,0.55)" }} onClick={onClose}>
      <div className="bg-bg rounded-t-[24px] px-5 pt-4 pb-10"
        onClick={(e) => e.stopPropagation()}>
        <div className="w-9 h-[3px] bg-bg-3 rounded-full mx-auto mb-5" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-[18px] text-ink font-medium">Foto de perfil</h3>
          <button onClick={onClose} className="text-ink-3 hover:text-ink text-[22px] leading-none">×</button>
        </div>
        <p className="text-[12px] text-ink-3 font-light mb-4">
          Toca una foto para usarla como foto principal.
        </p>
        {photos.length === 0 ? (
          <p className="text-[13px] text-ink-3 font-light text-center py-4">
            Aún no tienes fotos subidas.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((url, i) => (
              <button key={i} type="button" onClick={() => onPick(i)}
                className={`aspect-square rounded-xl overflow-hidden relative border-2 transition-colors ${
                  i === 0 ? "border-rose" : "border-transparent hover:border-rose-mid"
                }`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-wider bg-rose text-white">
                    Principal
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    shellEl
  );
}

/* ─── Card y BasicRow ───────────────────────────────────────────────────── */

function Card({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-bg rounded-2xl px-4 py-4 border-[0.5px] border-border">
      <div className="flex items-center gap-2 mb-2.5 text-ink-3">
        {icon}
        <h3 className="text-[11px] uppercase tracking-[0.1em] font-medium">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function BasicRow({ icon, text, onClick }: { icon: React.ReactNode; text: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-2.5 py-1.5 border-b-[0.5px] border-border last:border-b-0 text-ink-2 w-full text-left hover:opacity-70 active:opacity-50">
      <span className="text-ink-3">{icon}</span>
      <span className="text-[13px] font-light flex-1">{text}</span>
      <span className="text-ink-3 text-[14px]">›</span>
    </button>
  );
}

function PrefBtn({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={`flex-1 py-3 rounded-2xl text-[13px] text-center transition-colors ${
        selected
          ? "border-2 border-rose bg-rose-light text-rose-dark font-medium"
          : "border-[1.5px] border-border-strong bg-bg text-ink-2 hover:bg-bg-2"
      }`}>
      {children}
    </button>
  );
}

/* ─── Componente principal ──────────────────────────────────────────────── */

export default function ProfileEditor({ initial, userEmail }: { initial: Profile; userEmail: string }) {
  const [profile, setProfile] = useState(initial);
  const [activeSheet, setActiveSheet] = useState<Sheet>(null);
  const [saving, startSaving] = useTransition();

  // Drafts por campo
  const [nameDraft, setNameDraft] = useState(profile.display_name ?? "");
  const [ageDraft, setAgeDraft] = useState(String(profile.age ?? 25));
  const [cityDraft, setCityDraft] = useState(profile.city ?? "");
  const [genderDraft, setGenderDraft] = useState(profile.gender ?? "");
  const [distanceDraft, setDistanceDraft] = useState(profile.distance_km);
  const [seekingDraft, setSeekingDraft] = useState(profile.seeking ?? "");
  const [ageRangeDraft, setAgeRangeDraft] = useState({ min: profile.age_min, max: profile.age_max });
  const [valuesDraft, setValuesDraft] = useState<string[]>(profile.values ?? []);

  function open(sheet: Sheet) {
    // Resetear draft al valor actual al abrir
    if (sheet === "name") setNameDraft(profile.display_name ?? "");
    if (sheet === "age") setAgeDraft(String(profile.age ?? 25));
    if (sheet === "city") setCityDraft(profile.city ?? "");
    if (sheet === "gender") setGenderDraft(profile.gender ?? "");
    if (sheet === "distance") setDistanceDraft(profile.distance_km);
    if (sheet === "seeking") setSeekingDraft(profile.seeking ?? "");
    if (sheet === "age_range") setAgeRangeDraft({ min: profile.age_min, max: profile.age_max });
    if (sheet === "values") setValuesDraft(profile.values ?? []);
    setActiveSheet(sheet);
  }

  function save(fields: Parameters<typeof updateProfileAction>[0]) {
    startSaving(async () => {
      const res = await updateProfileAction(fields);
      if (!res.error) {
        setProfile((p) => ({ ...p, ...fields }));
        setActiveSheet(null);
      }
    });
  }

  async function saveSelfDescription(text: string) {
    const res = await updateProfileAction({ self_description: text });
    if (res.error) throw new Error(res.error);
    setProfile((p) => ({ ...p, self_description: text }));
  }

  async function savePartnerDescription(text: string) {
    const res = await updateProfileAction({ partner_description: text });
    if (res.error) throw new Error(res.error);
    setProfile((p) => ({ ...p, partner_description: text }));
  }

  // Elegir foto principal
  async function pickMainPhoto(i: number) {
    if (i === 0) { setActiveSheet(null); return; }
    const reordered = [
      profile.photos[i],
      ...profile.photos.filter((_, idx) => idx !== i),
    ];
    const res = await updateProfileAction({ photos: reordered });
    if (!res.error) {
      setProfile((p) => ({ ...p, photos: reordered }));
      setActiveSheet(null);
    }
  }

  /* ── Fotos inline ── */
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  function triggerUpload(slot: number) {
    setPhotoError(null);
    if (!fileInputRef.current) return;
    fileInputRef.current.dataset.slot = String(slot);
    fileInputRef.current.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const slot = Number(e.target.dataset.slot ?? "0");
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) { setPhotoError("Solo se aceptan imágenes."); return; }
    if (file.size > 10 * 1024 * 1024) { setPhotoError("La foto pesa más de 10 MB."); return; }
    setUploadingSlot(slot);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sin sesión.");
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}-${slot}.${ext}`;
      const { error: upErr } = await supabase.storage.from("profile-photos").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from("profile-photos").getPublicUrl(path);
      const updated = [...profile.photos];
      updated[slot] = publicUrl;
      const clean = updated.filter(Boolean);
      const res = await updateProfileAction({ photos: clean });
      if (res.error) throw new Error(res.error);
      setProfile((p) => ({ ...p, photos: clean }));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Error al subir");
    } finally { setUploadingSlot(null); }
  }

  async function removePhoto(i: number) {
    const updated = profile.photos.filter((_, idx) => idx !== i);
    const res = await updateProfileAction({ photos: updated });
    if (!res.error) setProfile((p) => ({ ...p, photos: updated }));
  }

  const mainPhoto = profile.photos?.[0];

  return (
    <>
      {/* ── Cabecera ── */}
      <header className="relative bg-gradient-to-br from-rose-light to-bg-2 px-5 pt-5 pb-5 text-center shrink-0">
        <div className="flex justify-center mb-4">
          <Logo size="sm" align="center" />
        </div>
        {/* Avatar clickable para cambiar foto principal */}
        <button
          type="button"
          onClick={() => open("photo_pick")}
          className="relative w-20 h-20 rounded-full mx-auto mb-3 group"
        >
          <div className="w-full h-full rounded-full bg-bg border-2 border-rose-mid overflow-hidden">
            {mainPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mainPhoto} alt="Tu foto" className="w-full h-full object-cover" />
            ) : (
              <span className="font-serif italic text-[26px] text-rose flex items-center justify-center h-full">
                {(profile.display_name || userEmail).charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {/* Overlay editar */}
          <div className="absolute inset-0 rounded-full bg-ink/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          {/* Indicador siempre visible en móvil */}
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-rose border-2 border-bg flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
        </button>

        <button type="button" onClick={() => open("name")}
          className="flex items-center justify-center gap-1.5 mx-auto hover:opacity-70 group">
          <span className="text-[15px] text-ink font-medium">
            {profile.display_name || "Añadir nombre"}
          </span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-3 group-hover:text-rose transition-colors">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        {profile.age ? (
          <p className="text-[12px] text-ink-2 font-light mt-0.5">
            {profile.age} años · {profile.distance_km} km de radio
          </p>
        ) : null}
      </header>

      {/* ── Cards ── */}
      <main className="flex-1 overflow-y-auto bg-bg-2 px-3 py-3 flex flex-col gap-2.5">

        {/* Sobre mí */}
        <Card icon={<QuoteIcon />} title="Sobre mí">
          <ExpandableText text={profile.self_description ?? ""} title="Sobre mí" editable onSave={saveSelfDescription} />
        </Card>

        {/* Lo básico — cada fila = su propio sheet */}
        <Card icon={<IDCardIcon />} title="Lo básico">
          <BasicRow icon={<CalendarIcon />} text={profile.age ? `${profile.age} años` : "Edad no definida"} onClick={() => open("age")} />
          <BasicRow icon={<PinIcon />} text={profile.city ?? "Ubicación no definida"} onClick={() => open("city")} />
          <BasicRow icon={<UserIcon />} text={GENDER_LABEL[profile.gender ?? ""] ?? "—"} onClick={() => open("gender")} />
          <BasicRow icon={<CompassIcon />} text={`Radio: ${profile.distance_km} km`} onClick={() => open("distance")} />
        </Card>

        {/* Qué busco */}
        <Card icon={<SearchIcon />} title="Qué busco">
          <div className="mb-3">
            <ExpandableText text={profile.partner_description ?? ""} title="Qué busco" editable onSave={savePartnerDescription} />
          </div>
          <BasicRow icon={<HeartIcon />} text={SEEKING_LABEL[profile.seeking ?? ""] ?? "—"} onClick={() => open("seeking")} />
          <BasicRow icon={<CalendarIcon />} text={`Edad: ${profile.age_min} – ${profile.age_max} años`} onClick={() => open("age_range")} />
        </Card>

        {/* Valores */}
        <Card icon={<TagIcon />} title="Mis valores">
          <button type="button" onClick={() => open("values")} className="w-full text-left">
            <div className="flex flex-wrap gap-1.5">
              {(profile.values ?? []).length > 0
                ? profile.values.map((v) => (
                    <span key={v} className="px-3 py-1 rounded-full text-[12px] bg-rose-light text-rose-dark border-[0.5px] border-rose-mid font-light">{v}</span>
                  ))
                : <span className="text-[13px] text-ink-3 font-light">Toca para elegir valores…</span>}
            </div>
          </button>
        </Card>

        {/* Fotos inline */}
        <Card icon={<ImageIcon />} title="Mis fotos">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 6 }).map((_, i) => {
              const url = profile.photos[i];
              const isUploading = uploadingSlot === i;
              if (url) {
                return (
                  <div key={i} className="aspect-square rounded-[10px] bg-bg-2 overflow-hidden relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removePhoto(i)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-ink/80 text-bg text-[12px] flex items-center justify-center">
                      ×
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md text-[8px] uppercase tracking-wider bg-rose text-white">
                        Principal
                      </span>
                    )}
                  </div>
                );
              }
              return (
                <button key={i} type="button"
                  disabled={isUploading || uploadingSlot !== null}
                  onClick={() => triggerUpload(i)}
                  className="aspect-square rounded-[10px] border-[0.5px] border-dashed border-border-strong bg-bg-2 flex flex-col items-center justify-center gap-1 hover:bg-bg-3 disabled:opacity-50 transition-colors">
                  {isUploading
                    ? <span className="text-[11px] text-rose">Subiendo…</span>
                    : <>
                        <div className="w-6 h-6 rounded-full bg-bg border-[0.5px] border-border-strong flex items-center justify-center text-ink-3 text-[16px]">+</div>
                        {i === 0 && <span className="text-[9px] text-ink-3">Principal</span>}
                      </>
                  }
                </button>
              );
            })}
          </div>
          {photoError && <p className="text-[11px] text-rose-dark mt-2 text-center">{photoError}</p>}
        </Card>

        {/* Acciones de cuenta */}
        <div className="flex items-center justify-center gap-5 pt-2 pb-3">
          <form action={logoutAction}>
            <button type="submit" className="text-[12px] text-ink-3 font-light hover:text-rose-dark hover:underline underline-offset-2">
              Cerrar sesión
            </button>
          </form>
          <span className="text-ink-3 text-[10px]">·</span>
          <form action={resetOnboardingAction}>
            <button type="submit" className="text-[12px] text-ink-3 font-light hover:text-rose-dark hover:underline underline-offset-2">
              Repetir onboarding
            </button>
          </form>
        </div>
      </main>

      {/* ══════════ SHEETS DE CAMPO ÚNICO ══════════ */}

      <EditSheet open={activeSheet === "name"} title="Tu nombre"
        onClose={() => setActiveSheet(null)} onSave={() => save({ display_name: nameDraft.trim() || undefined })} saving={saving}>
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          placeholder="Tu nombre"
          autoFocus
          className="w-full border-[0.5px] border-border-strong rounded-xl px-3.5 py-2.5 text-[13px] font-light bg-bg text-ink outline-none focus:border-rose"
        />
      </EditSheet>

      <EditSheet open={activeSheet === "age"} title="Tu edad"
        onClose={() => setActiveSheet(null)}
        onSave={() => { const v = Number(ageDraft); if (v >= 18 && v <= 70) save({ age: v }); }}
        saving={saving}>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={ageDraft}
          onChange={(e) => setAgeDraft(e.target.value.replace(/\D/g, ""))}
          autoFocus
          placeholder="Ej. 27"
          className="w-full border-[0.5px] border-border-strong rounded-xl px-3.5 py-2.5 text-[14px] font-medium bg-bg text-ink outline-none focus:border-rose"
        />
      </EditSheet>

      <EditSheet open={activeSheet === "city"} title="Tu ciudad"
        onClose={() => setActiveSheet(null)} onSave={() => save({ city: cityDraft.trim() || undefined })} saving={saving}>
        <input value={cityDraft} onChange={(e) => setCityDraft(e.target.value)}
          placeholder="Madrid, Barcelona…" autoFocus
          className="w-full border-[0.5px] border-border-strong rounded-xl px-3.5 py-2.5 text-[13px] font-light bg-bg text-ink outline-none focus:border-rose" />
      </EditSheet>

      <EditSheet open={activeSheet === "gender"} title="Soy"
        onClose={() => setActiveSheet(null)} onSave={() => save({ gender: genderDraft as "male" | "female" | "other" || undefined })} saving={saving}>
        <div className="flex gap-2">
          {(["male","female","other"] as const).map((g) => (
            <PrefBtn key={g} selected={genderDraft === g} onClick={() => setGenderDraft(g)}>
              {GENDER_LABEL[g]}
            </PrefBtn>
          ))}
        </div>
      </EditSheet>

      <EditSheet open={activeSheet === "distance"} title="Radio de búsqueda"
        onClose={() => setActiveSheet(null)} onSave={() => save({ distance_km: distanceDraft })} saving={saving}>
        <label className="text-[11px] uppercase tracking-[0.1em] text-ink-3 font-medium block">
          {distanceDraft} km
        </label>
        <input type="range" min={1} max={200} value={distanceDraft}
          onChange={(e) => setDistanceDraft(Number(e.target.value))}
          className="w-full" style={{ accentColor: "var(--color-rose)" }} />
      </EditSheet>

      <EditSheet open={activeSheet === "seeking"} title="Busco"
        onClose={() => setActiveSheet(null)} onSave={() => save({ seeking: seekingDraft as "male" | "female" | "both" || undefined })} saving={saving}>
        <div className="flex gap-2">
          {(["male","female","both"] as const).map((s) => (
            <PrefBtn key={s} selected={seekingDraft === s} onClick={() => setSeekingDraft(s)}>
              {SEEKING_LABEL[s]}
            </PrefBtn>
          ))}
        </div>
      </EditSheet>

      <EditSheet open={activeSheet === "age_range"} title="Rango de edad"
        onClose={() => setActiveSheet(null)} onSave={() => save({ age_min: ageRangeDraft.min, age_max: ageRangeDraft.max })} saving={saving}>
        <p className="text-[13px] text-ink font-light">{ageRangeDraft.min} – {ageRangeDraft.max} años</p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-3 w-8">Min</span>
          <input type="range" min={18} max={70} value={ageRangeDraft.min}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v < ageRangeDraft.max) setAgeRangeDraft((d) => ({ ...d, min: v }));
            }}
            className="flex-1" style={{ accentColor: "var(--color-rose)" }} />
          <span className="text-[12px] font-medium text-ink w-6 text-right">{ageRangeDraft.min}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-3 w-8">Max</span>
          <input type="range" min={18} max={70} value={ageRangeDraft.max}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v > ageRangeDraft.min) setAgeRangeDraft((d) => ({ ...d, max: v }));
            }}
            className="flex-1" style={{ accentColor: "var(--color-rose)" }} />
          <span className="text-[12px] font-medium text-ink w-6 text-right">{ageRangeDraft.max}</span>
        </div>
      </EditSheet>

      <EditSheet open={activeSheet === "values"} title="Mis valores"
        onClose={() => setActiveSheet(null)} onSave={() => save({ values: valuesDraft })} saving={saving}>
        <p className="text-[12px] text-ink-3 font-light -mt-2">Elige hasta 4. Influyen en tus matches.</p>
        <div className="flex flex-wrap gap-1.5">
          {VALUES_OPTIONS.map((v) => {
            const sel = valuesDraft.includes(v);
            const disabled = !sel && valuesDraft.length >= 4;
            return (
              <button key={v} type="button" disabled={disabled}
                onClick={() => setValuesDraft((prev) => sel ? prev.filter((x) => x !== v) : [...prev, v])}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-light border-[0.5px] transition-colors ${
                  sel ? "bg-rose-light border-rose text-rose-dark" : "bg-bg border-border-strong text-ink-2 hover:bg-bg-2"
                } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}>
                {v}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-ink-3 text-right">{valuesDraft.length} / 4</p>
      </EditSheet>

      {/* Selector de foto principal */}
      <PhotoPickSheet
        open={activeSheet === "photo_pick"}
        photos={profile.photos}
        onPick={pickMainPhoto}
        onClose={() => setActiveSheet(null)}
      />
    </>
  );
}
