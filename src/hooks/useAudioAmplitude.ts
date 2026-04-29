import { useEffect, useState, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';

interface Options {
  enabled: boolean;
  smoothing?: number;
}

/**
 * Returns a smoothed bass amplitude (0..1) sampled from the audio analyser.
 *
 * CRITICAL: Only initializes Web Audio when enabled=true AND user has played audio.
 * When enabled=false, suspends the AudioContext to free the audio path.
 * Never call ensureAnalyser on mount — only when sheet is visibly open.
 */
export function useAudioAmplitude({ enabled, smoothing = 0.85 }: Options): number {
  const { ensureAnalyser, suspendAnalyser, resumeAnalyserIfNeeded, playing } = usePlayer();
  const [amplitude, setAmplitude] = useState(0);
  const rafRef = useRef<number | null>(null);
  const dataArrayRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const smoothedRef = useRef(0);

  useEffect(() => {
    if (!enabled || !playing) {
      // Sheet closed or audio stopped — suspend context to release iOS audio path
      suspendAnalyser();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      // Decay amplitude smoothly to zero
      const decay = setInterval(() => {
        smoothedRef.current *= 0.92;
        setAmplitude(smoothedRef.current);
        if (smoothedRef.current < 0.005) {
          smoothedRef.current = 0;
          setAmplitude(0);
          clearInterval(decay);
        }
      }, 50);
      return () => clearInterval(decay);
    }

    // Lazy init — only call ensureAnalyser when user is actively viewing sheet
    const analyser = ensureAnalyser();
    if (!analyser) {
      // Web Audio unavailable — fail silently, no visualization
      return;
    }

    resumeAnalyserIfNeeded();

    if (!dataArrayRef.current || dataArrayRef.current.length !== analyser.frequencyBinCount) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>;
    }

    const tick = () => {
      if (!dataArrayRef.current || !analyser) return;
      analyser.getByteFrequencyData(dataArrayRef.current);
      // Bass band: first ~10% of frequency bins
      const bassEnd = Math.max(4, Math.floor(dataArrayRef.current.length * 0.1));
      let sum = 0;
      for (let i = 0; i < bassEnd; i++) sum += dataArrayRef.current[i];
      const avg = sum / bassEnd / 255;
      smoothedRef.current = smoothedRef.current * smoothing + avg * (1 - smoothing);
      setAmplitude(smoothedRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [enabled, playing, ensureAnalyser, suspendAnalyser, resumeAnalyserIfNeeded, smoothing]);

  return amplitude;
}
