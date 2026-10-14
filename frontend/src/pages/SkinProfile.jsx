import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import SkinProfileForm from "../components/SkinProfileForm";

export default function SkinProfile() {
  const { user } = useAuth();
  if (user.role !== "user") return <Navigate to="/dashboard" replace />;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Skin profile</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Skin type, concerns & lifestyle</h1>
      <p className="mt-3 text-ink/65">
        Used to personalize your routine, product recommendations, and skin score.
      </p>

      <div className="mt-10 rounded-2xl border border-clay bg-white p-6">
        <SkinProfileForm />
      </div>
    </div>
  );
}