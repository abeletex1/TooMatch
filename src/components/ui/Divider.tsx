/**
 * Divisor horizontal con texto centrado opcional.
 * Ej.: <Divider text="o con correo" />
 */
export default function Divider({ text }: { text?: string }) {
  return (
    <div className="flex items-center gap-2.5 my-1">
      <div className="flex-1 h-px bg-border-strong" />
      {text ? (
        <span className="text-[11px] text-ink-3 font-light">{text}</span>
      ) : null}
      <div className="flex-1 h-px bg-border-strong" />
    </div>
  );
}
