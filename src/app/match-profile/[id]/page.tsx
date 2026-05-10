import { ReactNode } from "react";
import Link from "next/link";
import ExpandableText from "@/components/ui/ExpandableText";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MobileShell from "@/components/ui/MobileShell";
import MatchAvatar from "@/components/ui/MatchAvatar";
import {
  QuoteIcon,
  IDCardIcon,
  SearchIcon,
  TagIcon,
  ImageIcon,
  PinIcon,
  UserIcon,
  HeartIcon,
  CalendarIcon,
} from "@/components/ui/icons";
import { MIN_MESSAGES_PER_USER } from "@/lib/mock/matches";
import { genderLabel, seekingLabel, type ProfileRow, type MatchRow } from "@/lib/types";

export default async function MatchProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ unlocked?: string }>;
}) {
  const { id: matchId } = await params;
  const { unlocked: unlockedParam } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verificar que el usuario es participante del match
  const { data: matchRow } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .maybeSingle();

  if (!matchRow) notFound();

  const partnerId =
    (matchRow as MatchRow).user1_id === user.id
      ? (matchRow as MatchRow).user2_id
      : (matchRow as MatchRow).user1_id;

  // Perfil del partner + mensajes en paralelo
  const [{ data: partnerProfile }, { data: allMessages }] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", partnerId).maybeSingle(),
    supabase
      .from("messages")
      .select("sender_id")
      .eq("match_id", matchId),
  ]);

  if (!partnerProfile) notFound();

  const p = partnerProfile as ProfileRow;
  const name = p.display_name?.trim() || "Perfil";
  const myMsgCount = (allMessages ?? []).filter((m) => m.sender_id === user.id).length;
  const partnerMsgCount = (allMessages ?? []).filter((m) => m.sender_id === partnerId).length;
  const unlocked =
    unlockedParam !== undefined ||
    (myMsgCount >= MIN_MESSAGES_PER_USER && partnerMsgCount >= MIN_MESSAGES_PER_USER);

  return (
    <MobileShell>
      {/* Cabecera con gradient */}
      <header className="relative bg-gradient-to-br from-rose-light to-bg-2 px-5 pt-12 pb-5 text-center shrink-0">
        <Link
          href={`/chats/${matchId}`}
          aria-label="Volver al chat"
          className="absolute top-4 left-4 text-rose text-[22px] leading-none hover:opacity-70"
        >
          ←
        </Link>

        <div className="flex justify-center mb-3">
          <MatchAvatar
            matchId={matchId}
            initial={name.charAt(0).toUpperCase()}
            photoUrl={p.photos[0]}
            size="lg"
            unlocked={unlocked}
          />
        </div>

        <h1 className="font-serif text-[24px] text-ink font-medium">
          {name}{" "}
          {p.age ? <span className="font-light text-ink-2">{p.age}</span> : null}
        </h1>
        {p.city ? (
          <p className="text-[12px] text-ink-2 font-light mt-0.5">{p.city}</p>
        ) : null}
      </header>

      {/* Cuerpo con tarjetas */}
      <main className="flex-1 overflow-y-auto bg-bg-2 px-3 py-3 flex flex-col gap-2.5">
        {p.self_description ? (
          <Card icon={<QuoteIcon />} title={`Sobre ${name}`}>
            <ExpandableText text={p.self_description} title={`Sobre ${name}`} />
          </Card>
        ) : null}

        <Card icon={<IDCardIcon />} title="Lo básico">
          {p.age ? (
            <BasicRow icon={<CalendarIcon />} text={`${p.age} años`} />
          ) : null}
          {p.city ? (
            <BasicRow icon={<PinIcon />} text={p.city} />
          ) : null}
          {p.gender ? (
            <BasicRow icon={<UserIcon />} text={genderLabel(p.gender)} />
          ) : null}
          {p.seeking ? (
            <BasicRow icon={<HeartIcon />} text={`Busca: ${seekingLabel(p.seeking)}`} />
          ) : null}
        </Card>

        {p.partner_description ? (
          <Card icon={<SearchIcon />} title={`Lo que ${name} busca`}>
            <ExpandableText text={p.partner_description} title={`Lo que ${name} busca`} />
          </Card>
        ) : null}

        {p.values.length > 0 ? (
          <Card icon={<TagIcon />} title="Lo que valora">
            <div className="flex flex-wrap gap-1.5">
              {p.values.map((v) => (
                <span
                  key={v}
                  className="px-3 py-1 rounded-full text-[12px] bg-rose-light text-rose-dark border-[0.5px] border-rose-mid font-light"
                >
                  {v}
                </span>
              ))}
            </div>
          </Card>
        ) : null}

        <Card icon={<ImageIcon />} title="Fotos">
          {unlocked ? (
            p.photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-1.5">
                {p.photos.map((url, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-[10px] overflow-hidden bg-bg-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Foto ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-ink-3 font-light text-center py-2">
                Sin fotos todavía.
              </p>
            )
          ) : (
            <>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-[10px] bg-bg-2 border-[0.5px] border-dashed border-border-strong flex flex-col items-center justify-center gap-1"
                  >
                    <SmallLockIcon />
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-ink-3 font-light text-center leading-[1.5]">
                Las fotos se desbloquean cuando cada uno haya enviado al menos {MIN_MESSAGES_PER_USER} mensajes.
              </p>
            </>
          )}
        </Card>
      </main>
    </MobileShell>
  );
}

/* ===== Helpers ============================================================ */

function Card({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="bg-bg rounded-2xl px-4 py-4 border-[0.5px] border-border">
      <div className="flex items-center gap-2 mb-2.5 text-ink-3">
        {icon}
        <h3 className="text-[11px] uppercase tracking-[0.1em] font-medium">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

function BasicRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 border-b-[0.5px] border-border last:border-b-0 text-ink-2">
      <span className="text-ink-3">{icon}</span>
      <span className="text-[13px] font-light">{text}</span>
    </div>
  );
}

function SmallLockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#A8A099"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11 V7 C 8 4.79 9.79 3 12 3 C 14.21 3 16 4.79 16 7 V11" />
    </svg>
  );
}
