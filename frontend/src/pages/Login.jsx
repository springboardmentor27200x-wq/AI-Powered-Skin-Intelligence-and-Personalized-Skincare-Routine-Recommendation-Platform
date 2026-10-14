import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
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
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Welcome back</p>
      <h1 className="font-display text-3xl text-ink">Log in</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
            value={form.password}
            onChange={update("password")}
            className="focus-ring w-full rounded-xl border border-clay bg-white px-4 py-2.5 text-ink"
            placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
          />
        </div>

        {error && (
          <p className="rounded-lg bg-bloom-200/60 px-3 py-2 text-sm text-bloom-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="focus-ring w-full rounded-full bg-clinical-500 px-6 py-3 font-medium text-white transition hover:bg-clinical-600 disabled:opacity-60"
        >
          {submitting ? "Logging in..." : "Log in"}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink/60">
        New here?{" "}
        <Link to="/register" className="font-medium text-clinical-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
