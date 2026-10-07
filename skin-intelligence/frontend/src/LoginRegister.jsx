import React, { useState } from 'react';
import { api } from './api';

export default function LoginRegister({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.login(email, password);
        onAuthSuccess(data.user);
      } else {
        const data = await api.register(fullName, email, password, role);
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthMock = async (provider) => {
    setError('');
    setLoading(true);
    const mockEmail = `${provider.toLowerCase()}_user_${Math.floor(Math.random() * 1000)}@example.com`;
    const mockName = `OAuth ${provider} User`;
    try {
      const data = await api.oauthMock(provider, `mock_token_${Date.now()}`, mockEmail, mockName, 'USER');
      onAuthSuccess(data.user);
    } catch (err) {
      setError('OAuth simulation failed. Please try credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-section">
            <div className="logo-mark">
              <span className="logo-sparkle">✦</span>
            </div>
            <h1>AI Skin Intelligence</h1>
          </div>
          <p className="auth-subtitle">Personalized Skincare Planner</p>
        </div>

        <div className="tab-buttons">
          <button 
            type="button"
            className={isLogin ? 'active' : ''} 
            onClick={() => { setIsLogin(true); setError(''); }}
            id="tab-login"
          >
            Sign In
          </button>
          <button 
            type="button"
            className={!isLogin ? 'active' : ''} 
            onClick={() => { setIsLogin(false); setError(''); }}
            id="tab-register"
          >
            Register
          </button>
        </div>

        {error && <div className="error-message" id="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" id="auth-form-el">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="role">I am a...</label>
              <select 
                id="role" 
                value={role} 
                onChange={(e) => setRole(e.target.value)}
                className="role-select"
              >
                <option value="USER">Skincare Consumer (User)</option>
                <option value="SKINCARE_CONSULTANT">Skincare Consultant</option>
                <option value="DERMATOLOGIST">Dermatologist</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading} id="auth-submit-btn">
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="divider">
          <span>Or sign in with</span>
        </div>

        <div className="oauth-buttons">
          <button 
            type="button" 
            onClick={() => handleOAuthMock('Google')} 
            className="oauth-btn google-btn"
            id="oauth-google"
          >
            <span className="oauth-icon">G</span> Google
          </button>
          <button 
            type="button" 
            onClick={() => handleOAuthMock('Apple')} 
            className="oauth-btn apple-btn"
            id="oauth-apple"
          >
            <span className="oauth-icon"></span> Apple
          </button>
        </div>
      </div>
    </div>
  );
}
