import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import IngredientLibrary from "../components/ingredientlibrary";

export default function Ingredients() {
  const { user } = useAuth();
  if (user.role !== "user") return <Navigate to="/dashboard" replace />;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Ingredients</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Ingredient Intelligence</h1>
      <p className="mt-3 text-ink/65">
        Every ingredient checked against your skin type, allergies, and sensitivities.
      </p>

      <div className="mt-10">
        <IngredientLibrary />
      </div>
    </div>
  );
}