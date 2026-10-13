import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { PageRoute, UserRole } from "../types";
import {
  Sparkles,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Shield,
  Stethoscope,
} from "lucide-react";

interface RegisterProps {
  onNavigate: (route: PageRoute) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim() || !password) {
      setErrorMessage("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await register(name.trim(), email.trim(), password, role);
      onNavigate("/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FDFBF7]">
      <div className="w-full max-w-md my-6">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#5A6D5C] text-white mb-3">
            <Sparkles className="w-5 h-5 text-[#E8EFE9]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2E2C29] tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs text-[#6E685E] mt-1">
            Select your role to set up your tailored workspace
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-[#EAE6DE] p-6 sm:p-7 space-y-5">
          {errorMessage && (
            <div
              id="register-error-alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Select Role */}
            <div>
              <label className="block text-xs font-semibold text-[#4A4742] mb-1.5">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  id="register-role-user"
                  onClick={() => setRole("USER")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    role === "USER"
                      ? "border-[#5A6D5C] bg-[#F0F5F1]/70 text-[#2E2C29]"
                      : "border-[#EAE6DE] bg-[#FAF8F5] text-[#6E685E]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <UserIcon className="w-3.5 h-3.5 text-[#5A6D5C]" />
                    {role === "USER" && <CheckCircle2 className="w-3.5 h-3.5 text-[#5A6D5C]" />}
                  </div>
                  <div className="text-xs font-semibold">User</div>
                  <div className="text-[10px] text-[#8C857B]">Personal Plan</div>
                </button>

                <button
                  type="button"
                  id="register-role-dermatologist"
                  onClick={() => setRole("DERMATOLOGIST")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    role === "DERMATOLOGIST"
                      ? "border-[#5A6D5C] bg-[#F0F5F1]/70 text-[#2E2C29]"
                      : "border-[#EAE6DE] bg-[#FAF8F5] text-[#6E685E]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Stethoscope className="w-3.5 h-3.5 text-[#5A6D5C]" />
                    {role === "DERMATOLOGIST" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#5A6D5C]" />
                    )}
                  </div>
                  <div className="text-xs font-semibold">Dermatologist</div>
                  <div className="text-[10px] text-[#8C857B]">Clinical Specialist</div>
                </button>

                <button
                  type="button"
                  id="register-role-admin"
                  onClick={() => setRole("ADMIN")}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    role === "ADMIN"
                      ? "border-[#5A6D5C] bg-[#F0F5F1]/70 text-[#2E2C29]"
                      : "border-[#EAE6DE] bg-[#FAF8F5] text-[#6E685E]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <Shield className="w-3.5 h-3.5 text-[#5A6D5C]" />
                    {role === "ADMIN" && <CheckCircle2 className="w-3.5 h-3.5 text-[#5A6D5C]" />}
                  </div>
                  <div className="text-xs font-semibold">Admin</div>
                  <div className="text-[10px] text-[#8C857B]">System Console</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A4742] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#8C857B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="register-name-input"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Rivera"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#FAF8F5] border border-[#EAE6DE] rounded-xl text-sm text-[#2E2C29] placeholder-[#8C857B] focus:bg-white focus:border-[#5A6D5C] focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A4742] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#8C857B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="register-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-[#FAF8F5] border border-[#EAE6DE] rounded-xl text-sm text-[#2E2C29] placeholder-[#8C857B] focus:bg-white focus:border-[#5A6D5C] focus:outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#4A4742] mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C857B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 chars"
                    className="w-full pl-9 pr-8 py-2.5 bg-[#FAF8F5] border border-[#EAE6DE] rounded-xl text-sm text-[#2E2C29] placeholder-[#8C857B] focus:bg-white focus:border-[#5A6D5C] focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C857B] hover:text-[#2E2C29] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A4742] mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#8C857B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="register-confirm-password-input"
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#EAE6DE] rounded-xl text-sm text-[#2E2C29] placeholder-[#8C857B] focus:bg-white focus:border-[#5A6D5C] focus:outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#5A6D5C] text-white font-semibold text-sm hover:bg-[#4A5D4C] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>
                    Create{" "}
                    {role === "ADMIN"
                      ? "Admin"
                      : role === "DERMATOLOGIST"
                      ? "Dermatologist"
                      : "User"}{" "}
                    Account
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-[#F2EDE4] text-center text-xs text-[#6E685E]">
            Already have an account?{" "}
            <button
              id="register-goto-login-btn"
              onClick={() => onNavigate("/login")}
              className="font-semibold text-[#5A6D5C] hover:underline cursor-pointer"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
