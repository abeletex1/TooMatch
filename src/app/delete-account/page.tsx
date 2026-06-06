import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";

export const metadata = {
  title: "Eliminar cuenta — Too Match",
};

export default function DeleteAccountPage() {
  return (
    <MobileShell>
      <Topbar back="/profile" />
      <main className="flex flex-col px-7 pt-6 pb-12 gap-6 overflow-y-auto">
        <div>
          <p className="font-serif italic text-[12px] text-ink-3 uppercase tracking-widest mb-1">
            Cuenta
          </p>
          <h1 className="font-serif text-[28px] text-ink font-medium leading-tight">
            Eliminar cuenta
          </h1>
        </div>

        <div className="flex flex-col gap-4 text-[14px] text-ink-2 font-light leading-relaxed">
          <p>
            Si deseas eliminar tu cuenta y todos tus datos de Too Match, puedes
            hacerlo enviando un correo electrónico a{" "}
            <a href="mailto:hola@toomatch.app" className="text-rose underline">
              hola@toomatch.app
            </a>{" "}
            con el asunto <strong>"Eliminar mi cuenta"</strong>.
          </p>

          <p>Al eliminar tu cuenta se borrarán permanentemente:</p>

          <ul className="list-disc pl-4 flex flex-col gap-1">
            <li>Tu perfil y toda la información personal que hayas proporcionado.</li>
            <li>Tus fotos almacenadas.</li>
            <li>Tu historial de matches y conversaciones.</li>
            <li>Tus respuestas a las preguntas diarias.</li>
          </ul>

          <p>
            Procesaremos tu solicitud en un plazo máximo de <strong>30 días</strong>.
            Una vez eliminada, esta acción no se puede deshacer.
          </p>

          <p>
            Si tienes alguna duda, escríbenos a{" "}
            <a href="mailto:hola@toomatch.app" className="text-rose underline">
              hola@toomatch.app
            </a>
            .
          </p>
        </div>

        <a
          href="mailto:hola@toomatch.app?subject=Eliminar%20mi%20cuenta"
          className="mt-2 w-full text-center bg-ink text-bg py-3 rounded-xl text-[14px] font-light"
        >
          Enviar solicitud por email
        </a>
      </main>
    </MobileShell>
  );
}
