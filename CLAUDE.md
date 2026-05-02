# Too Match

> Contexto del proyecto para Claude Code. Léelo entero antes de hacer cambios.

## Concepto

Too Match es una app de citas con un enfoque distinto a Tinder/Bumble:

- **Stop likes. Start match** — un único match al día.
- **Personalidad antes que apariencia** — las fotos del match están borrosas hasta intercambiar 7 mensajes.
- **Sin scroll infinito ni gamificación** — *"no ganamos dinero con tu frustración"*.
- **Privacidad fuerte** — nadie ve tu perfil hasta que hay match mutuo.

## Stack técnico

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Estilos**: Tailwind CSS v4 con `@theme` en `src/app/globals.css` (no hay `tailwind.config.js` — todo se declara en CSS)
- **Backend / Auth / DB / Storage**: Supabase (`@supabase/supabase-js` + `@supabase/ssr`)
- **Fuentes**: Cormorant Garamond + Inter via `next/font/google`

Variables de entorno en `.env.local` (no commiteado):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Schema de Supabase en `docs/supabase-schema.sql`.

## Estructura

```
src/
├── app/
│   ├── page.tsx                # Auth landing (redirige a /match o /welcome si hay sesión)
│   ├── login/, signup/         # auth con email/password
│   ├── signup/check-email/     # "Revisa tu correo" tras signup
│   ├── auth/callback/          # PKCE callback de Supabase
│   ├── auth/error/             # enlace de email caducado
│   ├── logout/actions.ts       # signOut + redirect a /
│   ├── welcome/                # 4 slides educativas
│   ├── brand/                  # manifiesto pre-onboarding
│   ├── onboarding/             # 7 pasos: descripción, valores, género, edad, distancia, fotos
│   ├── day-0/                  # "Perfil completado, mañana tu primer match"
│   ├── match/                  # match del día (server + MatchPageClient para empty state)
│   ├── chats/                  # lista (server + ChatsListClient para filtrado)
│   ├── chats/[id]/             # conversación con MatchAvatar y UnmatchSheet
│   ├── match-profile/[id]/     # perfil del match (estilo Tinder cards)
│   ├── profile/                # mi perfil (estilo Tinder cards)
│   ├── question/               # pregunta diaria con DailyQuestion client
│   ├── globals.css             # tokens Tailwind v4 + animaciones
│   ├── layout.tsx              # Cormorant + Inter, suppressHydrationWarning
│   └── middleware.ts           # refresca sesión Supabase cada request
├── components/ui/              # primitivos: Button, Input, Logo, BottomNav, etc.
├── lib/
│   ├── supabase/               # client.ts (browser), server.ts (RSC), middleware.ts
│   ├── auth/redirect.ts        # getPostAuthRedirect — decide /welcome o /match
│   ├── mock/matches.ts         # LUCIA hardcoded, UNLOCK_AFTER_MESSAGES = 7
│   ├── use-match-unlocked.ts   # hook + setter (localStorage)
│   └── use-match-unmatched.ts  # hook + setter (localStorage)
docs/
├── PROYECTO.md
├── supabase-schema.sql         # tabla profiles + bucket profile-photos + RLS
└── too-match-prototype.html    # referencia visual del prototipo (vibe coding)
```

## Sistema de diseño

Tokens en `globals.css` (Tailwind v4 los expone como `bg-rose`, `text-ink`, etc.):

| Token              | Hex       | Uso                              |
|--------------------|-----------|----------------------------------|
| `bg`               | `#FAF7F2` | fondo principal (crema claro)    |
| `bg-2`             | `#F2EDE4` | fondo secundario                 |
| `bg-3`             | `#E8E0D4` | fondo terciario                  |
| `ink`              | `#1E1B17` | texto principal                  |
| `ink-2`            | `#6B6258` | texto secundario                 |
| `ink-3`            | `#A8A099` | texto terciario / placeholders   |
| `rose`             | `#C4735A` | acento principal (terracota)     |
| `rose-light`       | `#F5E8E3` | fondo con acento                 |
| `rose-mid`         | `#E8B4A0` | bordes con acento                |
| `rose-dark`        | `#8C4A35` | texto sobre rose-light           |
| `green`            | `#6B8C7E` | infinito del logo (sage)         |

Fuentes:
- `font-serif` → Cormorant Garamond. **Italic para énfasis** (la palabra emocional de un título).
- `font-sans` → Inter. Weights 300/400/500. 300 (light) por defecto.

Idioma de UI: **español**. Inglés solo en el tagline del logo (*"Stop likes. Start match"*).

Tono de copy: calmo, intencional, sin clichés. Brand voice "personality first".

## Componentes clave

