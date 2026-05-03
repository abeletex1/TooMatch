import MobileShell from "@/components/ui/MobileShell";
import Topbar from "@/components/ui/Topbar";

export const metadata = {
  title: "Política de Privacidad — Too Match",
};

export default function PrivacyPage() {
  return (
    <MobileShell>
      <Topbar back="/" />
      <main className="flex flex-col px-7 pt-6 pb-12 gap-6 overflow-y-auto">
        <div>
          <p className="font-serif italic text-[12px] text-ink-3 uppercase tracking-widest mb-1">
            Legal
          </p>
          <h1 className="font-serif text-[28px] text-ink font-medium leading-tight">
            Política de Privacidad
          </h1>
          <p className="text-[12px] text-ink-3 font-light mt-1">
            Última actualización: 3 de mayo de 2026
          </p>
        </div>

        <Section title="1. Quién somos">
          <p>
            Too Match es una aplicación de citas operada por Abel Expósito Roselló
            («nosotros», «nuestro»). Puedes contactarnos en{" "}
            <a href="mailto:hola@toomatch.app" className="text-rose underline">
              hola@toomatch.app
            </a>
            .
          </p>
        </Section>

        <Section title="2. Qué datos recogemos">
          <ul className="list-disc pl-4 flex flex-col gap-1">
            <li>Dirección de correo electrónico (para crear tu cuenta).</li>
            <li>Nombre o alias que nos proporcionas voluntariamente.</li>
            <li>
              Información de perfil: descripción personal, valores, género,
              orientación, edad, ciudad y fotos que subes tú mismo.
            </li>
            <li>
              Mensajes que intercambias con tus matches dentro de la app.
            </li>
            <li>
              Si usas «Continuar con Google», recibimos tu nombre y correo
              electrónico de Google. No accedemos a ningún otro dato de tu
              cuenta de Google.
            </li>
          </ul>
        </Section>

        <Section title="3. Para qué usamos tus datos">
          <ul className="list-disc pl-4 flex flex-col gap-1">
            <li>Crear y gestionar tu cuenta.</li>
            <li>Emparejarte con otros usuarios compatibles.</li>
            <li>Enviarte notificaciones sobre tu match del día por email.</li>
            <li>Mejorar el servicio y detectar usos indebidos.</li>
          </ul>
          <p className="mt-2">
            No vendemos tus datos a terceros ni los usamos para publicidad.
          </p>
        </Section>

        <Section title="4. Con quién compartimos tus datos">
          <p>
            Utilizamos proveedores de confianza para operar el servicio:
          </p>
          <ul className="list-disc pl-4 flex flex-col gap-1 mt-2">
            <li>
              <strong>Supabase</strong> — base de datos, autenticación y
              almacenamiento de fotos (alojado en la UE).
            </li>
            <li>
              <strong>Vercel</strong> — alojamiento de la aplicación web.
            </li>
            <li>
              <strong>Resend</strong> — envío de emails transaccionales.
            </li>
          </ul>
          <p className="mt-2">
            Todos ellos actúan como encargados del tratamiento bajo acuerdos
            de protección de datos.
          </p>
        </Section>

        <Section title="5. Cuánto tiempo guardamos tus datos">
          <p>
            Conservamos tus datos mientras tu cuenta esté activa. Si eliminas
            tu cuenta, borraremos tus datos personales en un plazo de 30 días,
            salvo obligación legal de conservación.
          </p>
        </Section>

        <Section title="6. Tus derechos">
          <p>
            Tienes derecho a acceder, rectificar, suprimir y portar tus datos,
            así como a oponerte a su tratamiento. Para ejercer cualquiera de
            estos derechos, escríbenos a{" "}
            <a href="mailto:hola@toomatch.app" className="text-rose underline">
              hola@toomatch.app
            </a>
            .
          </p>
          <p className="mt-2">
            Si estás en la UE o el EEE, también puedes presentar una
            reclamación ante tu autoridad de protección de datos local.
          </p>
        </Section>

        <Section title="7. Cookies y almacenamiento local">
          <p>
            Usamos cookies de sesión estrictamente necesarias para mantener tu
            sesión iniciada. No usamos cookies de seguimiento ni publicidad.
          </p>
        </Section>

        <Section title="8. Cambios en esta política">
          <p>
            Si realizamos cambios significativos, te lo notificaremos por
            email o mediante un aviso en la app antes de que entren en vigor.
          </p>
        </Section>

        <p className="text-[12px] text-ink-3 font-light text-center mt-4">
          ¿Preguntas?{" "}
          <a href="mailto:hola@toomatch.app" className="text-rose underline">
            hola@toomatch.app
          </a>
        </p>
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
