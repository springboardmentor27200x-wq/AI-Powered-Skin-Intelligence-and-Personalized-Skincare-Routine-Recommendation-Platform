import { useEffect, useState } from "react";

function Profile() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      try {
        const response = await fetch("http://localhost:8000/me", {
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          if (!cancelled) setError(data.detail || "Unable to load profile.");
          return;
        }

        if (!cancelled) setUser(data);
      } catch {
        if (!cancelled) setError("Cannot connect to SkinSense server.");
      }
    };

    fetchProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="profile-page">
      <div className="profile-header">
        <p className="home-eyebrow">MY SKINSENSE</p>
        <h1>My Profile 👤</h1>
        <p>Manage your personal information.</p>
      </div>

      {error && <p className="auth-error">{error}</p>}

      <div className="profile-grid profile-grid--account">
        <section className="profile-card">
          <div className="profile-card-title">
            <span aria-hidden="true">👤</span>
            <h2>Account Information</h2>
          </div>

          <div className="profile-field">
            <label>Name</label>
            <p>{user ? user.name || "Not available" : "Loading..."}</p>
          </div>

          <div className="profile-field">
            <label>Email</label>
            <p>{user ? user.email || "Not available" : "Loading..."}</p>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Profile;
