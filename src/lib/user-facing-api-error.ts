/** Maps API responses to short Spanish messages for alerts / toasts. */
export async function userFacingApiError(
  res: Response,
  context: 'upload' | 'submit',
): Promise<string> {
  let serverMsg = '';
  try {
    const j = (await res.json()) as { error?: string };
    if (j?.error && typeof j.error === 'string') serverMsg = j.error;
  } catch {
    /* ignore */
  }

  if (res.status === 401) {
    return 'Tu sesión expiró o no estás conectado. Vuelve a iniciar sesión e intenta otra vez.';
  }

  if (context === 'upload') {
    if (res.status === 413) return 'La imagen supera el tamaño máximo permitido.';
    if (res.status === 415) return 'Formato de imagen no permitido.';
    if (serverMsg === 'Upload failed') {
      return 'No pudimos subir la foto (servidor o conexión). Comprueba tu red o inténtalo más tarde.';
    }
  }

  if (context === 'submit') {
    if (res.status === 400) {
      if (serverMsg.includes('photoUrl') || serverMsg.includes('linkUrl')) {
        return 'Falta la foto o el enlace válido. Si elegiste foto, asegúrate de que la subida terminó correctamente.';
      }
      return 'Los datos enviados no son válidos. Revisa e intenta de nuevo.';
    }
  }

  if (serverMsg) return serverMsg;
  return `No pudimos completar la acción (código ${res.status}). Intenta nuevamente.`;
}
