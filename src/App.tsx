import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/shell/AppShell';
import { ToastContainer } from './components/ui/ToastContainer';
import { TeamsPage } from './pages/TeamsPage';
import { TeamProfilePage } from './pages/TeamProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/teams" replace />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/teams/:teamId" element={<TeamProfilePage />} />
        </Routes>
      </AppShell>
      <ToastContainer />
    </BrowserRouter>
  );
}
