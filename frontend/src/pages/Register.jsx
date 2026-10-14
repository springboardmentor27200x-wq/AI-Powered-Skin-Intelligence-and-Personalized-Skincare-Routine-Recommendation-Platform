import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "skincare_consultant", label: "Skincare Consultant" },
  { value: "dermatologist", label: "Dermatologist" },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Get started</p>
      <h1 className="font-display text-3xl text-ink">Create your account</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="full_name" className="mb-1.5 block text-sm font-medium text-ink/80">
            Full name
          </label>
          <input
            id="full_name"
            required
            minLength={2}
            value={form.full_name}
            onChange={update("full_name")}
            className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink/80">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={update("email")}
            className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink/80">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={update("password")}
            className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
            placeholder="At least 8 characters"
          />
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink/80">I am a</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {ROLE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`focus-ring cursor-pointer rounded-xl border px-3 py-2.5 text-center text-sm transition ${
                  form.role === opt.value
                    ? "border-clinical-500 bg-clinical-50 text-clinical-700"
                    : "border-clay bg-white text-ink/70 hover:border-clinical-400"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={opt.value}
                  checked={form.role === opt.value}
                  onChange={update("role")}
                  className="sr-only"
                />
                {opt.label}
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink/45">
            Administrator accounts are provisioned separately by the platform team.
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="focus-ring w-full rounded-full bg-clinical-500 px-6 py-3 font-medium text-white transition hover:bg-clinical-600 disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink/60">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-clinical-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
