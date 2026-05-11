"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { changePasswordAction, changeEmailAction, resetOnboardingAction, deleteAccountAction, logoutAction } from "./actions";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-ink-3 px-5 pt-4 pb-2">{title}</p>
      <div className="bg-bg rounded-2xl mx-3 overflow-hidden divide-y divide-bg-2">
        {children}
      </div>
    </div>
  );
}

function Row({ icon, label, onClick, destructive = false }: {
  icon: React.ReactNode; label: string; onClick?: () => void; destructive?: boolean;
}) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-bg-2 transition-colors text-left ${destructive ? "text-red-500" : "text-ink"}`}>
      <span className={`${destructive ? "text-red-400" : "text-ink-3"}`}>{icon}</span>
      <span className="text-[14px] font-light flex-1">{label}</span>
      {!destructive && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-3">
          <path d="M9 18l6-6-6-6" />
        </svg>
      )}
    </button>
  );
}

function InlineForm({ title, onClose, fields, submitLabel, successMsg, action }: {
  title: string;
  onClose: () => void;
  fields: { name: string; label: string; type: string; placeholder: string }[];
  submitLabel: string;
  successMsg: string;
  action: (fd: FormData) => Promise<{ error?: string; success?: boolean }>;
}) {
  const t = useTranslations("common");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await action(fd);
      if (res.error) setError(res.error);
      else setSuccess(true);
    });
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
        <div className="bg-bg rounded-t-[24px] w-full max-w-[420px] px-6 pt-5 pb-10" onClick={(e) => e.stopPropagation()}>
          <div className="w-9 h-[3px] bg-bg-3 rounded-full mx-auto mb-5" />
          <div className="text-center py-6">
            <p className="font-serif text-[20px] text-ink mb-2">{t("done")}</p>
            <p className="text-[13px] text-ink-3 font-light">{successMsg}</p>
          </div>
          <button onClick={onClose} className="w-full py-3 rounded-xl bg-ink text-bg text-[14px]">{t("close")}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="bg-bg rounded-t-[24px] w-full max-w-[420px] px-6 pt-5 pb-10" onClick={(e) => e.stopPropagation()}>
        <div className="w-9 h-[3px] bg-bg-3 rounded-full mx-auto mb-5" />
        <h3 className="font-serif text-[18px] text-ink font-medium mb-5">{title}</h3>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="text-[11px] text-ink-3 block mb-1">{f.label}</label>
              <input name={f.name} type={f.type} placeholder={f.placeholder}
                className="w-full border-[0.5px] border-border-strong rounded-xl px-4 py-3 text-[14px] font-light bg-bg text-ink outline-none focus:border-rose" />
            </div>
          ))}
          {error && <p className="text-[12px] text-red-500">{error}</p>}
          <button type="submit" disabled={pending}
            className="mt-2 py-3 rounded-xl bg-ink text-bg text-[14px] disabled:opacity-50">
            {pending ? t("saving") : submitLabel}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SettingsClient({ email, isAdmin = false }: { email: string; isAdmin?: boolean }) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [sheet, setSheet] = useState<"password" | "email" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col bg-bg-2 min-h-full pb-8">
      <div className="flex items-center gap-3 px-4 py-3 bg-bg border-b-[0.5px] border-border">
        <Link href="/profile" className="text-rose text-[22px] leading-none px-1 -ml-1">←</Link>
        <h1 className="font-serif text-[18px] text-ink font-medium">{t("title")}</h1>
      </div>

      <div className="pt-2">
        <Section title={t("sectionAccount")}>
          <div className="px-4 py-3 bg-bg">
            <p className="text-[11px] text-ink-3">{t("currentEmail")}</p>
            <p className="text-[14px] text-ink font-light">{email}</p>
          </div>
          <Row icon={<MailIcon />} label={t("changeEmail")} onClick={() => setSheet("email")} />
          <Row icon={<LockIcon />} label={t("changePassword")} onClick={() => setSheet("password")} />
        </Section>

        <Section title={t("sectionPreferences")}>
          <Row icon={<RefreshIcon />} label={t("repeatOnboarding")}
            onClick={() => startTransition(() => resetOnboardingAction())} />
        </Section>

        <Section title={t("sectionLegal")}>
          <Link href="/privacy" className="flex items-center gap-3 px-4 py-3.5 hover:bg-bg-2 transition-colors">
            <span className="text-ink-3"><DocIcon /></span>
            <span className="text-[14px] font-light text-ink flex-1">{t("privacyPolicy")}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-3"><path d="M9 18l6-6-6-6" /></svg>
          </Link>
          <Link href="/terms" className="flex items-center gap-3 px-4 py-3.5 hover:bg-bg-2 transition-colors">
            <span className="text-ink-3"><DocIcon /></span>
            <span className="text-[14px] font-light text-ink flex-1">{t("termsOfUse")}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-3"><path d="M9 18l6-6-6-6" /></svg>
          </Link>
        </Section>

        {isAdmin && (
          <Section title={t("sectionAdmin")}>
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3.5 hover:bg-bg-2 transition-colors">
              <span className="text-ink-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
                </svg>
              </span>
              <span className="text-[14px] font-light text-ink flex-1">{t("adminPanel")}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-3"><path d="M9 18l6-6-6-6" /></svg>
            </Link>
          </Section>
        )}

        <Section title={t("sectionSession")}>
          <Row icon={<LogoutIcon />} label={t("logout")}
            onClick={() => startTransition(() => logoutAction())} />
          <Row icon={<TrashIcon />} label={t("deleteAccount")} destructive onClick={() => setConfirmDelete(true)} />
        </Section>
      </div>

      {sheet === "email" && (
        <InlineForm title={t("changeEmailTitle")} onClose={() => setSheet(null)}
          fields={[{ name: "email", label: t("newEmailLabel"), type: "email", placeholder: t("newEmailPlaceholder") }]}
          submitLabel={t("sendConfirmation")}
          successMsg={t("emailChangeSent")}
          action={changeEmailAction} />
      )}

      {sheet === "password" && (
        <InlineForm title={t("changePasswordTitle")} onClose={() => setSheet(null)}
          fields={[
            { name: "password", label: t("newPasswordLabel"), type: "password", placeholder: t("newPasswordHint") },
            { name: "confirm", label: t("confirmPasswordLabel"), type: "password", placeholder: t("confirmPasswordPlaceholder") },
          ]}
          submitLabel={t("savePassword")}
          successMsg={t("passwordChanged")}
          action={changePasswordAction} />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setConfirmDelete(false)}>
          <div className="bg-bg rounded-t-[24px] w-full max-w-[420px] px-6 pt-5 pb-10" onClick={(e) => e.stopPropagation()}>
            <div className="w-9 h-[3px] bg-bg-3 rounded-full mx-auto mb-5" />
            <h3 className="font-serif text-[18px] text-ink font-medium mb-2">{t("deleteTitle")}</h3>
            <p className="text-[13px] text-ink-3 font-light mb-6 leading-relaxed">
              {t("deleteBody")}
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => startTransition(() => deleteAccountAction())} disabled={pending}
                className="py-3 rounded-xl bg-red-500 text-white text-[14px] disabled:opacity-50">
                {pending ? "..." : t("deleteConfirm")}
              </button>
              <button onClick={() => setConfirmDelete(false)}
                className="py-3 rounded-xl bg-bg-2 text-ink text-[14px]">{tCommon("cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MailIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>;
}
function LockIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function RefreshIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>;
}
function LogoutIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function TrashIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}
function DocIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
}
