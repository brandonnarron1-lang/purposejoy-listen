import { useTheme } from '../context/ThemeContext';

interface ColorHaloProps {
  imageSrc?: string;
}

export function ColorHalo({ imageSrc: _imageSrc }: ColorHaloProps) {
  const { theme } = useTheme();
  // ThemeBridge handles extraction — ColorHalo simply reads from ThemeContext
  const color = theme.vibrant;

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: '-20%',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity: 0.4,
        filter: 'blur(40px)',
        transform: 'scale(1.5)',
        transition: 'background 1200ms cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
