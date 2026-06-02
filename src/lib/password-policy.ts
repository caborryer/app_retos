const MIN_LENGTH = 8;

export function validatePassword(password: string): string | null {
  if (password.length < MIN_LENGTH) {
    return `La contraseña debe tener al menos ${MIN_LENGTH} caracteres.`;
  }
  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe incluir al menos una mayúscula.';
  }
  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos un número.';
  }
  return null;
}

export const PASSWORD_MIN_LENGTH = MIN_LENGTH;
