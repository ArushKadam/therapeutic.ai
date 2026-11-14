
import { useCallback, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import TethrIntro from "./components/TethrIntro";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { session, loading } = useAuth();
  const [introComplete, setIntroComplete] = useState(false);

  const finishIntro = useCallback(() => {
    setIntroComplete(true);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      {session && !introComplete && (
        <TethrIntro onComplete={finishIntro} />
      )}

      <Routes>
        {session ? (
          <>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Index />} />
            <Route path="/voice" element={<Index />} />
            <Route path="/chat" element={<Index />} />
            <Route path="/breathing" element={<Index />} />
            <Route path="/journal" element={<Index />} />
            <Route path="/resources" element={<Index />} />
            <Route path="/plans" element={<Index />} />
            <Route path="/settings" element={<Index />} />
          </>
        ) : (
          <Route path="/*" element={<AuthPage />} />
        )}

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
