import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import ProtectedRoute from "@/components/portal/ProtectedRoute";
import { FeatureFlagsProvider } from "@/hooks/useFeatureFlags";
import { FeatureRoute } from "@/components/portal/FeatureGate";
import { lazy as reactLazy, Suspense } from "react";
import { IconContext } from "@phosphor-icons/react";

// Auto-reload on stale chunk imports after a redeploy.
const isChunkError = (msg: string) =>
  /Importing a module script failed|Failed to fetch dynamically imported module|ChunkLoadError|Loading chunk \d+ failed|error loading dynamically imported module/i.test(
    msg
  );

const chunkErrorMessage = (err: unknown) =>
  [
    err instanceof Error ? err.message : "",
    typeof err === "object" && err && "message" in err ? String((err as { message?: unknown }).message || "") : "",
    String(err || ""),
  ].join(" ");

const tryReload = () => {
  const key = "__chunk_reload_at";
  const last = Number(sessionStorage.getItem(key) || 0);
  if (Date.now() - last > 10000) {
    sessionStorage.setItem(key, String(Date.now()));
    const url = new URL(window.location.href);
    url.searchParams.set("__fresh", String(Date.now()));
    window.location.replace(url.toString());
    return true;
  }
  return false;
};

const lazy: typeof reactLazy = (factory) =>
  reactLazy(async () => {
    try {
      return await factory();
    } catch (err: any) {
      if (isChunkError(chunkErrorMessage(err)) && tryReload()) {
        return { default: () => null } as any;
      }
      throw err;
    }
  });

if (typeof window !== "undefined") {
  window.addEventListener("error", (e) => {
    if (isChunkError([e?.message, (e as ErrorEvent)?.error?.message, (e as ErrorEvent)?.filename].join(" "))) tryReload();
  });
  window.addEventListener("unhandledrejection", (e: any) => {
    const msg = chunkErrorMessage(e?.reason);
    if (isChunkError(msg)) tryReload();
  });
}

