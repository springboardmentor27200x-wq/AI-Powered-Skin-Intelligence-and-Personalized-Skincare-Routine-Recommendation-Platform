import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
      <div className="form-card" style={{ width: '100%', maxWidth: '440px', margin: '20px auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div className="brand-mark" style={{ margin: '0 auto 12px', width: '50px', height: '50px', fontSize: '24px' }}>
            🧬
          </div>
          <h2 style={{ fontSize: '24px', color: '#2b344e' }}>Sign In</h2>
          <p style={{ fontSize: '13px', color: '#718096', margin: '4px 0 0' }}>
            AI Skin Intelligence Clinical Workspace
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '10px' }}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--purple)', fontWeight: 700, textDecoration: 'none' }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
