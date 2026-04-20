/**
 * Whether to prefer the OS camera via <input type="file" capture> vs in-browser getUserMedia.
 * Touch phones/tablets: native camera intent is the most reliable (especially iOS Safari).
 */
export function preferNativeCameraPicker(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(pointer: coarse)').matches) return true;
  // iPad con Safari “ordenador de escritorio” sigue siendo táctil
  const iPadDesktop =
    navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (iPadDesktop) return true;
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
}
