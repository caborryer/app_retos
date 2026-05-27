/**
 * Safely parse JSON API responses. Avoids "JSON.parse: unexpected end of data"
 * when the server returns an empty body (common on unhandled 500 errors).
 */
export async function readApiJson<T = unknown>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function readApiJsonOrThrow<T = unknown>(
  res: Response,
  fallbackMessage: string
): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      res.ok
        ? fallbackMessage
        : `El servidor no respondió correctamente (código ${res.status}). Intenta de nuevo en unos segundos.`
    );
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `Respuesta inválida del servidor (código ${res.status}). Intenta de nuevo.`
    );
  }
}
