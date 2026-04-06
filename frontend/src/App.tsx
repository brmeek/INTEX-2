import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import ScrollToTop from "./components/ScrollToTop";
import CookieConsent from "./components/CookieConsent";

import Index from "./pages/Index";
import AboutPage from "./pages/AboutPage";
import ProgramsPage from "./pages/ProgramsPage";
import DonatePage from "./pages/DonatePage";
import ContactPage from "./pages/ContactPage";
import PrivacyPage from "./pages/PrivacyPage";
import ImpactDashboard from "./pages/ImpactDashboard";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

import AdminDashboard from "./pages/admin/AdminDashboard";
import DonorsAdminPage from "./pages/admin/DonorsAdminPage";
import CaseloadPage from "./pages/admin/CaseloadPage";
import ProcessRecordingsPage from "./pages/admin/ProcessRecordingsPage";
import VisitationsPage from "./pages/admin/VisitationsPage";
import PartnersAdminPage from "./pages/admin/PartnersAdminPage";
import ReportsPage from "./pages/admin/ReportsPage";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/programs" element={<ProgramsPage />} />
            <Route path="/donate" element={<DonatePage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/impact" element={<ImpactDashboard />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Admin (Authenticated) */}
            <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/donors" element={<ProtectedRoute><DonorsAdminPage /></ProtectedRoute>} />
            <Route path="/admin/caseload" element={<ProtectedRoute><CaseloadPage /></ProtectedRoute>} />
            <Route path="/admin/recordings" element={<ProtectedRoute><ProcessRecordingsPage /></ProtectedRoute>} />
            <Route path="/admin/visitations" element={<ProtectedRoute><VisitationsPage /></ProtectedRoute>} />
            <Route path="/admin/partners" element={<ProtectedRoute><PartnersAdminPage /></ProtectedRoute>} />
            <Route path="/admin/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
