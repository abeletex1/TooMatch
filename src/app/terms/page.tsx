import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";

export const metadata = {
  title: "Términos de Uso — Too Match",
};

export default function TermsPage() {
  return (
    <MobileShell>
      <Topbar back="/" />
      <main className="flex flex-col px-7 pt-6 pb-12 gap-6 overflow-y-auto">
        <div>
          <p className="font-serif italic text-[12px] text-ink-3 uppercase tracking-widest mb-1">
            Legal
          </p>
          <h1 className="font-serif text-[28px] text-ink font-medium leading-tight">
            Términos de Uso
          </h1>
          <p className="text-[12px] text-ink-3 font-light mt-1">
            Última actualización: 3 de mayo de 2026
          </p>
        </div>

        <Section title="1. Aceptación">
          <p>
            Al crear una cuenta o usar Too Match aceptas estos términos. Si no
            estás de acuerdo, no uses el servicio.
          </p>
        </Section>

        <Section title="2. Elegibilidad">
          <p>
            Debes tener al menos 18 años para usar Too Match. Al registrarte
            confirmas que cumples este requisito.
          </p>
        </Section>

        <Section title="3. Tu cuenta">
          <ul className="list-disc pl-4 flex flex-col gap-1">
            <li>Eres responsable de mantener la confidencialidad de tu contraseña.</li>
            <li>Debes proporcionar información veraz sobre ti.</li>
            <li>No puedes crear cuentas falsas ni hacerte pasar por otra persona.</li>
            <li>Solo puedes tener una cuenta activa.</li>
          </ul>
        </Section>

        <Section title="4. Uso aceptable">
          <p>Está prohibido:</p>
          <ul className="list-disc pl-4 flex flex-col gap-1 mt-2">
            <li>Acosar, amenazar o insultar a otros usuarios.</li>
            <li>Enviar contenido sexual explícito no solicitado.</li>
            <li>Usar la app con fines comerciales o de spam.</li>
            <li>Intentar acceder a datos de otros usuarios.</li>
            <li>Usar bots o automatizaciones.</li>
          </ul>
          <p className="mt-2">
            Nos reservamos el derecho de suspender cuentas que incumplan estas
            normas sin previo aviso.
          </p>
        </Section>

        <Section title="5. Contenido que compartes">
          <p>
            Eres responsable de las fotos y textos que subes. Al compartirlos
            nos concedes una licencia limitada para mostrarlos dentro de la app
            con el propósito de conectarte con otros usuarios.
          </p>
          <p className="mt-2">
            No subas fotos de terceros sin su consentimiento ni contenido que
            infrinja derechos de autor.
          </p>
        </Section>

        <Section title="6. El servicio">
          <p>
            Too Match ofrece un match por día. No garantizamos que encuentres
            pareja ni que el servicio esté disponible de forma ininterrumpida.
          </p>
          <p className="mt-2">
            Podemos modificar o interrumpir el servicio en cualquier momento,
            notificándote con antelación razonable cuando sea posible.
          </p>
        </Section>

        <Section title="7. Limitación de responsabilidad">
          <p>
            Too Match no se hace responsable de las interacciones entre
            usuarios fuera de la plataforma. Actúa siempre con precaución al
            conocer a alguien en persona.
          </p>
        </Section>

        <Section title="8. Ley aplicable">
          <p>
            Estos términos se rigen por la legislación española. Cualquier
            disputa se someterá a los tribunales de España.
          </p>
        </Section>

        <Section title="9. Contacto">
          <p>
            Para cualquier consulta sobre estos términos escríbenos a{" "}
            <a href="mailto:hola@toomatch.app" className="text-rose underline">
              hola@toomatch.app
            </a>
            .
          </p>
        </Section>
      </main>
    </MobileShell>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-serif italic text-[17px] text-ink">{title}</h2>
      <div className="text-[14px] text-ink-2 font-light leading-relaxed flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}
