import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { PlayerProvider } from './context/PlayerContext'
import { PlayerBar } from './components/PlayerBar'
import { InstallPrompt } from './components/InstallPrompt'
import { ListenHome } from './pages/ListenHome'
import { SongDetail } from './pages/SongDetail'
import { PlaylistDetail } from './pages/PlaylistDetail'
import { OfflinePage } from './pages/OfflinePage'
import { PrivacyPage } from './pages/PrivacyPage'
import { TermsPage } from './pages/TermsPage'
import { AdminMusic } from './pages/admin/AdminMusic'
import { AdminSongForm } from './pages/admin/AdminSongForm'

export default function App() {
  return (
    <BrowserRouter>
      <PlayerProvider>
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

        {/* Persistent player — rendered inside PlayerProvider, survives navigation */}
        <PlayerBar />
        <InstallPrompt />
      </PlayerProvider>
    </BrowserRouter>
  )
}
