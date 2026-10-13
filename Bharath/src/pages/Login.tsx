import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { PageRoute, UserRole } from "../types";
import {
  Sparkles,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  User as UserIcon,
  Shield,
  Stethoscope,
  CheckCircle2,
} from "lucide-react";

interface LoginProps {
  onNavigate: (route: PageRoute) => void;
}

const ROLE_OPTIONS: {
  role: UserRole;
  title: string;
  subtitle: string;
  demoName: string;
  demoEmail: string;
  features: string[];
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    role: "USER",
    title: "User / Patient",
    subtitle: "Personal Skincare & Daily Routine",
    demoName: "Sarah Jenkins",
    demoEmail: "user@example.com",
    features: [
      "Skin Health Score & Profile",
      "AM/PM, Weekly & Seasonal Routine",
      "Water, Sleep & Product Matcher",
    ],
    icon: UserIcon,
  },
  {
    role: "DERMATOLOGIST",
    title: "Dermatologist",
    subtitle: "Clinical Specialist & INCI Lab",
    demoName: "Dr. Clara Chen",
    demoEmail: "derm@example.com",
    features: [
      "Patient Skin Dossiers & Triage",
      "INCI Active & Conflict Lab",
      "1,200-Case Clinical Dataset",
    ],
    icon: Stethoscope,
  },
  {
    role: "ADMIN",
    title: "Administrator",
    subtitle: "System & Records Management",
    demoName: "Dr. Marcus Vance",
    demoEmail: "admin@example.com",
    features: [
      "User Accounts & Records",
      "Database Collections & Reseed",
      "Clinical Dataset Administration",
    ],
    icon: Shield,
  },
];

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login, quickLoginDemo } = useAuth();
  // Step 1: Ask user for their role before login (once confirmed, role cannot be switched)
  const [roleConfirmed, setRoleConfirmed] = useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>("USER");
  const [email, setEmail] = useState("user@example.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChooseRole = (role: UserRole, proceedToForm = true) => {
    setSelectedRole(role);
    setErrorMessage(null);
    const found = ROLE_OPTIONS.find((r) => r.role === role);
    if (found) {
      setEmail(found.demoEmail);
      setPassword("password123");
    }
    if (proceedToForm) {
      setRoleConfirmed(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password, selectedRole);
      onNavigate("/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async (role: UserRole) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await quickLoginDemo(role);
      onNavigate("/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Quick demo login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const activeRoleMeta =
    ROLE_OPTIONS.find((r) => r.role === selectedRole) || ROLE_OPTIONS[0];
  const ActiveRoleIcon = activeRoleMeta.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FDFBF7]">
      <div className={`w-full ${!roleConfirmed ? "max-w-3xl" : "max-w-md"} transition-all`}>
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#5A6D5C] text-white mb-3">
            <Sparkles className="w-5 h-5 text-[#E8EFE9]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2E2C29] tracking-tight">
            {!roleConfirmed
              ? "Select Your Role to Continue"
              : `${activeRoleMeta.title} Sign In`}
          </h1>
          <p className="text-xs text-[#6E685E] mt-1">
            {!roleConfirmed
              ? "Choose your role below before logging in to open your dedicated dashboard"
              : activeRoleMeta.subtitle}
          </p>
        </div>

        {/* STEP 1: Role Selection Gate BEFORE Login */}
        {!roleConfirmed ? (
          <div className="bg-white rounded-2xl border border-[#EAE6DE] p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ROLE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedRole === option.role;
                return (
                  <div
                    key={option.role}
                    onClick={() => handleChooseRole(option.role, false)}
                    className={`rounded-xl border p-5 flex flex-col justify-between transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#5A6D5C] bg-[#FAF8F5]"
                        : "border-[#EAE6DE] bg-white hover:border-[#8BA88E]"
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="w-9 h-9 rounded-lg bg-[#F0F5F1] text-[#5A6D5C] flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#5A6D5C]" />
                        )}
                      </div>

                      <div>
                        <h2 className="font-serif font-bold text-base text-[#2E2C29]">
                          {option.title}
                        </h2>
                        <p className="text-[11px] text-[#6E685E] mt-0.5">
                          {option.subtitle}
                        </p>
                      </div>

                      <ul className="space-y-1.5 pt-2 border-t border-[#F2EDE4] text-xs text-[#4A4742]">
                        {option.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-[#5A6D5C] font-bold">·</span>
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-4 mt-4 border-t border-[#F2EDE4]">
                      <button
                        type="button"
                        id={`select-role-${option.role.toLowerCase()}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleChooseRole(option.role, true);
                        }}
                        className="w-full py-2.5 px-3 rounded-lg bg-[#5A6D5C] hover:bg-[#4A5D4C] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Continue as {option.title.split(" ")[0]}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#F2EDE4] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#6E685E]">
              <span>
                Need a new account? Select your role during registration.
              </span>
              <button
                id="login-goto-register-btn"
                onClick={() => onNavigate("/register")}
                className="font-semibold text-[#5A6D5C] hover:underline cursor-pointer"
              >
                Create Account →
              </button>
            </div>
          </div>
        ) : (
          /* STEP 2: Login Credentials Form for the Locked Role (No Role Switching) */
          <div className="bg-white rounded-2xl border border-[#EAE6DE] p-6 sm:p-7 space-y-5">
            {/* Locked Role Header */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE6DE]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#F0F5F1] text-[#5A6D5C] flex items-center justify-center">
                  <ActiveRoleIcon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#2E2C29]">
                    {activeRoleMeta.title} Portal
                  </div>
                  <div className="text-[11px] text-[#6E685E]">
                    Role locked for this session
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-semibold text-[#5A6D5C]">
                {selectedRole}
              </span>
            </div>

            {errorMessage && (
              <div
                id="login-error-alert"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <div className="flex-1 font-medium">{errorMessage}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A4742] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C857B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-email-input"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3 py-2.5 bg-[#FAF8F5] border border-[#EAE6DE] rounded-xl text-sm text-[#2E2C29] placeholder-[#8C857B] focus:bg-white focus:border-[#5A6D5C] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A4742] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C857B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="login-password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FAF8F5] border border-[#EAE6DE] rounded-xl text-sm text-[#2E2C29] placeholder-[#8C857B] focus:bg-white focus:border-[#5A6D5C] focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    id="login-toggle-password-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C857B] hover:text-[#2E2C29] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-[#5A6D5C] text-white font-semibold text-sm hover:bg-[#4A5D4C] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In as {activeRoleMeta.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Single Demo Login for the Selected Role Only */}
            <div className="pt-3 border-t border-[#F2EDE4]">
              <button
                id={`demo-login-${selectedRole.toLowerCase()}`}
                type="button"
                onClick={() => handleQuickDemo(selectedRole)}
                disabled={isLoading}
                className="w-full py-2 px-3 rounded-xl border border-[#EAE6DE] bg-[#FAF8F5] hover:border-[#5A6D5C] text-[#2E2C29] text-xs font-semibold text-center transition-colors cursor-pointer"
              >
                1-Click Demo Sign In ({activeRoleMeta.demoName} · {activeRoleMeta.demoEmail})
              </button>
            </div>

            <div className="pt-1 text-center text-xs text-[#6E685E]">
              Don't have an account yet?{" "}
              <button
                id="login-goto-register-btn"
                onClick={() => onNavigate("/register")}
                className="font-semibold text-[#5A6D5C] hover:underline cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>
        )}

        {/* Footer note */}
        <div className="mt-5 flex items-center justify-center gap-2 text-xs text-[#6E685E]">
          <ShieldCheck className="w-4 h-4 text-[#5A6D5C]" />
          <span>Role-based access control: User · Dermatologist · Administrator</span>
        </div>
      </div>
    </div>
  );
};
