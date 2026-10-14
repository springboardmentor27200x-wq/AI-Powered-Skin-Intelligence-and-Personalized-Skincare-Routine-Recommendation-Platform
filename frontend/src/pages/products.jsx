import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ProductRecommendations from "../components/productrecommendations";

export default function Products() {
  const { user } = useAuth();
  if (user.role !== "user") return <Navigate to="/dashboard" replace />;

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Products</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Product Recommendations</h1>
      <p className="mt-3 text-ink/65">
        Products scored, compared, and filtered specifically for your skin.
      </p>

      <div className="mt-10">
        <ProductRecommendations />
      </div>
    </div>
  );
}