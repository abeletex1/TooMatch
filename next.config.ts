import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  // Impide que el navegador adivine el tipo de archivo (e.g. ejecutar un .txt como JS)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Impide que la app se cargue dentro de un iframe (protege contra clickjacking)
  { key: "X-Frame-Options", value: "DENY" },
  // No filtra la URL de origen al navegar a otro sitio
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desactiva acceso a cámara/geolocalización; micrófono permitido solo en la propia app (grabación de voz)
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
  // Fuerza HTTPS durante 1 año e incluye subdominios
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
