import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';

const initialForm = {
  age: '',
  skin_type: '',
  concerns: '',
  allergies: '',
  budget: '',
  sleep_quality: '',
  hydration_level: '',
  lifestyle_score: '',
  routine_consistency: '',
};

export function AssessmentPage() {
  const { isAuthenticated } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [result, setResult] = useState(null);
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
        age: Number(form.age),
        skin_type: form.skin_type,
        concerns: form.concerns.split(',').map((c) => c.trim()).filter(Boolean),
        allergies: form.allergies.split(',').map((a) => a.trim()).filter(Boolean),
        budget: form.budget ? Number(form.budget) : undefined,
        sleep_quality: form.sleep_quality || undefined,
        hydration_level: form.hydration_level || undefined,
        lifestyle_score: form.lifestyle_score ? Number(form.lifestyle_score) : undefined,
        routine_consistency: form.routine_consistency ? Number(form.routine_consistency) : undefined,
      };
      const response = await api.post('/assessment/', payload);
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Assessment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8 text-center">
        <Alert type="warning" className="mb-4">You must be logged in to run an assessment.</Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Skin Assessment & Routine Planner</h2>
      {error && <Alert type="error" className="mb-4">{error}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Age" type="number" name="age" required value={form.age} onChange={handleChange} />
          <Input label="Skin Type" type="text" name="skin_type" required value={form.skin_type} onChange={handleChange} placeholder="dry, oily, sensitive" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Concerns (comma separated)" type="text" name="concerns" required value={form.concerns} onChange={handleChange} placeholder="acne, redness" />
          <Input label="Allergies (comma separated)" type="text" name="allergies" value={form.allergies} onChange={handleChange} placeholder="fragrance, niacinamide" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Budget (optional, $/month)" type="number" name="budget" value={form.budget} onChange={handleChange} />
          <Input label="Lifestyle Score (0-100)" type="number" name="lifestyle_score" min="0" max="100" value={form.lifestyle_score} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Sleep Quality" type="text" name="sleep_quality" value={form.sleep_quality} onChange={handleChange} placeholder="poor, fair, good, excellent" />
          <Input label="Hydration Level" type="text" name="hydration_level" value={form.hydration_level} onChange={handleChange} placeholder="low, moderate, high" />
          <Input label="Routine Consistency (0-100)" type="number" name="routine_consistency" min="0" max="100" value={form.routine_consistency} onChange={handleChange} />
        </div>

        <Button type="submit" variant="primary" isLoading={loading} className="w-full mt-2">Run Assessment</Button>
      </form>

      {result && (
        <div className="mt-8 p-5 border rounded-xl bg-slate-50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">Assessment Result</h3>
            <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm font-semibold">{result.score.toFixed(1)}/100</span>
          </div>

          <p className="text-slate-700 mb-4">{result.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            {Object.entries(result.breakdown || {}).map(([key, value]) => (
              <div key={key} className="bg-white p-3 rounded border">
                <div className="text-sm text-slate-500 capitalize">{key.replace(/_/g, ' ')}</div>
                <div className="text-lg font-semibold">{Number(value).toFixed(1)}</div>
              </div>
            ))}
          </div>

          <div className="mb-5">
            <h4 className="font-semibold mb-2">Priority concerns</h4>
            <ul className="list-disc pl-5 text-slate-700">
              {result.priority_concerns?.map((concern, idx) => (
                <li key={`${concern}-${idx}`}>{concern}</li>
              ))}
            </ul>
          </div>

          <div className="mb-5">
            <h4 className="font-semibold mb-2">Recommendations</h4>
            <ul className="list-disc pl-5 text-slate-700">
              {result.recommendations?.map((rec, idx) => (
                <li key={`${rec}-${idx}`}>{rec}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Routine plan</h4>
            {result.routine && (
              <div className="space-y-4 text-slate-700">
                <div>
                  <h5 className="font-medium">Morning</h5>
                  <ul className="list-disc pl-5">
                    {result.routine.morning?.map((step, idx) => (
                      <li key={`${step}-${idx}`}>{step}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium">Evening</h5>
                  <ul className="list-disc pl-5">
                    {result.routine.evening?.map((step, idx) => (
                      <li key={`${step}-${idx}`}>{step}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium">Weekly</h5>
                  <ul className="list-disc pl-5">
                    {result.routine.weekly?.map((step, idx) => (
                      <li key={`${step}-${idx}`}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
