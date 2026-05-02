"use client";

import { useState, useTransition } from "react";
import { createMatchAction, deleteMatchAction } from "./actions";
import { useRouter } from "next/navigation";

type Profile = {
  user_id: string;
  display_name: string | null;
  age: number | null;
  city: string | null;
  gender: string | null;
  seeking: string | null;
  photos: string[];
  self_description: string | null;
  partner_description: string | null;
  values: string[];
  age_min: number | null;
  age_max: number | null;
};

type Match = {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  unmatched_by: string | null;
};

function Avatar({ profile }: { profile: Profile }) {
  const initial = (profile.display_name ?? "?").charAt(0).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-rose-light border border-rose-mid overflow-hidden flex items-center justify-center shrink-0">
      {profile.photos?.[0] ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.photos[0]} alt={initial} className="w-full h-full object-cover" />
      ) : (
        <span className="font-serif italic text-rose text-[16px]">{initial}</span>
      )}
    </div>
  );
}

function ProfileRow({
  profile,
  selected,
  onSelect,
  disabled,
}: {
  profile: Profile;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border-[0.5px] text-left transition-colors ${
        selected
          ? "border-rose bg-rose-light"
          : "border-border bg-bg hover:bg-bg-2"
      } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
    >
      <Avatar profile={profile} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-ink truncate">
          {profile.display_name ?? "Sin nombre"}
        </p>
        <p className="text-[11px] text-ink-3 font-light">
          {[profile.age ? `${profile.age} años` : null, profile.city].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>
      {selected && (
        <span className="text-rose text-[18px] leading-none shrink-0">✓</span>
      )}
    </button>
  );
}

const GENDER_LABEL: Record<string, string> = { male: "Hombre", female: "Mujer", other: "Otro" };
const SEEKING_LABEL: Record<string, string> = { male: "Hombres", female: "Mujeres", both: "Hombres y mujeres" };

function exportProfiles(profiles: Profile[]) {
  const lines: string[] = [];

  profiles.forEach((p, i) => {
    lines.push(`PERFIL ${i + 1} — ${p.display_name ?? "Sin nombre"}, ${p.age ?? "?"} años`);
    lines.push(`- Género: ${GENDER_LABEL[p.gender ?? ""] ?? "—"}`);
    lines.push(`- Busca: ${SEEKING_LABEL[p.seeking ?? ""] ?? "—"}, entre ${p.age_min ?? "?"} y ${p.age_max ?? "?"} años`);
    lines.push(`- Sobre mí: "${p.self_description ?? "—"}"`);
    lines.push(`- Qué busco: "${p.partner_description ?? "—"}"`);
    lines.push(`- Valores: ${(p.values ?? []).join(", ") || "—"}`);
    lines.push("");
    lines.push("---");
    lines.push("");
  });

  lines.push('Analiza estos perfiles y dime qué parejas son más compatibles entre sí, justificando brevemente cada sugerencia. Ten en cuenta género, lo que busca cada persona, el rango de edad, los valores y las descripciones.');

  const text = lines.join("\n");
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `toomatch-perfiles-${new Date().toISOString().split("T")[0]}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminMatchPanel({
  profiles,
  matches,
}: {
  profiles: Profile[];
  matches: Match[];
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(userId: string) {
    setError(null);
    setSuccess(null);
    setSelected((prev) => {
      if (prev.includes(userId)) return prev.filter((id) => id !== userId);
      if (prev.length >= 2) return [prev[1], userId];
      return [...prev, userId];
    });
  }

  function handleCreate() {
    if (selected.length !== 2) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await createMatchAction(selected[0], selected[1]);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Match creado correctamente.");
        setSelected([]);
        router.refresh();
      }
    });
  }

  function handleDelete(matchId: string) {
    startTransition(async () => {
      await deleteMatchAction(matchId);
      router.refresh();
    });
  }

  const profileMap = Object.fromEntries(profiles.map((p) => [p.user_id, p]));

  const activeMatches = matches.filter((m) => !m.unmatched_by);
  const oldMatches = matches.filter((m) => m.unmatched_by);

  return (
    <div className="flex flex-col gap-4">

      {/* ── Crear match ── */}
      <section className="bg-bg rounded-2xl px-4 py-4 border-[0.5px] border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[11px] uppercase tracking-[0.1em] text-ink-3 font-medium">
            Crear match manual
          </h2>
          <button
            type="button"
            onClick={() => exportProfiles(profiles)}
            className="text-[11px] text-rose-dark border-[0.5px] border-rose-mid bg-rose-light px-3 py-1.5 rounded-lg hover:opacity-70 transition-opacity"
          >
            Exportar para IA →
          </button>
        </div>
        <p className="text-[12px] text-ink-3 font-light mb-3">
          Selecciona dos personas. El orden no importa.
        </p>

        {profiles.length === 0 ? (
          <p className="text-[13px] text-ink-3 font-light text-center py-4">
            No hay usuarios con el perfil completo aún.
          </p>
        ) : (
          <div className="flex flex-col gap-1.5 mb-4 max-h-[40vh] overflow-y-auto">
            {profiles.map((p) => (
              <ProfileRow
                key={p.user_id}
                profile={p}
                selected={selected.includes(p.user_id)}
                onSelect={() => toggle(p.user_id)}
                disabled={false}
              />
            ))}
          </div>
        )}

        {selected.length === 2 && (
          <div className="bg-bg-2 rounded-xl px-3 py-2.5 mb-3 flex items-center gap-2">
            <Avatar profile={profileMap[selected[0]]} />
            <span className="text-ink-3 text-[13px]">+</span>
            <Avatar profile={profileMap[selected[1]]} />
            <div className="flex-1 ml-1">
              <p className="text-[12px] text-ink font-light">
                {profileMap[selected[0]]?.display_name ?? "?"} con {profileMap[selected[1]]?.display_name ?? "?"}
              </p>
            </div>
          </div>
        )}

        {error && <p className="text-[12px] text-rose-dark mb-2">{error}</p>}
        {success && <p className="text-[12px] text-[#3A9E6A] mb-2">{success}</p>}

        <button
          onClick={handleCreate}
          disabled={selected.length !== 2 || pending}
          className="w-full py-2.5 rounded-xl bg-ink text-bg text-[13px] disabled:opacity-40 transition-opacity"
        >
          {pending ? "Creando…" : "Crear match →"}
        </button>
      </section>

      {/* ── Matches activos ── */}
      <section className="bg-bg rounded-2xl px-4 py-4 border-[0.5px] border-border">
        <h2 className="text-[11px] uppercase tracking-[0.1em] text-ink-3 font-medium mb-3">
          Matches activos ({activeMatches.length})
        </h2>
        {activeMatches.length === 0 ? (
          <p className="text-[12px] text-ink-3 font-light">Ninguno todavía.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {activeMatches.map((m) => {
              const p1 = profileMap[m.user1_id];
              const p2 = profileMap[m.user2_id];
              return (
                <div key={m.id} className="flex items-center gap-2 bg-bg-2 rounded-xl px-3 py-2.5">
                  {p1 && <Avatar profile={p1} />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-ink font-light truncate">
                      {p1?.display_name ?? m.user1_id.slice(0, 8)} · {p2?.display_name ?? m.user2_id.slice(0, 8)}
                    </p>
                    <p className="text-[10px] text-ink-3">
                      {new Date(m.created_at).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  {p2 && <Avatar profile={p2} />}
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={pending}
                    className="text-[11px] text-rose-dark hover:opacity-70 ml-1 shrink-0"
                  >
                    Eliminar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Matches eliminados ── */}
      {oldMatches.length > 0 && (
        <section className="bg-bg rounded-2xl px-4 py-4 border-[0.5px] border-border">
          <h2 className="text-[11px] uppercase tracking-[0.1em] text-ink-3 font-medium mb-3">
            Deshechos ({oldMatches.length})
          </h2>
          <div className="flex flex-col gap-2">
            {oldMatches.map((m) => {
              const p1 = profileMap[m.user1_id];
              const p2 = profileMap[m.user2_id];
              return (
                <div key={m.id} className="flex items-center gap-2 bg-bg-2 rounded-xl px-3 py-2.5 opacity-60">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-ink font-light truncate">
                      {p1?.display_name ?? "?"} · {p2?.display_name ?? "?"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
