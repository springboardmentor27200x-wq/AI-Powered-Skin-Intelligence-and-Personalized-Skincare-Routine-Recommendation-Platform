
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createSkinProfile,
  getSkinProfile,
  updateSkinProfile,
} from "../services/api";

function SkinProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    skin_type: "",
    concerns: "",
    sensitivity: "",
    allergies: "",
    budget_inr: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Safely retrieve the logged-in user.
  const getLoggedInUser = () => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  };

  // Load an existing profile when the page opens.
  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setProfileLoading(true);
      setError("");

      try {
        const user = getLoggedInUser();
        const userId = user?.user_id ?? user?.id;

        if (!userId) {
          throw new Error("Please log in again. User ID is missing.");
        }

        const profile = await getSkinProfile(userId);

        if (cancelled) return;

        setFormData({
          skin_type: profile.skin_type ?? "",
          concerns: profile.concerns ?? "",
          sensitivity: profile.sensitivity ?? "",
          allergies: profile.allergies ?? "",
          budget_inr: profile.budget_inr ?? "",
        });

        setProfileExists(true);
      } catch (err) {
        if (cancelled) return;

        if (err.status === 404) {
          // No existing profile: the form is ready for creation.
          setProfileExists(false);
        } else {
          setError(err.message || "Unable to load your skin profile.");
        }
      } finally {
        if (!cancelled) {
          setProfileLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  // Update form values.
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage("");
    setError("");
  };

  // Create a profile or update the existing one.
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (profileLoading) {
      setError("Please wait while your profile loads.");
      return;
    }

    if (loading) return;

    const user = getLoggedInUser();
    const userId = user?.user_id ?? user?.id;

    if (!userId) {
      setError("Please log in again. User ID is missing.");
      return;
    }

    if (
      !formData.skin_type.trim() ||
      !formData.concerns.trim() ||
      !formData.sensitivity.trim() ||
      !formData.allergies.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    const budget =
      formData.budget_inr === ""
        ? null
        : Number(formData.budget_inr);

    if (budget !== null && (!Number.isFinite(budget) || budget < 0)) {
      setError("Please enter a valid non-negative budget.");
      return;
    }

    const profileData = {
      user_id: userId,
      skin_type: formData.skin_type.trim(),
      concerns: formData.concerns.trim(),
      sensitivity: formData.sensitivity.trim(),
      allergies: formData.allergies.trim(),
      budget_inr: budget,
    };

    setLoading(true);

    try {
      if (profileExists) {
        await updateSkinProfile(userId, profileData);
        setMessage("Skin profile updated successfully! ✨");
      } else {
        try {
          await createSkinProfile(profileData);
          setProfileExists(true);
          setMessage("Skin profile created successfully! ✨");
        } catch (createError) {
          // Handle a profile created elsewhere or by another request.
          if (
            createError.message
              ?.toLowerCase()
              .includes("skin profile already exists")
          ) {
            await updateSkinProfile(userId, profileData);
            setProfileExists(true);
            setMessage("Skin profile updated successfully! ✨");
          } else {
            throw createError;
          }
        }
      }
    } catch (err) {
      setError(err.message || "Unable to save your skin profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .skin-page {
          min-height: 100vh;
          padding: 35px 20px;
          position: relative;
          overflow: hidden;
          font-family: Inter, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          background:
            radial-gradient(circle at 5% 10%,
              rgba(104, 178, 163, 0.14), transparent 28%),
            radial-gradient(circle at 95% 90%,
              rgba(135, 194, 179, 0.12), transparent 30%),
            linear-gradient(135deg, #f8fcfb 0%, #edf8f5 50%, #f9fcfb 100%);
        }

        .skin-circle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          animation: skinFloat 7s ease-in-out infinite;
        }

        .skin-circle-one {
          width: 280px;
          height: 280px;
          left: -150px;
          top: 15%;
          background: rgba(66, 157, 141, 0.07);
        }

        .skin-circle-two {
          width: 230px;
          height: 230px;
          right: -110px;
          top: 8%;
          background: rgba(93, 177, 160, 0.08);
          animation-delay: 2s;
        }

        .skin-circle-three {
          width: 190px;
          height: 190px;
          left: 50%;
          bottom: -130px;
          background: rgba(75, 153, 139, 0.06);
          animation-delay: 4s;
        }

        @keyframes skinFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-18px); }
        }

        .skin-topbar {
          width: 100%;
          max-width: 1050px;
          margin: 0 auto 25px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 2;
          gap: 12px;
        }

        .skin-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .skin-brand-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: white;
          box-shadow: 0 7px 20px rgba(45, 108, 96, 0.08);
          font-size: 19px;
        }

        .skin-brand-name {
          color: #285c54;
          font-size: 14px;
          font-weight: 750;
        }

        .skin-brand-subtitle {
          margin-top: 2px;
          color: #8aa09b;
          font-size: 9px;
          letter-spacing: 0.6px;
        }

        .skin-back-button {
          padding: 10px 16px;
          border: 1px solid #dce9e5;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.75);
          color: #54736d;
          font-family: inherit;
          font-size: 11px;
          font-weight: 650;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .skin-back-button:hover {
          background: white;
          color: #2f897b;
          transform: translateY(-1px);
          box-shadow: 0 7px 18px rgba(45, 108, 96, 0.08);
        }

        .skin-container {
          width: 100%;
          max-width: 1050px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 0.85fr 1.15fr;
          position: relative;
          z-index: 2;
          overflow: hidden;
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.90);
          border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 25px 70px rgba(39, 91, 81, 0.12);
          backdrop-filter: blur(20px);
          animation: skinAppear 0.55s ease;
        }

        @keyframes skinAppear {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .skin-info {
          padding: 50px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: linear-gradient(145deg, #e4f5f0, #d9eee8);
        }

        .skin-info-icon {
          width: 68px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 21px;
          margin-bottom: 27px;
          background: rgba(255, 255, 255, 0.75);
          box-shadow: 0 12px 25px rgba(45, 108, 96, 0.08);
          font-size: 31px;
          animation: skinIconFloat 4s ease-in-out infinite;
        }

        @keyframes skinIconFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        .skin-info-label {
          margin: 0 0 10px;
          color: #4b978a;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 1.7px;
        }

        .skin-info h1 {
          margin: 0 0 17px;
          color: #28574f;
          font-size: 39px;
          line-height: 1.1;
          letter-spacing: -1px;
        }

        .skin-info h1 span {
          color: #348c7d;
        }

        .skin-info-description {
          max-width: 350px;
          margin: 0;
          color: #66847e;
          font-size: 13px;
          line-height: 1.8;
        }

        .skin-benefits {
          display: flex;
          flex-direction: column;
          gap: 13px;
          margin-top: 32px;
        }

        .skin-benefit {
          display: flex;
          align-items: center;
          gap: 11px;
          color: #5b7c75;
          font-size: 11px;
          font-weight: 600;
        }

        .skin-benefit-icon {
          width: 29px;
          height: 29px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 9px;
          background: rgba(255, 255, 255, 0.72);
          font-size: 14px;
        }

        .skin-form-section {
          padding: 50px;
          display: flex;
          align-items: center;
        }

        .skin-form-wrapper {
          width: 100%;
          max-width: 470px;
          margin: 0 auto;
        }

        .skin-form-header {
          margin-bottom: 30px;
        }

        .skin-form-header p {
          margin: 0 0 7px;
          color: #68a397;
          font-size: 10px;
          font-weight: 750;
          letter-spacing: 1.5px;
        }

        .skin-form-header h2 {
          margin: 0 0 7px;
          color: #293f3b;
          font-size: 28px;
          letter-spacing: -0.6px;
        }

        .skin-form-header span {
          color: #899a96;
          font-size: 11px;
          line-height: 1.6;
        }

        .skin-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .skin-input-card {
          padding: 15px;
          border: 1px solid #e0ebe8;
          border-radius: 14px;
          background: #fbfdfc;
          transition: border-color 0.2s ease, box-shadow 0.2s ease,
            transform 0.2s ease;
        }

        .skin-input-card:focus-within {
          border-color: #70b3a7;
          background: white;
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(48, 133, 120, 0.08);
        }

        .skin-input-top {
          display: flex;
          align-items: center;
          gap: 11px;
          margin-bottom: 9px;
        }

        .skin-input-icon {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 10px;
          background: #edf8f5;
          font-size: 16px;
        }

        .skin-input-title {
          color: #526963;
          font-size: 11px;
          font-weight: 700;
        }

        .skin-input-description {
          margin-top: 2px;
          color: #9baaa7;
          font-size: 9px;
        }

        .skin-input {
          width: 100%;
          min-height: 43px;
          padding: 10px 12px;
          border: 1px solid #e1e9e7;
          border-radius: 10px;
          outline: none;
          background: white;
          color: #30443f;
          font-family: inherit;
          font-size: 12px;
          transition: border-color 0.2s ease;
        }

        .skin-input::placeholder { color: #b2bdba; }
        .skin-input:hover { border-color: #cbded9; }

        .skin-input:focus {
          border-color: #68aa9e;
          box-shadow: 0 0 0 3px rgba(63, 155, 141, 0.07);
        }

        .skin-save-button {
          width: 100%;
          min-height: 49px;
          margin-top: 5px;
          padding: 12px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #3c9a8b, #277b70);
          color: white;
          font-family: inherit;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 9px 22px rgba(47, 143, 131, 0.20);
          transition: transform 0.2s ease, box-shadow 0.2s ease,
            opacity 0.2s ease;
        }

        .skin-save-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 13px 28px rgba(47, 143, 131, 0.28);
        }

        .skin-save-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .skin-loading {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .skin-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: skinSpin 0.7s linear infinite;
        }

        @keyframes skinSpin {
          to { transform: rotate(360deg); }
        }

        .skin-success,
        .skin-error {
          margin-top: 15px;
          padding: 12px 14px;
          border-radius: 11px;
          font-size: 11px;
          text-align: center;
          animation: skinMessage 0.3s ease;
        }

        .skin-success {
          background: #effaf6;
          border: 1px solid #cde9e0;
          color: #328171;
        }

        .skin-error {
          background: #fff4f2;
          border: 1px solid #f0d8d3;
          color: #ae584d;
        }

        @keyframes skinMessage {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .skin-footer {
          margin-top: 18px;
          color: #a1adaa;
          font-size: 9px;
          text-align: center;
          line-height: 1.5;
        }

        @media (max-width: 850px) {
          .skin-container { grid-template-columns: 1fr; }
          .skin-info, .skin-form-section { padding: 40px; }
          .skin-benefits { flex-direction: row; flex-wrap: wrap; }
        }

        @media (max-width: 550px) {
          .skin-page { padding: 20px 14px; }
          .skin-topbar { margin-bottom: 18px; }
          .skin-brand-name { font-size: 12px; }
          .skin-brand-subtitle { font-size: 8px; }
          .skin-back-button { padding: 8px 11px; font-size: 9px; }
          .skin-info { padding: 30px 25px; }
          .skin-info-icon {
            width: 55px;
            height: 55px;
            font-size: 25px;
          }
          .skin-info h1 { font-size: 31px; }
          .skin-benefits { display: none; }
          .skin-form-section { padding: 30px 25px 35px; }
          .skin-form-header h2 { font-size: 25px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .skin-circle, .skin-info-icon, .skin-container,
          .skin-spinner, .skin-success, .skin-error {
            animation: none;
          }
        }
      `}</style>

      <div className="skin-page">
        <div className="skin-circle skin-circle-one"></div>
        <div className="skin-circle skin-circle-two"></div>
        <div className="skin-circle skin-circle-three"></div>

        <div className="skin-topbar">
          <div
            className="skin-brand"
            onClick={() => navigate("/dashboard")}
          >
            <div className="skin-brand-icon">🌿</div>
            <div>
              <div className="skin-brand-name">
                Skin Intelligence
              </div>
              <div className="skin-brand-subtitle">
                PERSONALIZED SKINCARE
              </div>
            </div>
          </div>

          <button
            className="skin-back-button"
            type="button"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>

        <div className="skin-container">
          <section className="skin-info">
            <div className="skin-info-icon">🧴</div>

            <p className="skin-info-label">
              PERSONAL SKIN PROFILE
            </p>

            <h1>
              Get to know
              <br />
              <span>your skin.</span>
            </h1>

            <p className="skin-info-description">
              Tell us about your skin type, concerns, sensitivity,
              and allergies. This information helps create a more
              personalized skincare experience for you.
            </p>

            <div className="skin-benefits">
              <div className="skin-benefit">
                <span className="skin-benefit-icon">🔍</span>
                Understand your skin
              </div>

              <div className="skin-benefit">
                <span className="skin-benefit-icon">✨</span>
                Track your concerns
              </div>

              <div className="skin-benefit">
                <span className="skin-benefit-icon">🛡️</span>
                Record sensitivities
              </div>
            </div>
          </section>

          <section className="skin-form-section">
            <div className="skin-form-wrapper">
              <div className="skin-form-header">
                <p>SKIN ASSESSMENT</p>

                <h2>
                  {profileLoading
                    ? "Loading your profile..."
                    : profileExists
                      ? "Update your skin profile"
                      : "Tell us about your skin"}
                </h2>

                <span>
                  {profileExists
                    ? "Your saved information is ready to edit."
                    : "Complete the details below to build your skin profile."}
                </span>
              </div>

              {profileLoading ? (
                <div className="skin-success">
                  Loading your saved skin profile...
                </div>
              ) : (
                <form
                  className="skin-form"
                  onSubmit={handleSubmit}
                >
                  <div className="skin-input-card">
                    <div className="skin-input-top">
                      <span className="skin-input-icon">💧</span>
                      <div>
                        <div className="skin-input-title">
                          Skin Type
                        </div>
                        <div className="skin-input-description">
                          How does your skin usually feel?
                        </div>
                      </div>
                    </div>

                    <input
                      className="skin-input"
                      type="text"
                      name="skin_type"
                      placeholder="e.g. Oily, Dry, Combination"
                      value={formData.skin_type}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="skin-input-card">
                    <div className="skin-input-top">
                      <span className="skin-input-icon">₹</span>
                      <div>
                        <div className="skin-input-title">
                          Product Budget
                        </div>
                        <div className="skin-input-description">
                          Optional maximum spend per product in INR
                        </div>
                      </div>
                    </div>

                    <input
                      className="skin-input"
                      type="number"
                      min="0"
                      name="budget_inr"
                      placeholder="e.g. 1000"
                      value={formData.budget_inr}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="skin-input-card">
                    <div className="skin-input-top">
                      <span className="skin-input-icon">✨</span>
                      <div>
                        <div className="skin-input-title">
                          Skin Concerns
                        </div>
                        <div className="skin-input-description">
                          What would you like to improve?
                        </div>
                      </div>
                    </div>

                    <input
                      className="skin-input"
                      type="text"
                      name="concerns"
                      placeholder="e.g. Acne, Pigmentation, Dryness"
                      value={formData.concerns}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="skin-input-card">
                    <div className="skin-input-top">
                      <span className="skin-input-icon">🛡️</span>
                      <div>
                        <div className="skin-input-title">
                          Sensitivity
                        </div>
                        <div className="skin-input-description">
                          How reactive is your skin?
                        </div>
                      </div>
                    </div>

                    <input
                      className="skin-input"
                      type="text"
                      name="sensitivity"
                      placeholder="e.g. Low, Medium, High"
                      value={formData.sensitivity}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="skin-input-card">
                    <div className="skin-input-top">
                      <span className="skin-input-icon">🌱</span>
                      <div>
                        <div className="skin-input-title">
                          Allergies
                        </div>
                        <div className="skin-input-description">
                          List known allergies or enter None
                        </div>
                      </div>
                    </div>

                    <input
                      className="skin-input"
                      type="text"
                      name="allergies"
                      placeholder="e.g. Fragrance, None"
                      value={formData.allergies}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <button
                    className="skin-save-button"
                    type="submit"
                    disabled={loading || profileLoading}
                  >
                    {loading ? (
                      <span className="skin-loading">
                        <span className="skin-spinner"></span>
                        Saving your profile...
                      </span>
                    ) : (
                      <>
                        {profileExists
                          ? "Update Skin Profile"
                          : "Save Skin Profile"}

                        <span style={{ marginLeft: "8px" }}>
                          →
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {message && (
                <div className="skin-success" role="status">
                  ✓ {message}
                </div>
              )}

              {error && (
                <div className="skin-error" role="alert">
                  ⚠️ {error}
                </div>
              )}

              <div className="skin-footer">
                Your profile helps Skin Intelligence understand
                your unique skincare needs.
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

export default SkinProfile;
