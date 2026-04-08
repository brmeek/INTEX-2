import { useCallback, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useSearchParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { CookieConsentProvider } from "@/context/CookieConsentContext";
import { getPortalLandingPath, hasDonorPortalAccess, type PortalTarget } from "@/lib/portalRoutes";
import InitialLoadingScreen from "./components/InitialLoadingScreen";
import ScrollToTop from "./components/ScrollToTop";
import CookieConsentBanner from "./components/CookieConsentBanner";
import QuickExitButton from "./components/QuickExitButton";
import ChatbotWidget from "./components/ChatbotWidget";

import Index from "./pages/Index";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import CookiePolicyPage from "./pages/CookiePolicyPage";
import PrivacyPage from "./pages/PrivacyPage";
import ImpactDashboard from "./pages/ImpactDashboard";
import LoginPage from "./pages/LoginPage";
import DonorLoginPage from "./pages/DonorLoginPage";
import DonorPortalPage from "./pages/DonorPortalPage";
import ManageMfaPage from "./pages/ManageMfaPage";
import RegisterPage from "./pages/RegisterPage";
import LogoutPage from "./pages/LogoutPage";
import NotFound from "./pages/NotFound";

import AdminDashboard from "./pages/admin/AdminDashboard";
import UsersAdminPage from "./pages/admin/UsersAdminPage";
import DonorsAdminPage from "./pages/admin/DonorsAdminPage";
import CaseloadPage from "./pages/admin/CaseloadPage";
import ProcessRecordingsPage from "./pages/admin/ProcessRecordingsPage";
import VisitationsPage from "./pages/admin/VisitationsPage";
import PartnersAdminPage from "./pages/admin/PartnersAdminPage";
import ReportsPage from "./pages/admin/ReportsPage";
import TraffickingMapPage from "./pages/admin/TraffickingMapPage";

const queryClient = new QueryClient();

function ProtectedRoute({ children, requireRole }: { children: React.ReactNode; requireRole?: "Admin" | "Donor" }) {
  const { authSession, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!authSession?.isAuthenticated) return <Navigate to={requireRole === "Admin" ? "/login" : "/donor/login"} replace />;
  const hasRequiredAccess = !requireRole
    || authSession.roles.includes(requireRole)
    || (requireRole === "Donor" && hasDonorPortalAccess(authSession));

  if (!hasRequiredAccess) {
    return <Navigate to={requireRole === "Admin" ? "/login" : "/donor/login"} replace />;
  }
  return <>{children}</>;
}

function PortalRedirect() {
  const { authSession, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="animate-spin h-8 w-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const targetParam = searchParams.get("target");
  const preferredTarget: PortalTarget | undefined =
    targetParam === "admin" || targetParam === "donor" ? targetParam : undefined;

  return <Navigate to={getPortalLandingPath(authSession, preferredTarget)} replace />;
}

const App = () => {
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const handleLoadingComplete = useCallback(() => {
    setShowLoadingScreen(false);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <CookieConsentProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {showLoadingScreen && (
              <InitialLoadingScreen onComplete={handleLoadingComplete} />
            )}
            <BrowserRouter>
              <ScrollToTop />
              <Routes>
              {/* Public */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/programs" element={<Navigate to="/about" replace />} />
              <Route path="/donate" element={<Navigate to="/donor/login" replace />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/cookies" element={<CookiePolicyPage />} />
              <Route path="/impact" element={<ImpactDashboard />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/logout" element={<LogoutPage />} />
              <Route path="/donor/login" element={<DonorLoginPage />} />
              <Route path="/portal" element={<PortalRedirect />} />
              <Route path="/donor" element={<ProtectedRoute requireRole="Donor"><DonorPortalPage /></ProtectedRoute>} />
              <Route path="/account/security" element={<ProtectedRoute><ManageMfaPage /></ProtectedRoute>} />

              {/* Admin (Authenticated) */}
              <Route path="/admin" element={<ProtectedRoute requireRole="Admin"><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute requireRole="Admin"><UsersAdminPage /></ProtectedRoute>} />
              <Route path="/admin/donors" element={<ProtectedRoute requireRole="Admin"><DonorsAdminPage /></ProtectedRoute>} />
              <Route path="/admin/caseload" element={<ProtectedRoute requireRole="Admin"><CaseloadPage /></ProtectedRoute>} />
              <Route path="/admin/recordings" element={<ProtectedRoute requireRole="Admin"><ProcessRecordingsPage /></ProtectedRoute>} />
              <Route path="/admin/visitations" element={<ProtectedRoute requireRole="Admin"><VisitationsPage /></ProtectedRoute>} />
              <Route path="/admin/partners" element={<ProtectedRoute requireRole="Admin"><PartnersAdminPage /></ProtectedRoute>} />
              <Route path="/admin/reports" element={<ProtectedRoute requireRole="Admin"><ReportsPage /></ProtectedRoute>} />
              <Route path="/admin/trafficking-map" element={<ProtectedRoute requireRole="Admin"><TraffickingMapPage /></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
              </Routes>
              <ChatbotWidget />
              <QuickExitButton />
              <CookieConsentBanner />
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </CookieConsentProvider>
    </QueryClientProvider>
  );
};

export default App;