- `MobileShell` — contenedor con max-width 420px en escritorio (h capada a 760px), full screen en móvil. `position:relative` para overlays.
- `Topbar` — logo pequeño + slot derecho ("Día N" o vacío) + flecha atrás opcional.
- `BottomNav` — 4 tabs: Pregunta / Match / Chats / Perfil. Activa según `usePathname`.
- `Logo` — T (serif ink) + ∞ SVG sage + MATCH (caps espaciadas). Tamaños sm/lg.
- `InfinitySymbol` — SVG figura-8 con color sage hardcoded (`#6B8C7E`).
- `MatchAvatar` — foto borrosa cuando bloqueado, clara y clickable cuando desbloqueado. Lee `useMatchUnlocked` o acepta `forceUnlocked`. Soporta `glowPulse`.
- `Button` y `buttonClasses(variant, fullWidth, extra)` — variantes: `ink` (negro), `rose`, `outline`, `ghost`. El helper `buttonClasses` permite aplicar el estilo a `<Link>` sin meter botones en anchors (HTML válido).
- `UnmatchSheet` — bottom sheet con razón obligatoria. Renderiza dentro de `MobileShell` con overlay `absolute inset-0`.
- `CountUp` — anima un número de 0 al target con easing cubic-out.

## Reglas de negocio

- **Fotos bloqueadas hasta 7 mensajes** intercambiados. Constante única: `UNLOCK_AFTER_MESSAGES` en `src/lib/mock/matches.ts`.
- **Foto principal = primera foto subida** en el onboarding.
- **1 match al día.** Si el usuario lo deshace, no llega otro hasta mañana.
- **Día 0** = onboarding recién completado. **Día 1+** = matches activos.
- **Login salta el onboarding** si `profiles.onboarding_completed = true`. Lo decide `getPostAuthRedirect()`.
- **Pregunta diaria** — al responder muestra confirmación in-place; no navega.
- **Unmatch requiere razón** (5 opciones predefinidas, hoy en localStorage).

## Estado de los datos

**Real (Supabase):**
- Tabla `profiles` con todos los campos del onboarding + `onboarding_completed` + `day_number`.
- Storage bucket `profile-photos` (público, RLS solo permite escribir en carpeta `{user_id}/...`).
- Auth con confirmación de email vía PKCE.

**Mock (localStorage / hardcoded — pendiente de migrar a backend):**
- Match del día = constante `LUCIA` en `src/lib/mock/matches.ts`.
- Mensajes del chat = `useState` cliente, se pierden al recargar.
- Estado de desbloqueo: `localStorage["too-match:unlocked:{matchId}"]`.
- Estado de unmatch: `localStorage["too-match:unmatched:{matchId}"]`.
- Pregunta diaria: hardcoded en `src/app/question/page.tsx`.

## Patrones de código

- **Auth en server components**:
  ```ts
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  ```
- **Server actions** (`"use server"`) para mutaciones: `signupAction`, `loginAction`, `saveProfileAction`, `logoutAction`.
- **Hidratación con localStorage**: el server renderiza en estado "neutral" (e.g. unlocked=false), el cliente lee localStorage en `useEffect` y re-renderiza. Sin hydration mismatch.
- **`<Link>` con estilos de Button**: usar `buttonClasses(variant, fullWidth)` para no meter `<button>` dentro de `<a>` (HTML inválido).
- **`suppressHydrationWarning`** en `<html>` y `<body>` para tolerar atributos inyectados por navegadores móviles (Safari iOS).

## Comandos

```bash
npm install        # instalar dependencias
npm run dev        # dev server con Turbopack, escuchando en 0.0.0.0:3000
npm run build      # build de producción (verifica antes de desplegar)
npm run lint       # ESLint
```

Scripts auxiliares en raíz (Windows):
- `INSTALAR.bat` — `npm install`
- `INICIAR.bat` — `npm run dev`
- `IP-MOVIL.bat` — genera HTML con QR para acceder desde móvil en la misma WiFi

## Próximos pasos (en orden recomendado)

1. **Desplegar a Vercel** para validar el concepto con 3-5 personas reales antes de seguir construyendo backend.
2. **Tabla `messages` + chat persistente** — quitar el `useState` mock, usar Supabase Realtime para tiempo real.
3. **Tabla `matches` + matching simple** — algoritmo básico de compatibilidad por valores/edad/género/distancia.
4. **Edición de perfil** — sheets modales sección a sección sobre `/profile`.
5. **Tabla `daily_questions` + `daily_answers`** — pregunta diaria persistente.
6. **Cron de matching diario** — Edge Function de Supabase.
7. **Google OAuth** — el botón ya está, falta cablear (Authentication → Providers → Google en Supabase).
8. **Imágenes optimizadas** — pasar de `<img>` a `next/image` con loader de Storage.
9. **Push notifications** cuando llega match nuevo o mensaje.

## Notas para Claude Code

- **El prototipo manda**. Cuando dudes del visual, abre `docs/too-match-prototype.html` y respeta sus tokens y patrones.
- **No introducir librerías de UI nuevas** (shadcn, MUI, Radix, etc.). Los primitivos los hacemos a mano por minimalismo y control de estilo.
- **Mobile-first**. Toda pantalla nueva va dentro de `MobileShell`.
- **Iconos custom en SVG inline**. Hay un `src/components/ui/icons.tsx` con los compartidos (Quote, IDCard, Search, Tag, Image, Pin, User, Heart, Calendar, Compass).
- **No tocar `next-env.d.ts`** — lo regenera Next.
- **Antes de un cambio grande**, lee la pantalla relevante completa para entender el patrón. La consistencia visual entre pantallas es prioridad.
