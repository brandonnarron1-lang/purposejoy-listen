const supportsVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

type HapticPattern = 'light' | 'medium' | 'success' | 'change';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 4,
  medium: 8,
  success: [4, 30, 4],
  change: [6, 40, 6],
};

/**
 * Trigger haptic feedback. iOS Safari: no-op (not supported). Android PWA: full feedback.
 */
export function haptic(pattern: HapticPattern = 'light') {
  if (!supportsVibrate) return;
  try {
    navigator.vibrate(PATTERNS[pattern]);
  } catch {
    // ignore
  }
}

export function useHaptic() {
  return haptic;
}
