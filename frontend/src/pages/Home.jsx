import { Link } from "react-router-dom";
export default function Home() {
  return <section className="hero">
    <div>
      <p className="eyebrow">MILESTONE 1 · CORE SETUP</p>
      <h1>AI Skin Intelligence & Personalized Skincare Planner</h1>
      <p className="lead">A secure foundation for collecting skin profile, lifestyle, sleep, hydration, and environmental exposure information.</p>
      <div className="actions"><Link className="primary" to="/register">Create Account</Link><Link className="secondary" to="/login">Login</Link></div>
    </div>
  </section>;
}
