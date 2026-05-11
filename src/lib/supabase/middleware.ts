import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión de Supabase en cada request. Esto es necesario
 * para que los Server Components vean el usuario autenticado más reciente.
 */
export async function updateSession(request: NextRequest, extraHeaders?: Record<string, string>) {
  const requestHeaders = new Headers(request.headers);
  if (extraHeaders) {
    Object.entries(extraHeaders).forEach(([k, v]) => requestHeaders.set(k, v));
  }

  let supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: no quitar esta llamada. Es la que refresca el token.
  await supabase.auth.getUser();

  return supabaseResponse;
}
