/**
 * Rate limiter en memoria.
 *
 * Funciona como un "cubo con agujero": cada IP tiene un contador que se
 * resetea pasado el tiempo de ventana. Si el contador supera el límite,
 * rechaza la petición.
 *
 * Limitación: en producción serverless cada instancia tiene su propia memoria,
 * así que no es 100% global — pero sí protege contra ataques desde una sola
 * instancia y añade fricción suficiente para el caso de uso actual.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

// Limpia entradas caducadas cada 5 minutos para no acumular memoria
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count };
}
