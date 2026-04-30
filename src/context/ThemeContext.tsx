import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';

interface ThemePalette {
  vibrant: string;
  darkVibrant: string;
  muted: string;
  lightVibrant: string;
  textOnBg: 'light' | 'dark';
  rawAvg: string;
}

const DEFAULT_THEME: ThemePalette = {
  vibrant: '#D4AF37',
  darkVibrant: '#1A0C00',
  muted: '#2A1A0C',
  lightVibrant: '#FFD750',
  textOnBg: 'light',
  rawAvg: '#1A0C00',
};

interface ThemeContextValue {
  theme: ThemePalette;
  extractFromImage: (src: string) => Promise<void>;
  resetToDefault: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_THEME,
  extractFromImage: async () => {},
  resetToDefault: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemePalette>(DEFAULT_THEME);
  const lastSrcRef = useRef<string>('');
  const cacheRef = useRef<Map<string, ThemePalette>>(new Map());

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--theme-vibrant', theme.vibrant);
    root.style.setProperty('--theme-dark-vibrant', theme.darkVibrant);
    root.style.setProperty('--theme-muted', theme.muted);
    root.style.setProperty('--theme-light-vibrant', theme.lightVibrant);
    root.style.setProperty('--theme-raw-avg', theme.rawAvg);
    root.style.setProperty('--theme-text', theme.textOnBg === 'light' ? '#FFF6E0' : '#1A0C00');
  }, [theme]);

  const extractFromImage = useCallback(async (src: string) => {
    if (!src || src === lastSrcRef.current) return;
    lastSrcRef.current = src;

    if (cacheRef.current.has(src)) {
      setTheme(cacheRef.current.get(src)!);
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = await import('colorthief') as any;
      const ColorThief = mod.default ?? mod;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('image load failed'));
        setTimeout(() => reject(new Error('extract timeout')), 3000);
      });

      const ct = new ColorThief();
      const palette = ct.getPalette(img, 6);
      if (!palette || palette.length === 0) return;

      const scoreVibrant = (rgb: number[]) => {
        const [r, g, b] = rgb;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const lightness = (max + min) / 2 / 255;
        const saturation = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
        const lightnessScore = 1 - Math.abs(lightness - 0.55) * 2;
        return saturation * Math.max(0, lightnessScore);
      };

      const sorted = [...palette].sort((a, b) => scoreVibrant(b) - scoreVibrant(a));
      const vibrant = sorted[0];
      const darkVibrant = sorted.find(c => Math.max(...c) < 100) || palette[palette.length - 1];
      const muted = palette[Math.floor(palette.length / 2)];
      const lightVibrant = sorted.find(c => Math.min(...c) > 150) || vibrant;

      const rgbToHex = (rgb: number[]) =>
        '#' + rgb.map(c => Math.round(c).toString(16).padStart(2, '0')).join('');

      const avg = palette
        .reduce((acc: number[], c: number[]) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0])
        .map((v: number) => Math.round(v / palette.length));

      const dvLum = (0.299 * darkVibrant[0] + 0.587 * darkVibrant[1] + 0.114 * darkVibrant[2]) / 255;

      const newTheme: ThemePalette = {
        vibrant: rgbToHex(vibrant),
        darkVibrant: rgbToHex(darkVibrant),
        muted: rgbToHex(muted),
        lightVibrant: rgbToHex(lightVibrant),
        rawAvg: rgbToHex(avg),
        textOnBg: dvLum > 0.5 ? 'dark' : 'light',
      };

      cacheRef.current.set(src, newTheme);
      setTheme(newTheme);
    } catch {
      // Fail silently — keep current theme
    }
  }, []);

  const resetToDefault = useCallback(() => {
    lastSrcRef.current = '';
    setTheme(DEFAULT_THEME);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, extractFromImage, resetToDefault }}>
      {children}
    </ThemeContext.Provider>
  );
}
