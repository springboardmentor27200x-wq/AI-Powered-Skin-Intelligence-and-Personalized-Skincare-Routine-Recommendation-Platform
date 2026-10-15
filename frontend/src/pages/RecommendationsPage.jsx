import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';

const initialForm = {
  skin_type: '',
  concerns: '',
  allergies: '',
  budget: '',
  ingredients: '',
};

export function RecommendationsPage() {
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [ingredientResult, setIngredientResult] = useState(null);
  const [productResult, setProductResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        skin_type: form.skin_type,
        concerns: form.concerns.split(',').map((item) => item.trim()).filter(Boolean),
        allergies: form.allergies.split(',').map((item) => item.trim()).filter(Boolean),
        ingredients: form.ingredients.split(',').map((item) => item.trim()).filter(Boolean),
        budget: form.budget ? Number(form.budget) : undefined,
      };

      const [ingredientResponse, productResponse] = await Promise.all([
        api.post('/recommendations/ingredient-analysis', payload),
        api.post('/recommendations/products', payload),
      ]);

      setIngredientResult(ingredientResponse.data);
      setProductResult(productResponse.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Recommendation lookup failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <Alert type="warning">You must be logged in to generate recommendations.</Alert>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Ingredient Intelligence & Product Matching</h2>
      {error && <Alert type="error" className="mb-4">{error}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Skin Type" type="text" name="skin_type" required value={form.skin_type} onChange={handleChange} placeholder="oily, dry, sensitive" />
          <Input label="Budget ($/month)" type="number" name="budget" value={form.budget} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Concerns (comma separated)" type="text" name="concerns" value={form.concerns} onChange={handleChange} placeholder="acne, redness" />
          <Input label="Allergies (comma separated)" type="text" name="allergies" value={form.allergies} onChange={handleChange} placeholder="fragrance" />
        </div>

        <Input label="Ingredients to evaluate (comma separated)" type="text" name="ingredients" value={form.ingredients} onChange={handleChange} placeholder="niacinamide, salicylic acid, retinol" />

        <Button type="submit" variant="primary" isLoading={loading} className="w-full">Analyze and Match</Button>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {ingredientResult && (
          <div className="p-5 border rounded-xl bg-slate-50">
            <h3 className="text-xl font-semibold mb-3">Ingredient Analysis</h3>
            <div className="mb-3">
              <div className="text-sm text-slate-500">Suitability score</div>
              <div className="text-2xl font-bold">{ingredientResult.score.toFixed(1)}/100</div>
            </div>

            <p className="text-slate-700 mb-4">{ingredientResult.summary}</p>

            {ingredientResult.interactions?.length > 0 && (
              <div className="mb-4 border-l-2 border-amber-500 bg-amber-50 px-3 py-2.5">
                <h4 className="font-medium text-amber-950">Active ingredient cautions</h4>
                <ul className="mt-1 space-y-2 text-sm text-amber-900">
                  {ingredientResult.interactions.map((interaction, idx) => (
                    <li key={`${interaction.ingredients.join('-')}-${idx}`}>
                      <strong className="capitalize">{interaction.ingredients.join(' + ')}</strong>: {interaction.guidance}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <h4 className="font-medium">Safe ingredients</h4>
                <ul className="list-disc pl-5 text-slate-700">
                  {ingredientResult.safe_ingredients?.length ? ingredientResult.safe_ingredients.map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>) : <li>None identified</li>}
                </ul>
              </div>

              <div>
                <h4 className="font-medium">Avoid ingredients</h4>
                <ul className="list-disc pl-5 text-slate-700">
                  {ingredientResult.avoid_ingredients?.length ? ingredientResult.avoid_ingredients.map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>) : <li>None noted</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {productResult && (
          <div className="p-5 border rounded-xl bg-white">
            <h3 className="text-xl font-semibold mb-3">Product Recommendations</h3>
            <p className="text-slate-700 mb-4">{productResult.summary}</p>
            <ul className="space-y-3">
              {productResult.recommendations?.map((product, idx) => (
                <li key={`${product.name}-${idx}`} className="border rounded-lg p-3 bg-slate-50">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="font-semibold">{product.name}</div>
                      <div className="text-sm text-slate-500">{product.category}</div>
                    </div>
                    <span className="text-sm font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{product.match_score.toFixed(0)}%</span>
                  </div>
                  <div className="text-sm text-slate-600 mt-2">${product.price}</div>
                  <div className="text-sm text-slate-700 mt-1">{product.why}</div>
                </li>
              ))}
            </ul>
            {productResult.recommendations?.length === 0 && (
              <p className="border-l-2 border-amber-500 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">No catalog matches your current budget and allergy constraints. Adjust either input to see other options.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