// Public
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
const PublicCoachProfile = lazy(() => import("./pages/PublicCoachProfile"));
const PublicClubPage = lazy(() => import("./pages/PublicClubPage"));
const FindACoach = lazy(() => import("./pages/FindACoach"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const BookCoach = lazy(() => import("./pages/BookCoach"));
const BookingSuccess = lazy(() => import("./pages/BookingSuccess"));

// Portal pages (lazy-loaded)
const Login = lazy(() => import("./pages/portal/Login"));
const TestAccounts = lazy(() => import("./pages/portal/TestAccounts"));
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
const NewPlayerAssessment = lazy(() => import("./pages/portal/NewPlayerAssessment"));

const CoachModules = lazy(() => import("./pages/portal/CoachModules"));
const TrainingBlocks = lazy(() => import("./pages/portal/TrainingBlocks"));
const Library = lazy(() => import("./pages/portal/Library"));
const CoachPlanBuilder = lazy(() => import("./pages/portal/CoachPlanBuilder"));
const CoachVideos = lazy(() => import("./pages/portal/CoachVideos"));
const CoachCalendar = lazy(() => import("./pages/portal/CoachCalendar"));
const CoachAcademy = lazy(() => import("./pages/portal/CoachAcademy"));

const CoachProfile = lazy(() => import("./pages/portal/CoachProfile"));
const CoachMarketplace = lazy(() => import("./pages/portal/CoachMarketplace"));
const CoachEarnings = lazy(() => import("./pages/portal/CoachEarnings"));
const CoachAnalytics = lazy(() => import("./pages/portal/CoachAnalytics"));

// Gamification pages (lazy-loaded)
const Rankings = lazy(() => import("./pages/Rankings"));
const Rewards = lazy(() => import("./pages/Rewards"));

// Events & Community (lazy-loaded)
const Events = lazy(() => import("./pages/Events"));
const ClassDetail = lazy(() => import("./pages/ClassDetail"));
const Community = lazy(() => import("./pages/Community"));
const CitySportLanding = lazy(() => import("./pages/seo/CitySportLanding"));

// Coach Events (lazy-loaded)
const CoachEvents = lazy(() => import("./pages/portal/CoachEvents"));

// Admin pages (lazy-loaded)
const AdminDashboard = lazy(() => import("./pages/portal/AdminDashboard"));
const FoundersDashboard = lazy(() => import("./pages/portal/FoundersDashboard"));
const AdminUsers = lazy(() => import("./pages/portal/AdminUsers"));
const AdminAssignments = lazy(() => import("./pages/portal/AdminAssignments"));
const AdminPayments = lazy(() => import("./pages/portal/AdminPayments"));
const AdminSchedule = lazy(() => import("./pages/portal/AdminSchedule"));
const AdminFeatures = lazy(() => import("./pages/portal/AdminFeatures"));

// Club pages (lazy-loaded)
const ClubDashboard = lazy(() => import("./pages/portal/ClubDashboard"));
const ClubCoaches = lazy(() => import("./pages/portal/ClubCoaches"));
const ClubCourts = lazy(() => import("./pages/portal/ClubCourts"));
const ClubMembers = lazy(() => import("./pages/portal/ClubMembers"));
const ClubCalendar = lazy(() => import("./pages/portal/ClubCalendar"));
const ClubBookings = lazy(() => import("./pages/portal/ClubBookings"));
const ClubSettings = lazy(() => import("./pages/portal/ClubSettings"));
const ClubInvite = lazy(() => import("./pages/ClubInvite"));
const CoachInvite = lazy(() => import("./pages/CoachInvite"));
const CoachJoin = lazy(() => import("./pages/CoachJoin"));
const Crm = lazy(() => import("./pages/portal/Crm"));
const BulkInvite = lazy(() => import("./pages/portal/BulkInvite"));
const WelcomeSetup = lazy(() => import("./pages/portal/WelcomeSetup"));

const queryClient = new QueryClient();

const PortalLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FeatureFlagsProvider>
      <IconContext.Provider value={{ weight: "duotone", size: 20, mirrored: false }}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Index />} />
            <Route path="/coach/:slug" element={<Suspense fallback={<PortalLoader />}><PublicCoachProfile /></Suspense>} />
            <Route path="/c/:slug" element={<Suspense fallback={<PortalLoader />}><PublicClubPage /></Suspense>} />
            <Route path="/find-a-coach" element={<Suspense fallback={<PortalLoader />}><FeatureRoute feature="coach_discovery" fallback="/"><FindACoach /></FeatureRoute></Suspense>} />
            <Route path="/marketplace" element={<Suspense fallback={<PortalLoader />}><FeatureRoute feature="marketplace" fallback="/"><Marketplace /></FeatureRoute></Suspense>} />
            <Route path="/booking-success" element={<Suspense fallback={<PortalLoader />}><BookingSuccess /></Suspense>} />
            <Route path="/rankings" element={<Suspense fallback={<PortalLoader />}><FeatureRoute feature="community" fallback="/"><Rankings /></FeatureRoute></Suspense>} />
            <Route path="/events" element={<Suspense fallback={<PortalLoader />}><FeatureRoute feature="events" fallback="/"><Events /></FeatureRoute></Suspense>} />
            <Route path="/class/:id" element={<Suspense fallback={<PortalLoader />}><ClassDetail /></Suspense>} />
            <Route path="/community" element={<Suspense fallback={<PortalLoader />}><FeatureRoute feature="community" fallback="/"><Community /></FeatureRoute></Suspense>} />
            <Route path="/club-invite/:token" element={<Suspense fallback={<PortalLoader />}><ClubInvite /></Suspense>} />
            <Route path="/invite/:token" element={<Suspense fallback={<PortalLoader />}><CoachInvite /></Suspense>} />
            <Route path="/join/:slug" element={<Suspense fallback={<PortalLoader />}><CoachJoin /></Suspense>} />

            {/* SEO city × sport landing pages (EN + ES) */}
            <Route path="/padel-coach/:city" element={<Suspense fallback={<PortalLoader />}><CitySportLanding locale="en" sport="padel" /></Suspense>} />
            <Route path="/tennis-coach/:city" element={<Suspense fallback={<PortalLoader />}><CitySportLanding locale="en" sport="tennis" /></Suspense>} />
            <Route path="/es/profesor-de-padel/:city" element={<Suspense fallback={<PortalLoader />}><CitySportLanding locale="es" sport="padel" /></Suspense>} />
            <Route path="/es/profesor-de-tenis/:city" element={<Suspense fallback={<PortalLoader />}><CitySportLanding locale="es" sport="tennis" /></Suspense>} />

            {/* Auth */}
            <Route path="/login" element={<Suspense fallback={<PortalLoader />}><Login /></Suspense>} />
            <Route path="/portal/login" element={<Suspense fallback={<PortalLoader />}><Login /></Suspense>} />
            <Route path="/portal" element={<Suspense fallback={<PortalLoader />}><Login /></Suspense>} />
            <Route path="/test" element={<Suspense fallback={<PortalLoader />}><TestAccounts /></Suspense>} />

            {/* Onboarding */}
            <Route path="/onboarding" element={
            <Route path="/onboarding" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute><Onboarding /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/welcome" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute><WelcomeSetup /></ProtectedRoute>
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
                <ProtectedRoute playerOnly><Dashboard /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/training" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute playerOnly><Training /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/profile" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute playerOnly><PlayerProfile /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/messages" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute><Messages /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/videos" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute playerOnly><FeatureRoute feature="player_videos"><PlayerVideos /></FeatureRoute></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/rewards" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute playerOnly><Rewards /></ProtectedRoute>
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
            <Route path="/coach/players/new" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="coach"><NewPlayerAssessment /></ProtectedRoute>
              </Suspense>
            } />

            <Route path="/coach/players/:playerId" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="coach"><CoachPlayerDetail /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/coach/library" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="coach"><Library /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/coach/modules" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="coach"><CoachModules /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/coach/blocks" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="coach"><TrainingBlocks /></ProtectedRoute>
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
                <ProtectedRoute requiredRole="coach"><FeatureRoute feature="player_videos" fallback="/coach"><CoachVideos /></FeatureRoute></ProtectedRoute>
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
                <ProtectedRoute requiredRole="coach"><FeatureRoute feature="coach_marketplace" fallback="/coach"><CoachMarketplace /></FeatureRoute></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/coach/academy" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="coach"><CoachAcademy /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/coach/events" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="coach"><FeatureRoute feature="events" fallback="/coach"><CoachEvents /></FeatureRoute></ProtectedRoute>
              </Suspense>
            } />

            <Route path="/coach/analytics" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="coach"><CoachAnalytics /></ProtectedRoute>
              </Suspense>
            } />

            <Route path="/coach/earnings" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="coach"><FeatureRoute feature="coach_earnings" fallback="/coach"><CoachEarnings /></FeatureRoute></ProtectedRoute>
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
            <Route path="/admin/features" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="admin"><AdminFeatures /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/admin/library" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="admin"><Library /></ProtectedRoute>
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

            {/* Club */}
            <Route path="/club" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="club_manager"><ClubDashboard /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/club/coaches" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="club_manager"><ClubCoaches /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/club/courts" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="club_manager"><ClubCourts /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/club/members" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="club_manager"><ClubMembers /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/club/calendar" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="club_manager"><ClubCalendar /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/club/bookings" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="club_manager"><ClubBookings /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/club/settings" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="club_manager"><ClubSettings /></ProtectedRoute>
              </Suspense>
            } />
            <Route path="/club/crm" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="club_manager"><Crm /></ProtectedRoute>
              </Suspense>
            } />

            {/* Coach CRM */}
            <Route path="/coach/crm" element={
              <Suspense fallback={<PortalLoader />}>
                <ProtectedRoute requiredRole="coach"><FeatureRoute feature="coach_crm" fallback="/coach"><Crm /></FeatureRoute></ProtectedRoute>
              </Suspense>
            } />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </TooltipProvider>
      </IconContext.Provider>
      </FeatureFlagsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
