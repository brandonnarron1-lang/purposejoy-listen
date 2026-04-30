import React, {
  createContext, useContext, useRef, useState, useCallback, useEffect
} from 'react'
import type { Song } from '../types'

interface PlayerState {
  queue: Song[]
  currentIndex: number
  playing: boolean
  currentTime: number
  duration: number
  shuffle: boolean
  volume: number
}

interface PlayerContextValue extends PlayerState {
  play: (song: Song, queue?: Song[]) => void
  pause: () => void
  resume: () => void
  togglePlay: () => void
  next: () => void
  prev: () => void
  seek: (seconds: number) => void
  setVolume: (v: number) => void
  toggleShuffle: () => void
  replay: () => void
  currentSong: Song | null
  audioRef: React.RefObject<HTMLAudioElement>
  analyserNode: AnalyserNode | null
  // Stage C: lazy analyser API — call ensureAnalyser only from explicit user interaction
  ensureAnalyser: () => AnalyserNode | null
  suspendAnalyser: () => void
  resumeAnalyserIfNeeded: () => void
  // Offline cache state
  cachedSlugs: Set<string>
  refreshCacheState: () => Promise<void>
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  // Fix D: audio element created ONCE, never remounted
  const audioRef = useRef<HTMLAudioElement>(null!)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const audioSourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)

  const [cachedSlugs, setCachedSlugs] = useState<Set<string>>(new Set())

  const refreshCacheState = useCallback(async () => {
    if (!('caches' in window)) return
    try {
      const cache = await caches.open('audio-cache')
      const keys = await cache.keys()
      const slugs = new Set<string>()
      keys.forEach((req) => {
        const m = new URL(req.url).pathname.match(/^\/api\/stream\/([^?/]+)/)
        if (m) slugs.add(m[1])
      })
      setCachedSlugs(slugs)
    } catch {
      // No cache or quota error — silently no-op
    }
  }, [])

  useEffect(() => {
    refreshCacheState()
    const interval = setInterval(refreshCacheState, 30000)
    return () => clearInterval(interval)
  }, [refreshCacheState])

  const [state, setState] = useState<PlayerState>({
    queue: [], currentIndex: -1, playing: false,
    currentTime: 0, duration: 0, shuffle: false, volume: 1,
  })

  const currentSong = state.currentIndex >= 0 ? (state.queue[state.currentIndex] ?? null) : null

  // Fix A: set playsinline and webkit-playsinline on mount (not valid as JSX props)
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.setAttribute('playsinline', '')
    audio.setAttribute('webkit-playsinline', '')
  }, [])

  // Stage C: sourceConnectedRef guards against double MediaElementSource (iOS-killer if re-run)
  const sourceConnectedRef = useRef(false)

  // Stage C: ensureAnalyser — lazy init, only call from explicit user interaction, never on mount
  const ensureAnalyser = useCallback((): AnalyserNode | null => {
    if (sourceConnectedRef.current) return analyserRef.current
    if (!audioRef.current) return null
    try {
      const ctx = new AudioContext()
      const source = ctx.createMediaElementSource(audioRef.current)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 64
      analyser.smoothingTimeConstant = 0.8
      source.connect(analyser)
      analyser.connect(ctx.destination)
      audioCtxRef.current = ctx
      audioSourceRef.current = source
      analyserRef.current = analyser
      sourceConnectedRef.current = true
      setAnalyserNode(analyser)
      return analyser
    } catch {
      return null
    }
  }, [])

  // Stage C: suspendAnalyser — call when sheet closes or page hides to release audio path
  const suspendAnalyser = useCallback(() => {
    if (audioCtxRef.current?.state === 'running') {
      audioCtxRef.current.suspend().catch(() => {})
    }
  }, [])

  // Stage C: resumeAnalyserIfNeeded — call when sheet opens or page becomes visible
  const resumeAnalyserIfNeeded = useCallback(() => {
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {})
    }
  }, [])

  const logPlay = useCallback((song: Song) => {
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ song_id: song.id, event_type: 'play' }),
    }).catch(() => {})
  }, [])

  const play = useCallback((song: Song, queue?: Song[]) => {
    const newQueue = queue ?? [song]
    const idx = newQueue.findIndex(s => s.id === song.id)
    setState(s => ({ ...s, queue: newQueue, currentIndex: idx >= 0 ? idx : 0, playing: true }))
    logPlay(song)
    // Fix A: DO NOT call initAudioContext() here — that locks audio to Web Audio and
    // iOS suspends the context on lock screen. Only resume if already initialized.
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {})
    }
  }, [logPlay])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setState(s => ({ ...s, playing: false }))
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused'
    }
  }, [])

  const resume = useCallback(() => {
    // Fix A: DO NOT call initAudioContext() here — only resume if already initialized
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {})
    }
    audioRef.current?.play().catch(() => {})
    setState(s => ({ ...s, playing: true }))
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing'
    }
  }, [])

  const togglePlay = useCallback(() => {
    if (state.playing) pause(); else resume()
  }, [state.playing, pause, resume])

  const seek = useCallback((seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds
      setState(s => ({ ...s, currentTime: seconds }))
    }
  }, [])

  const next = useCallback(() => {
    setState(s => {
      if (s.queue.length === 0) return s
      const nextIdx = s.shuffle
        ? Math.floor(Math.random() * s.queue.length)
        : (s.currentIndex + 1) % s.queue.length
      return { ...s, currentIndex: nextIdx, playing: true }
    })
  }, [])

  const handleEnded = useCallback(() => {
    setState(s => {
      if (s.queue.length === 0) return s
      if (s.currentIndex >= s.queue.length - 1) {
        // Last track — stop cleanly
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'none'
        }
        return { ...s, playing: false }
      }
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing'
      }
      const nextIdx = s.shuffle
        ? Math.floor(Math.random() * s.queue.length)
        : s.currentIndex + 1
      return { ...s, currentIndex: nextIdx, playing: true }
    })
  }, [])

  const prev = useCallback(() => {
    if (audioRef.current && audioRef.current.currentTime > 3) { seek(0); return }
    setState(s => ({ ...s, currentIndex: Math.max(0, s.currentIndex - 1), playing: true }))
  }, [seek])

  const setVolume = useCallback((v: number) => {
    if (audioRef.current) audioRef.current.volume = v
    setState(s => ({ ...s, volume: v }))
  }, [])

  const toggleShuffle = useCallback(() => setState(s => ({ ...s, shuffle: !s.shuffle })), [])
  const replay = useCallback(() => seek(0), [seek])

  // Fix A: Resume AudioContext on visibility + focus (iOS suspends it on lock screen)
  useEffect(() => {
    const resumeCtx = () => {
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', resumeCtx)
    window.addEventListener('focus', resumeCtx)
    return () => {
      document.removeEventListener('visibilitychange', resumeCtx)
      window.removeEventListener('focus', resumeCtx)
    }
  }, [])

  // Sync audio src when currentIndex changes
  useEffect(() => {
    const song = state.queue[state.currentIndex]
    if (!song || !audioRef.current) return
    audioRef.current.src = `/api/stream/${song.slug}`
    audioRef.current.volume = state.volume
    if (state.playing) {
      // Fix A: Resume AudioContext if initialized and suspended before play()
      if (audioCtxRef.current?.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {})
      }
      // Fix B: Set playbackState AFTER play() Promise resolves (iOS requirement)
      audioRef.current.play()
        .then(() => {
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'playing'
          }
        })
        .catch(() => {})
    }
  }, [state.currentIndex]) // eslint-disable-line

  // Fix B: Media Session metadata + all handlers + playbackState on every track change
  useEffect(() => {
    if (!currentSong || !('mediaSession' in navigator)) return
    const origin = window.location.origin
    const coverBase = `${origin}/api/cover/${currentSong.cover_r2_key}`
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.album ?? 'PurposeJoy',
      artwork: currentSong.cover_r2_key ? [
        { src: `${coverBase}?w=96`,  sizes: '96x96',   type: 'image/jpeg' },
        { src: `${coverBase}?w=192`, sizes: '192x192', type: 'image/jpeg' },
        { src: `${coverBase}?w=256`, sizes: '256x256', type: 'image/jpeg' },
        { src: `${coverBase}?w=384`, sizes: '384x384', type: 'image/jpeg' },
        { src: `${coverBase}?w=512`, sizes: '512x512', type: 'image/jpeg' },
      ] : [],
    })
    navigator.mediaSession.setActionHandler('play', () => { audioRef.current?.play().catch(() => {}) })
    navigator.mediaSession.setActionHandler('pause', () => { audioRef.current?.pause() })
    navigator.mediaSession.setActionHandler('previoustrack', prev)
    navigator.mediaSession.setActionHandler('nexttrack', next)
    navigator.mediaSession.setActionHandler('seekto', (d) => {
      if (d.seekTime != null) seek(d.seekTime)
    })
    navigator.mediaSession.playbackState = state.playing ? 'playing' : 'paused'
  }, [currentSong, next, prev, seek, state.playing])

  // Fix B: Position state for lock-screen scrubber
  const handleTimeUpdate = useCallback((e: Event) => {
    const audio = e.target as HTMLAudioElement
    const time = audio.currentTime
    setState(s => ({ ...s, currentTime: time }))
    if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
      try {
        // Fix D: guard against NaN/Infinity duration — Safari throws if invalid
        const dur = audio.duration
        if (dur && !isNaN(dur) && isFinite(dur)) {
          navigator.mediaSession.setPositionState({
            duration: dur,
            playbackRate: audio.playbackRate || 1,
            position: Math.min(time, dur),
          })
        }
      } catch {
        // ignore
      }
    }
  }, [])

  // Wire timeupdate via imperative listener so we can include setPositionState
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.addEventListener('timeupdate', handleTimeUpdate)
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate)
  }, [handleTimeUpdate])

  return (
    <PlayerContext.Provider value={{
      ...state, play, pause, resume, togglePlay, next, prev,
      seek, setVolume, toggleShuffle, replay, currentSong, audioRef,
      analyserNode, ensureAnalyser, suspendAnalyser, resumeAnalyserIfNeeded,
      cachedSlugs, refreshCacheState,
    }}>
      {children}
      {/* Fix A: preload="auto" + crossOrigin — playsinline set imperatively above */}
      <audio
        ref={audioRef}
        onDurationChange={e => setState(s => ({ ...s, duration: (e.target as HTMLAudioElement).duration }))}
        onEnded={handleEnded}
        preload="auto"
        crossOrigin="anonymous"
      />
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider')
  return ctx
}
