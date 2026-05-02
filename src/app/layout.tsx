import type { Metadata } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Too Match",
  description: "Stop likes. Start match.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      {/* suppressHydrationWarning: necesario porque algunos navegadores
          (Safari iOS, content blockers, gestores de contraseñas) inyectan
          atributos en <body> antes de que React hidrate y eso disparaba
          un error de hydration mismatch. */}
      <body className="bg-bg-3 antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
