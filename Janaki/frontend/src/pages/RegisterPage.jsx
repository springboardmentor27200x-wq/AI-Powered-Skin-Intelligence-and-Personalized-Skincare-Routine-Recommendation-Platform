import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/api.js';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ full_name: '', email: '', password: '', role: 'user' });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await register(formData);
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ minHeight: '80vh', display: 'grid', placeItems: 'center' }}>
      <div className="form-card" style={{ width: '100%', maxWidth: '440px', margin: '20px auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div className="brand-mark" style={{ margin: '0 auto 12px', width: '50px', height: '50px', fontSize: '24px' }}>
            🧬
          </div>
          <h2 style={{ fontSize: '24px', color: '#2b344e' }}>Create Account</h2>
          <p style={{ fontSize: '13px', color: '#718096', margin: '4px 0 0' }}>
            Join AI Skin Intelligence Clinical Network
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              type="text"
              name="full_name"
              placeholder="Dr. Jane Doe / John Smith"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="user@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Account Role</label>
            <select name="role" value={formData.role} onChange={handleChange}>
              <option value="user">Patient / Skincare User</option>
              <option value="dermatologist">Licensed Dermatologist</option>
              <option value="consultant">Skincare Consultant</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '12px', fontSize: '14px', marginTop: '10px' }}
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--purple)', fontWeight: 700, textDecoration: 'none' }}>
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}
