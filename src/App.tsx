import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import ProtectedRoute from "@/components/portal/ProtectedRoute";
import { lazy, Suspense } from "react";

// Public
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
const PublicCoachProfile = lazy(() => import("./pages/PublicCoachProfile"));
const FindACoach = lazy(() => import("./pages/FindACoach"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const BookCoach = lazy(() => import("./pages/BookCoach"));
const BookingSuccess = lazy(() => import("./pages/BookingSuccess"));

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
const CoachMarketplace = lazy(() => import("./pages/portal/CoachMarketplace"));

// Gamification pages (lazy-loaded)
const Rankings = lazy(() => import("./pages/Rankings"));
const Rewards = lazy(() => import("./pages/Rewards"));

// Events & Community (lazy-loaded)
const Events = lazy(() => import("./pages/Events"));
const Community = lazy(() => import("./pages/Community"));

// Coach Events (lazy-loaded)
const CoachEvents = lazy(() => import("./pages/portal/CoachEvents"));

// Admin pages (lazy-loaded)
const AdminDashboard = lazy(() => import("./pages/portal/AdminDashboard"));
const FoundersDashboard = lazy(() => import("./pages/portal/FoundersDashboard"));
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
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/coach/:slug" element={<Suspense fallback={<PortalLoader />}><PublicCoachProfile /></Suspense>} />
            <Route path="/find-a-coach" element={<Suspense fallback={<PortalLoader />}><FindACoach /></Suspense>} />
            <Route path="/marketplace" element={<Suspense fallback={<PortalLoader />}><Marketplace /></Suspense>} />
            <Route path="/booking-success" element={<Suspense fallback={<PortalLoader />}><BookingSuccess /></Suspense>} />
            <Route path="/rankings" element={<Suspense fallback={<PortalLoader />}><Rankings /></Suspense>} />
            <Route path="/events" element={<Suspense fallback={<PortalLoader />}><Events /></Suspense>} />
            <Route path="/community" element={<Suspense fallback={<PortalLoader />}><Community /></Suspense>} />

            {/* Auth */}
            <Route path="/login" element={<Suspense fallback={<PortalLoader />}><Login /></Suspense>} />

            {/* Onboarding */}
            <Route path="/onboarding" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute><Onboarding /></ProtectedRoute>
              </Suspense>
            } />

            {/* Book a coach */}
            <Route path="/book/:coachSlug" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute><BookCoach /></ProtectedRoute>
              </Suspense>
            } />

            {/* Player */}
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
            <Route path="/rewards" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute><Rewards /></ProtectedRoute>
              </Suspense>
            } />

            {/* Coach */}
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
            <Route path="/coach/marketplace" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="coach"><CoachMarketplace /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/coach/events" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="coach"><CoachEvents /></ProtectedRoute>
              </Suspense>
            } />

            {/* Admin */}
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
            <Route path="/admin/modules" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="admin"><CoachModules /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/admin/marketplace" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="admin"><CoachMarketplace /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/admin/events" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="admin"><CoachEvents /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/admin/schedule/coach/:coachId" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="admin"><CoachCalendar /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/founders" element={
              <Suspense fallback={<PortalLoader />}>
                <FoundersDashboard />
              </Suspense>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
