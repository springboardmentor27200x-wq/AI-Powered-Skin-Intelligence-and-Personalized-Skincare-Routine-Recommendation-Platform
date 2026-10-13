import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Navigation } from "./components/Navigation";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { SkinProfile } from "./pages/SkinProfile";
import { Lifestyle } from "./pages/Lifestyle";
import { Sleep } from "./pages/Sleep";
import { AssessmentPage } from "./pages/AssessmentPage";
import { RoutinePage } from "./pages/RoutinePage";
import { ProductRecommendationPage } from "./pages/ProductRecommendationPage";
import { IngredientIntelligencePage } from "./pages/IngredientIntelligencePage";
import { ConsultationsPage } from "./pages/ConsultationsPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminDatasetPage } from "./pages/AdminDatasetPage";
import { PageRoute } from "./types";
import { RefreshCw } from "lucide-react";

function AppContent() {
  const { user, isLoading } = useAuth();
  const validRoutes: PageRoute[] = [
    "/dashboard",
    "/routine",
    "/products",
    "/ingredients",
    "/consultations",
    "/assessment",
    "/skin-profile",
    "/lifestyle",
    "/sleep",
    "/profile",
    "/login",
    "/register",
    "/admin/users",
    "/admin/database",
    "/admin/dataset",
  ];

  const [currentRoute, setCurrentRoute] = useState<PageRoute>(() => {
    const path = window.location.pathname as PageRoute;
    if (validRoutes.includes(path)) {
      return path;
    }
    return "/dashboard";
  });

  const navigate = (route: PageRoute) => {
    setCurrentRoute(route);
    window.history.pushState({}, "", route);
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname as PageRoute;
      if (validRoutes.includes(path)) {
        setCurrentRoute(path);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!isLoading && !user && currentRoute !== "/login" && currentRoute !== "/register") {
      navigate("/login");
    } else if (!isLoading && user && (currentRoute === "/login" || currentRoute === "/register")) {
      navigate("/dashboard");
    }
  }, [user, isLoading, currentRoute]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-11 h-11 rounded-xl bg-[#F0F5F1] border border-[#8BA88E]/30 flex items-center justify-center mx-auto text-[#5A6D5C]">
            <RefreshCw className="w-5 h-5 animate-spin text-[#5A6D5C]" />
          </div>
          <p className="text-xs font-semibold text-[#7A746B]">
            Loading SkinIntel...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (currentRoute === "/register") {
      return <Register onNavigate={navigate} />;
    }
    return <Login onNavigate={navigate} />;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#333333] flex flex-col font-sans antialiased selection:bg-[#E8EFE9] selection:text-[#2D382E]">
      <Navigation currentRoute={currentRoute} onNavigate={navigate} />

      <main className="flex-1 pb-16">
        {currentRoute === "/dashboard" && <Dashboard onNavigate={navigate} />}
        {currentRoute === "/routine" && <RoutinePage onNavigate={navigate} />}
        {currentRoute === "/products" && <ProductRecommendationPage onNavigate={navigate} />}
        {currentRoute === "/ingredients" && <IngredientIntelligencePage onNavigate={navigate} />}
        {currentRoute === "/consultations" && <ConsultationsPage onNavigate={navigate} />}
        {currentRoute === "/assessment" && <AssessmentPage onNavigate={navigate} />}
        {currentRoute === "/skin-profile" && <SkinProfile />}
        {currentRoute === "/lifestyle" && <Lifestyle onNavigate={navigate} />}
        {currentRoute === "/sleep" && <Sleep onNavigate={navigate} />}
        {currentRoute === "/profile" && <Profile />}
        {currentRoute === "/admin/users" && (
          <AdminUsersPage onNavigate={navigate} initialTab="users" />
        )}
        {currentRoute === "/admin/database" && (
          <AdminUsersPage onNavigate={navigate} initialTab="database" />
        )}
        {currentRoute === "/admin/dataset" && (
          <AdminDatasetPage onNavigate={navigate} />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
