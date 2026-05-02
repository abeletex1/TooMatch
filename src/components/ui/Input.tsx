import { InputHTMLAttributes, LabelHTMLAttributes, forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full px-3.5 py-[11px] rounded-xl border-[0.5px] border-border-strong bg-bg text-ink text-[13px] font-light font-sans outline-none transition-colors focus:border-rose placeholder:text-ink-3 placeholder:font-light ${className}`}
        {...rest}
      />
    );
  }
);

export default Input;

/**
 * Etiqueta de formulario en mayúsculas espaciadas, estilo Too Match.
 */
export function FormLabel({
  className = "",
  ...rest
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={`block text-[10px] uppercase tracking-[0.1em] text-ink-3 mb-1.5 ${className}`}
      {...rest}
    />
  );
}
