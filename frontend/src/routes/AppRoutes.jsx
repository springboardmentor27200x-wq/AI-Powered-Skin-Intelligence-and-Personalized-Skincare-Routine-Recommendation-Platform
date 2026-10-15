import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// Public pages
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { AssessmentPage } from '../pages/AssessmentPage';
import { RecommendationsPage } from '../pages/RecommendationsPage';
import { RoutinePage } from '../pages/RoutinePage';

// Authenticated pages
import { DashboardPage } from '../pages/DashboardPage';
import { SkinProfilePage } from '../pages/SkinProfilePage';
import { LifestylePage } from '../pages/LifestylePage';
import { SleepPage } from '../pages/SleepPage';
import { HydrationPage } from '../pages/HydrationPage';
import { SettingsPage } from '../pages/SettingsPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';

// Layout wrapper (must be lazy-imported after routes are defined)
import { AppLayout } from '../components/layout/AppLayout';

export function AppRoutes() {
  return (
    <Routes>
      {/* ─── Public Routes ─── */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/*
       * ─── Authenticated Layout Shell ───
       * ProtectedRoute verifies auth then renders AppLayout.
       * AppLayout renders <Outlet /> so child routes appear inside
       * the shared Navbar + Sidebar + Footer shell.
       */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard"    element={<DashboardPage />} />
        <Route path="/skin-profile" element={<SkinProfilePage />} />
        <Route path="/lifestyle"    element={<LifestylePage />} />
        <Route path="/sleep"        element={<SleepPage />} />
        <Route path="/hydration"    element={<HydrationPage />} />
        <Route path="/settings"     element={<SettingsPage />} />
        <Route path="/assessment" element={<AssessmentPage />} />
        <Route path="/recommendations" element={<RecommendationsPage />} />
        <Route path="/routine" element={<RoutinePage />} />

        {/* Admin-only nested route */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMINISTRATOR']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* ─── 404 Catch-all ─── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
