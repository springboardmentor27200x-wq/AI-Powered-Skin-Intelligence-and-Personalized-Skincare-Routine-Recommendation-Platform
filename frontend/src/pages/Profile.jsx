import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-clinical-600">Account</p>
      <h1 className="mt-2 font-display text-3xl text-ink">Your profile</h1>
      <p className="mt-3 text-ink/65">Account details tied to your Skin Intelligence login.</p>

      <div className="mt-10 rounded-2xl border border-clay bg-white p-6">
        <h2 className="font-display text-lg text-ink">Signed in as</h2>
        <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-ink/50">Name</dt>
          <dd className="text-ink">{user.full_name}</dd>
          <dt className="text-ink/50">Email</dt>
          <dd className="text-ink">{user.email}</dd>
          <dt className="text-ink/50">Role</dt>
          <dd className="text-ink">{user.role.replace("_", " ")}</dd>
        </dl>
      </div>
    </div>
  );
}