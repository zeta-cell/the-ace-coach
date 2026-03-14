import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import WhatsAppButton from "@/components/WhatsAppButton";
import ProtectedRoute from "@/components/portal/ProtectedRoute";
import { lazy, Suspense } from "react";

// Public website pages
import Index from "./pages/Index";
import About from "./pages/About";
import Programs from "./pages/Programs";
import BeginnerCamp from "./pages/BeginnerCamp";
import AdvancedCamp from "./pages/AdvancedCamp";
import ProCamp from "./pages/ProCamp";
import TacticalMasterclass from "./pages/TacticalMasterclass";
import PartnerTraining from "./pages/PartnerTraining";
import PlayWithPro from "./pages/PlayWithPro";
import CrashCourse from "./pages/CrashCourse";
import OneShotClinic from "./pages/OneShotClinic";
import TheFixer from "./pages/TheFixer";
import VideoDeepDive from "./pages/VideoDeepDive";
import WeekendWarrior from "./pages/WeekendWarrior";
import PreCampAssessment from "./pages/PreCampAssessment";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Portal pages (lazy-loaded)
const Login = lazy(() => import("./pages/portal/Login"));
const Onboarding = lazy(() => import("./pages/portal/Onboarding"));
const Dashboard = lazy(() => import("./pages/portal/Dashboard"));
const Training = lazy(() => import("./pages/portal/Training"));
const PlayerProfile = lazy(() => import("./pages/portal/PlayerProfile"));
const Messages = lazy(() => import("./pages/portal/Messages"));
const PlayerVideos = lazy(() => import("./pages/portal/PlayerVideos"));

// Coach pages (lazy-loaded)
const CoachDashboard = lazy(() => import("./pages/portal/CoachDashboard"));
const CoachPlayers = lazy(() => import("./pages/portal/CoachPlayers"));
const CoachPlayerDetail = lazy(() => import("./pages/portal/CoachPlayerDetail"));
const CoachModules = lazy(() => import("./pages/portal/CoachModules"));
const CoachPlanBuilder = lazy(() => import("./pages/portal/CoachPlanBuilder"));
const CoachVideos = lazy(() => import("./pages/portal/CoachVideos"));
const CoachCalendar = lazy(() => import("./pages/portal/CoachCalendar"));
const CoachProfile = lazy(() => import("./pages/portal/CoachProfile"));

// Admin pages (lazy-loaded)
const AdminDashboard = lazy(() => import("./pages/portal/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/portal/AdminUsers"));
const AdminAssignments = lazy(() => import("./pages/portal/AdminAssignments"));
const AdminPayments = lazy(() => import("./pages/portal/AdminPayments"));
const AdminSchedule = lazy(() => import("./pages/portal/AdminSchedule"));
const queryClient = new QueryClient();

const PortalLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <ScrollToTop />
            <WhatsAppButton />
            <Routes>
              {/* Public website */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/beginner-camp" element={<BeginnerCamp />} />
              <Route path="/advanced-camp" element={<AdvancedCamp />} />
              <Route path="/pro-camp" element={<ProCamp />} />
              <Route path="/tactical-masterclass" element={<TacticalMasterclass />} />
              <Route path="/partner-training" element={<PartnerTraining />} />
              <Route path="/play-with-pro" element={<PlayWithPro />} />
              <Route path="/crash-course" element={<CrashCourse />} />
              <Route path="/one-shot-clinic" element={<OneShotClinic />} />
              <Route path="/the-fixer" element={<TheFixer />} />
              <Route path="/video-deep-dive" element={<VideoDeepDive />} />
              <Route path="/weekend-warrior" element={<WeekendWarrior />} />
              <Route path="/pre-camp-assessment" element={<PreCampAssessment />} />
              <Route path="/contact" element={<Contact />} />

              {/* Portal — Auth */}
              <Route path="/login" element={<Suspense fallback={<PortalLoader />}><Login /></Suspense>} />

              {/* Portal — Onboarding */}
              <Route path="/onboarding" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute><Onboarding /></ProtectedRoute>
                </Suspense>
              } />

              {/* Portal — Player */}
              <Route path="/dashboard" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute><Dashboard /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/training" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute><Training /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/profile" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute><PlayerProfile /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/messages" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute><Messages /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/videos" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute><PlayerVideos /></ProtectedRoute>
                </Suspense>
              } />

              {/* Portal — Coach */}
              <Route path="/coach" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute requiredRole="coach"><CoachDashboard /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/coach/players" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute requiredRole="coach"><CoachPlayers /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/coach/players/:playerId" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute requiredRole="coach"><CoachPlayerDetail /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/coach/modules" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute requiredRole="coach"><CoachModules /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/coach/plan/:playerId" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute requiredRole="coach"><CoachPlanBuilder /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/coach/messages" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute requiredRole="coach"><Messages /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/coach/videos" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute requiredRole="coach"><CoachVideos /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/coach/calendar" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute requiredRole="coach"><CoachCalendar /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/coach/profile" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute requiredRole="coach"><CoachProfile /></ProtectedRoute>
                </Suspense>
              } />

              {/* Portal — Admin */}
              <Route path="/admin" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/admin/users" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute requiredRole="admin"><AdminUsers /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/admin/assignments" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute requiredRole="admin"><AdminAssignments /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/admin/payments" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute requiredRole="admin"><AdminPayments /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/admin/schedule" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute requiredRole="admin"><AdminSchedule /></ProtectedRoute>
                </Suspense>
              } />
              <Route path="/admin/schedule/coach/:coachId" element={
                <Suspense fallback={<PortalLoader />}>
                  <ProtectedRoute requiredRole="admin"><CoachCalendar /></ProtectedRoute>
                </Suspense>
              } />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
