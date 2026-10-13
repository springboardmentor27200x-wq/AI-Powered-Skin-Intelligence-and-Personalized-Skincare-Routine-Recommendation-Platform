import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { PageRoute } from "../types";
import {
  LayoutDashboard,
  Sparkles,
  HeartPulse,
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Activity,
  Layers,
  ShoppingBag,
  Zap,
  ChevronDown,
  Users,
  Database,
  FileSpreadsheet,
  Stethoscope,
  Bell,
  Download,
} from "lucide-react";
import { ReminderModal } from "./ReminderModal";
import { ClinicalReportModal } from "./ClinicalReportModal";

interface NavigationProps {
  currentRoute: PageRoute;
  onNavigate: (route: PageRoute) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ currentRoute, onNavigate }) => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isAdmin = user?.role === "ADMIN";
  const isDermatologist = user?.role === "DERMATOLOGIST";
  const isUser = !isAdmin && !isDermatologist;

  // User Navigation: Personal skincare items + Consult Dermatologist
  const userNavItems = [
    { id: "nav-dashboard", label: "Dashboard", route: "/dashboard" as PageRoute, icon: LayoutDashboard },
    { id: "nav-skin-profile", label: "Skin Profile", route: "/skin-profile" as PageRoute, icon: Sparkles },
    { id: "nav-routine", label: "Routine", route: "/routine" as PageRoute, icon: Layers },
    { id: "nav-products", label: "Products", route: "/products" as PageRoute, icon: ShoppingBag },
    { id: "nav-consultations", label: "Consult Dermatologist", route: "/consultations" as PageRoute, icon: Stethoscope },
    { id: "nav-ingredients", label: "Ingredients", route: "/ingredients" as PageRoute, icon: Zap },
  ];

  // Dermatologist Navigation: Clinical patient cases, patient queries, INCI lab, formulations & dataset
  const dermatologistNavItems = [
    { id: "nav-derm-dashboard", label: "Clinical Dashboard", route: "/dashboard" as PageRoute, icon: Stethoscope },
    { id: "nav-derm-queries", label: "Patient Queries", route: "/consultations" as PageRoute, icon: HeartPulse },
    { id: "nav-derm-patients", label: "Patient Cases", route: "/admin/users" as PageRoute, icon: Users },
    { id: "nav-derm-products", label: "Formulations", route: "/products" as PageRoute, icon: ShoppingBag },
    { id: "nav-derm-ingredients", label: "Ingredient Lab", route: "/ingredients" as PageRoute, icon: Zap },
    { id: "nav-derm-dataset", label: "Clinical Dataset", route: "/admin/dataset" as PageRoute, icon: FileSpreadsheet },
  ];

  // Admin Navigation: Strictly System & User Administration (No Product Catalog)
  const adminNavItems = [
    { id: "nav-admin-dashboard", label: "Admin Dashboard", route: "/dashboard" as PageRoute, icon: LayoutDashboard },
    { id: "nav-admin-users", label: "Users", route: "/admin/users" as PageRoute, icon: Users },
    { id: "nav-admin-dataset", label: "Clinical Dataset", route: "/admin/dataset" as PageRoute, icon: FileSpreadsheet },
    { id: "nav-admin-database", label: "Database", route: "/admin/database" as PageRoute, icon: Database },
  ];

  const primaryNavItems = isAdmin
    ? adminNavItems
    : isDermatologist
    ? dermatologistNavItems
    : userNavItems;

  const handleNavClick = (route: PageRoute) => {
    onNavigate(route);
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const handleSignOut = () => {
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    logout();
    onNavigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#EAE6DE]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single-line Brand Title */}
          <button
            id="brand-logo-btn"
            onClick={() => handleNavClick("/dashboard")}
            className="text-lg font-serif font-bold tracking-tight text-[#2E2C29] whitespace-nowrap shrink-0 cursor-pointer"
          >
            SkinIntel
          </button>

          {/* Zone 2: Role-Based Concise Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-[#6E685E]">
            {primaryNavItems.map((item) => {
              const isActive = currentRoute === item.route;
              return (
                <button
                  key={item.id}
                  id={item.id}
                  onClick={() => handleNavClick(item.route)}
                  className={`py-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
                    isActive
                      ? "border-[#5A6D5C] text-[#2E2C29] font-bold"
                      : "border-transparent text-[#6E685E] hover:text-[#2E2C29]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Account Menu (No Role Switcher) */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            {user ? (
              <>
                {/* Notification Reminders Bell Button */}
                <button
                  id="notifications-bell-btn"
                  onClick={() => setIsReminderModalOpen(true)}
                  className="p-1.5 rounded-lg border border-[#EAE6DE] bg-white hover:bg-[#FAF8F5] text-[#6E685E] hover:text-[#2E2C29] transition-colors cursor-pointer relative"
                  title="Routine Reminders & Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="w-2 h-2 rounded-full bg-amber-600 absolute top-1 right-1" />
                </button>

                <div className="relative" ref={profileMenuRef}>
                  <button
                    id="user-menu-btn"
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#EAE6DE] bg-white hover:bg-[#FAF8F5] text-[#2E2C29] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <span className="font-semibold truncate max-w-[110px]">
                      {user.name?.split(" ")[0]}
                    </span>
                    <span aria-hidden="true" className="text-[#8C857B]">
                      ·
                    </span>
                    <span className="text-[11px] font-semibold text-[#5A6D5C]">
                      {user.role}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-[#8C857B] transition-transform ${
                        isProfileMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-lg border border-[#EAE6DE] py-1.5 z-50 text-xs">
                      <div className="px-3.5 py-2 border-b border-[#F2EDE4] mb-1">
                        <p className="font-semibold text-[#2E2C29] truncate">{user.name}</p>
                        <p className="text-[11px] text-[#8C857B] truncate">
                          {user.email} · {user.role}
                        </p>
                      </div>

                      {isUser && (
                        <>
                          <button
                            onClick={() => handleNavClick("/assessment")}
                            className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 text-[#4A4742] hover:bg-[#FAF8F5] cursor-pointer"
                          >
                            <Activity className="w-3.5 h-3.5 text-[#5A6D5C]" />
                            <span>Skin Health Assessment</span>
                          </button>
                          <button
                            onClick={() => handleNavClick("/lifestyle")}
                            className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 text-[#4A4742] hover:bg-[#FAF8F5] cursor-pointer"
                          >
                            <HeartPulse className="w-3.5 h-3.5 text-[#5A6D5C]" />
                            <span>Water & Lifestyle Tracker</span>
                          </button>
                          <button
                            onClick={() => handleNavClick("/sleep")}
                            className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 text-[#4A4742] hover:bg-[#FAF8F5] cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#5A6D5C]" />
                            <span>Sleep Quality Tracker</span>
                          </button>
                        </>
                      )}

                      {/* Reminder Notifications Item */}
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsReminderModalOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2 flex items-center justify-between text-[#4A4742] hover:bg-[#FAF8F5] cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bell className="w-3.5 h-3.5 text-[#5A6D5C]" />
                          <span>Notification Reminders</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-amber-600 shrink-0" />
                      </button>

                      {/* Download Clinical Report Item */}
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsReportModalOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 text-[#2E2C29] font-medium hover:bg-[#FAF8F5] cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[#5A6D5C]" />
                        <span>Download Clinical Report</span>
                      </button>

                      <button
                        onClick={() => handleNavClick("/profile")}
                        className="w-full text-left px-3.5 py-2 flex items-center gap-2.5 text-[#4A4742] hover:bg-[#FAF8F5] cursor-pointer"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-[#5A6D5C]" />
                        <span>Account Settings</span>
                      </button>

                      <div className="border-t border-[#F2EDE4] my-1" />

                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-3.5 py-2 text-[#B85D52] hover:bg-[#FAF0EE] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <button
                id="header-login-btn"
                onClick={() => handleNavClick("/login")}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#5A6D5C] text-white hover:bg-[#4A5D4C] cursor-pointer whitespace-nowrap shrink-0"
              >
                Sign In
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-[#6E685E] hover:text-[#2E2C29] hover:bg-[#F2EDE4] cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (No Role Switcher) */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#EAE6DE] bg-[#FDFBF7] px-4 pt-2 pb-4 space-y-1">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.route)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  isActive ? "bg-[#5A6D5C] text-white" : "text-[#4A4742] hover:bg-[#F2EDE4]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-[#EAE6DE] mt-2 space-y-1">
            {/* Quick Actions in Mobile Drawer */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsReminderModalOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#4A4742] hover:bg-[#F2EDE4] cursor-pointer"
            >
              <Bell className="w-4 h-4 text-[#5A6D5C]" />
              <span>Routine Reminders</span>
            </button>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsReportModalOpen(true);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#4A4742] hover:bg-[#F2EDE4] cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#5A6D5C]" />
              <span>Download Clinical Report</span>
            </button>

            {isUser && (
              <>
                <button
                  onClick={() => handleNavClick("/assessment")}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-[#6E685E] hover:bg-[#F2EDE4] cursor-pointer"
                >
                  <Activity className="w-4 h-4" />
                  <span>Skin Health Assessment</span>
                </button>
                <button
                  onClick={() => handleNavClick("/lifestyle")}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs text-[#6E685E] hover:bg-[#F2EDE4] cursor-pointer"
                >
                  <HeartPulse className="w-4 h-4" />
                  <span>Water & Sleep Logs</span>
                </button>
              </>
            )}
          </div>

          {user && (
            <div className="pt-2 mt-2 border-t border-[#EAE6DE] flex items-center justify-between px-1">
              <span className="text-xs font-medium text-[#2E2C29] truncate">
                {user.name} ({user.role})
              </span>
              <button
                onClick={handleSignOut}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#B85D52] hover:text-[#A2483E] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Routine Reminders Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        onNavigate={handleNavClick}
      />

      {/* Comprehensive Clinical Report Download & Print Modal */}
      <ClinicalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </header>
  );
};
