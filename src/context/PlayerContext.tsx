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
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null!)
  const [state, setState] = useState<PlayerState>({
    queue: [], currentIndex: -1, playing: false,
    currentTime: 0, duration: 0, shuffle: false, volume: 1,
  })

  const currentSong = state.currentIndex >= 0 ? (state.queue[state.currentIndex] ?? null) : null

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
  }, [logPlay])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setState(s => ({ ...s, playing: false }))
  }, [])

  const resume = useCallback(() => {
    audioRef.current?.play().catch(() => {})
    setState(s => ({ ...s, playing: true }))
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

  // Sync audio src when currentIndex changes
  useEffect(() => {
    const song = state.queue[state.currentIndex]
    if (!song || !audioRef.current) return
    audioRef.current.src = `/api/stream/${song.slug}`
    audioRef.current.volume = state.volume
    if (state.playing) audioRef.current.play().catch(() => {})
  }, [state.currentIndex]) // eslint-disable-line

  // Media Session API
  useEffect(() => {
    if (!currentSong || !('mediaSession' in navigator)) return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: currentSong.album ?? 'PurposeJoy',
      artwork: currentSong.cover_r2_key
        ? [{ src: `/api/cover/${currentSong.cover_r2_key}`, sizes: '512x512', type: 'image/jpeg' }]
        : [],
    })
    navigator.mediaSession.setActionHandler('play', () => { audioRef.current?.play().catch(()=>{}) })
    navigator.mediaSession.setActionHandler('pause', () => { audioRef.current?.pause() })
    navigator.mediaSession.setActionHandler('previoustrack', prev)
    navigator.mediaSession.setActionHandler('nexttrack', next)
    navigator.mediaSession.setActionHandler('seekto', (d) => { if (d.seekTime != null) seek(d.seekTime) })
  }, [currentSong, next, prev, seek])

  return (
    <PlayerContext.Provider value={{
      ...state, play, pause, resume, togglePlay, next, prev,
      seek, setVolume, toggleShuffle, replay, currentSong, audioRef,
    }}>
      {children}
      <audio
        ref={audioRef}
        onTimeUpdate={e => setState(s => ({ ...s, currentTime: (e.target as HTMLAudioElement).currentTime }))}
        onDurationChange={e => setState(s => ({ ...s, duration: (e.target as HTMLAudioElement).duration }))}
        onEnded={next}
        preload="metadata"
      />
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer must be inside PlayerProvider')
  return ctx
}
