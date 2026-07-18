import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { ToastProvider } from "./components/ui/ToastContext";
import { DiscoverPage } from "./pages/DiscoverPage";
import { GeneratePage } from "./pages/GeneratePage";
import { HistoryPage } from "./pages/HistoryPage";
import { PostDetailPage } from "./pages/PostDetailPage";
import { SavedPage } from "./pages/SavedPage";
import { SettingsPage } from "./pages/SettingsPage";

export default function App() {
  return (
    <ToastProvider>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/discover" replace />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route path="/generate/:id" element={<GeneratePage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </ToastProvider>
  );
}
