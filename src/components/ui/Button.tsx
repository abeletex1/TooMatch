import { ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "ink" | "rose" | "outline" | "ghost";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-xl font-sans transition-opacity disabled:opacity-50 disabled:cursor-not-allowed";

const sizes = "px-4 py-[13px] text-[13px]";

const variants: Record<Variant, string> = {
  ink: "bg-ink text-bg hover:opacity-90 border-[0.5px] border-ink",
  rose: "bg-rose text-bg hover:opacity-90 border-[0.5px] border-rose",
  outline:
    "bg-bg text-ink border-[0.5px] border-border-strong hover:bg-bg-2",
  ghost: "bg-transparent text-rose hover:opacity-80",
};

/**
 * Devuelve las clases de un botón según la variante. Útil para aplicar el
 * mismo estilo a un <Link> de Next.js sin envolver botón dentro de un anchor.
 */
export function buttonClasses(
  variant: Variant = "ink",
  fullWidth?: boolean,
  extra = ""
) {
  return `${base} ${sizes} ${variants[variant]} ${
    fullWidth ? "w-full" : ""
  } ${extra}`;
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  fullWidth?: boolean;
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "ink", fullWidth, className = "", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={buttonClasses(variant, fullWidth, className)}
      {...rest}
    />
  );
});

export default Button;
