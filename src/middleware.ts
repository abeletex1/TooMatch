import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { routing } from "@/i18n/routing";

export async function middleware(request: NextRequest) {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  const locale = (cookieLocale && (routing.locales as readonly string[]).includes(cookieLocale))
    ? cookieLocale
    : routing.defaultLocale;

  return await updateSession(request, { "x-next-intl-locale": locale });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
