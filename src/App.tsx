import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PlayerProvider } from './context/PlayerContext'
import { ThemeProvider } from './context/ThemeContext'
import { SheetProvider } from './context/SheetContext'
import { PlayerBar } from './components/PlayerBar'
import { InstallPrompt } from './components/InstallPrompt'
import { LoadingSplash } from './components/LoadingSplash'
import ThemeBridge from './components/ThemeBridge'
import NowPlayingSheetMount from './components/NowPlayingSheetMount'
import MiniPlayer from './components/MiniPlayer'
import { ListenHome } from './pages/ListenHome'
import { SongDetail } from './pages/SongDetail'
import { PlaylistDetail } from './pages/PlaylistDetail'
import { OfflinePage } from './pages/OfflinePage'
import { PrivacyPage } from './pages/PrivacyPage'
import { TermsPage } from './pages/TermsPage'
import { AdminMusic } from './pages/admin/AdminMusic'
import { AdminSongForm } from './pages/admin/AdminSongForm'

export default function App() {
  // Show splash once per session (not on admin routes)
  const isAdminRoute = typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/admin')
  const [showSplash, setShowSplash] = useState(
    !isAdminRoute && !sessionStorage.getItem('pj_splashed')
  )

  useEffect(() => {
    if (!showSplash) {
      sessionStorage.setItem('pj_splashed', '1')
    }
  }, [showSplash])

  return (
    <>
      {showSplash && (
        <LoadingSplash onDone={() => {
          sessionStorage.setItem('pj_splashed', '1')
          setShowSplash(false)
        }} />
      )}

      <BrowserRouter>
        <PlayerProvider>
          <ThemeProvider>
            <SheetProvider>
              <ThemeBridge />
              <Routes>
                {/* Public */}
                <Route path="/" element={<Navigate to="/listen" replace />} />
                <Route path="/listen" element={<ListenHome />} />
                <Route path="/listen/playlist/:playlistSlug" element={<PlaylistDetail />} />
                <Route path="/listen/:songSlug" element={<SongDetail />} />
                <Route path="/offline" element={<OfflinePage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/sms-terms" element={<TermsPage />} />

                {/* Admin — protected by Cloudflare Access at the edge */}
                <Route path="/admin/music" element={<AdminMusic />} />
                <Route path="/admin/music/new" element={<AdminSongForm />} />
                <Route path="/admin/music/:id/edit" element={<AdminSongForm />} />
              </Routes>

              {/* B2: MiniPlayer replaces PlayerBar; sheet + install prompt */}
              <MiniPlayer />
              <NowPlayingSheetMount />
              <InstallPrompt />
            </SheetProvider>
          </ThemeProvider>
        </PlayerProvider>
      </BrowserRouter>
    </>
  )
}
