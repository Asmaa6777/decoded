import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import Index from "./pages/Index.tsx";
import Courses from "./pages/Courses.tsx";
import CoursePage from "./pages/CoursePage.tsx";
import NotFound from "./pages/NotFound.tsx";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { ChunkErrorBoundary } from "@/components/ChunkErrorBoundary";

// The home, catalog and course pages are where most visits start, so they ship
// in the main bundle. Everything else loads when its route opens.
// LessonPage holds the lesson components and visualizers.
const LessonPage = lazy(() => import("./pages/LessonPage.tsx"));
const Tools = lazy(() => import("./pages/Tools.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Team = lazy(() => import("./pages/Team.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));
const ExamPage = lazy(() => import("./pages/ExamPage.tsx"));
const ReviewPage = lazy(() => import("./pages/ReviewPage.tsx"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings.tsx"));
const PublicProfile = lazy(() => import("./pages/PublicProfile.tsx"));
const People = lazy(() => import("./pages/People.tsx"));
const AcceptInvite = lazy(() => import("./pages/AcceptInvite.tsx"));

/** Fades each page in when the route changes (.page-in in index.css). */
function PageFade({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="page-in">
      {children}
    </div>
  );
}

/** A lazily loaded page, with a blank screen while its chunk downloads. */
function Lazy({ children }: { children: ReactNode }) {
  return (
    <ChunkErrorBoundary>
      <Suspense fallback={<div className="min-h-screen bg-background" />}>{children}</Suspense>
    </ChunkErrorBoundary>
  );
}

const App = () => (
  <ThemeProvider defaultTheme="system" attribute="class">
    <TooltipProvider>
      <Sonner />
      <BrowserRouter basename="/">
        <ScrollToTop />
        <PageFade>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:courseSlug" element={<CoursePage />} />
            <Route path="/courses/:courseSlug/exam" element={<Lazy><ExamPage /></Lazy>} />
            <Route path="/courses/:courseSlug/:lessonSlug" element={<Lazy><LessonPage /></Lazy>} />
            <Route path="/tools" element={<Lazy><Tools /></Lazy>} />
            <Route path="/dashboard" element={<Lazy><Dashboard /></Lazy>} />
            <Route path="/review" element={<Lazy><ReviewPage /></Lazy>} />
            <Route path="/team" element={<Lazy><Team /></Lazy>} />
            <Route path="/privacy" element={<Lazy><Privacy /></Lazy>} />
            <Route path="/profile" element={<Lazy><ProfileSettings /></Lazy>} />
            <Route path="/u/:handle" element={<Lazy><PublicProfile /></Lazy>} />
            <Route path="/people" element={<Lazy><People /></Lazy>} />
            <Route path="/invite/:token" element={<Lazy><AcceptInvite /></Lazy>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageFade>
      </BrowserRouter>
    </TooltipProvider>
  </ThemeProvider>
);

export default App;
