# Too Match — Resumen del proyecto

> Documento de referencia. Para detalles visuales, abrir `docs/too-match-prototype.html` en un navegador.

## Concepto

App de citas con un enfoque distinto al de Tinder/Bumble:

- **Stop likes. Start match.** Un único match garantizado al día.
- **Personalidad antes que apariencia.** Las fotos del match están bloqueadas hasta intercambiar 5 mensajes.
- **Sin scroll infinito ni gamificación.** "No ganamos dinero con tu frustración."
- **Privacidad fuerte.** Nadie ve tu perfil hasta que haya match mutuo.

## Stack técnico

- **Frontend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS v4
- **Backend / DB / Auth:** Supabase (Postgres + Auth + Storage)

## Identidad visual

### Colores

| Token         | Hex       | Uso                              |
|---------------|-----------|----------------------------------|
| `--bg`        | `#FAF7F2` | fondo principal (crema)          |
| `--bg2`       | `#F2EDE4` | fondo secundario                 |
| `--bg3`       | `#E8E0D4` | fondo terciario                  |
| `--ink`       | `#1E1B17` | texto principal                  |
| `--ink2`      | `#6B6258` | texto secundario                 |
| `--ink3`      | `#A8A099` | texto terciario / placeholders   |
| `--rose`      | `#C4735A` | acento principal (terracota)     |
| `--rose-light`| `#F5E8E3` | fondo con acento                 |
| `--rose-mid`  | `#E8B4A0` | bordes con acento                |
| `--rose-dark` | `#8C4A35` | texto sobre rose-light           |
| `--green`     | `#6B8C7E` | logo (símbolo infinito)          |

### Tipografía

- **Cormorant Garamond** (serif) — títulos, logo, nombres, promesas. Pesos 400/500. Italic para énfasis.
- **Inter** (sans) — texto, botones, labels. Pesos 300/400/500.

## Flujo de pantallas

1. **Auth landing** — Logo + "Stop likes. Start match." + Crear cuenta / Iniciar sesión
2. **Sign up** — Email + password (mín 6) o Google
3. **Sign in** — Usuarios existentes saltan onboarding y van directo al match del día
4. **Welcome slides (4)** — Personalidad → Privacidad → Match garantizado → Mejora con el tiempo
5. **Brand screen** — "No ganamos dinero con tu frustración" → Crear mi perfil
6. **Onboarding (7 pasos)**
   1. ¿Quién eres? (texto libre + guías de escritura)
   2. ¿Qué buscas? (texto libre + guías de escritura)
   3. Valores (pills, hasta 4)
   4. Soy Hombre/Mujer · Busco Hombre/Mujer/Ambos
   5. Mi edad + rango de edad buscado (sliders)
   6. Distancia (slider + recomendación según densidad de usuarios)
   7. Fotos (hasta 6, la primera es la foto principal)
7. **Día 0** — "Perfil completado. Mañana tu primer match."
8. **Día 1+** — Nav inferior con 4 pestañas:
   - Pregunta diaria
   - Match
   - Chats
   - Perfil
9. **Match del día** — Hero con avatar (sin foto), nombre, traits, % de compatibilidad por barras
10. **Lista de chats** — Matches activos con preview y badge de no leídos
11. **Chat** — Header con flecha + avatar + nombre clickable. A los 5 mensajes se desbloquean fotos
12. **Perfil del match** — Quién es, qué busca, valores, fotos (locked o unlocked)
13. **Mi perfil** — Foto principal, descripción, valores, fotos, preferencias. Todo editable
14. **Pregunta diaria** — Una pregunta + 4 opciones. Al responder se queda en la misma pantalla con confirmación

## Reglas de negocio clave

- Foto bloqueada → se desbloquea a partir del 5º mensaje intercambiado
- Foto de perfil = primera foto subida en onboarding
- Día 0 = onboarding. El primer match llega al Día 1
- Sign in salta TODO el onboarding
- 1 match diario garantizado si el usuario participa
- Unmatch requiere razón (pendiente)
- Distancia recomendada según densidad de usuarios cercanos

## Modelo de datos (Supabase)

```
users
  id, email, created_at

profiles
  user_id, self_description, partner_description,
  values[], gender, seeking,
  age, age_min, age_max, distance_km, city,
  photos[], day_number

matches
  id, user1_id, user2_id, compatibility_score,
  created_at, day_number

messages
  id, match_id, sender_id, text, created_at

daily_questions
  id, question_text, options[], date

daily_answers
  user_id, question_id, answer, created_at
```

## Orden sugerido de construcción

1. Configurar tokens de diseño (colores + fuentes) en `globals.css`
2. Crear layout base (mobile-first, max-width ~400px) y componentes primitivos: `Button`, `Input`, `Pill`, `Slide`
3. Pantalla `Auth landing` (sin lógica todavía)
4. Conectar Supabase (auth con email/password y Google)
5. Welcome slides + brand screen
6. Onboarding paso a paso (1 archivo de página por paso, estado compartido)
7. Esquema de tablas en Supabase + guardar perfil al terminar onboarding
8. Pantalla "Match del día" con datos mock
9. Algoritmo de match básico + cron diario
10. Chat (lista + conversación) con realtime de Supabase
11. Lógica de desbloqueo de fotos a los 5 mensajes
12. Pregunta diaria
13. Perfil propio editable
14. Pulido visual + accesibilidad + estados vacíos
