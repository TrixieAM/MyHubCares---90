import React, { useState } from 'react';
import { Home, BookOpen, Smartphone } from 'lucide-react';
import '../css/main.css';
import '../css/components.css';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    role: '',
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: formData.role,
          username: formData.username,
          password: formData.password
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Invalid credentials');
      }

      // Save token and redirect
      localStorage.setItem('token', data.token);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="logo">
              <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="60" height="60" rx="10" fill="#2563eb"/>
                <path d="M30 15L20 25H26V35H22V45H30V35H34V45H42V35H38V25H44L30 15Z" fill="white"/>
              </svg>
            </div>
            <h1>My Hub Cares</h1>
            <p>
              "It's my hub, and it's yours" - Welcome Home!{' '}
              <Home size={18} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px' }} />
            </p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <label htmlFor="role">Login As</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="case_manager">Case Manager</option>
                <option value="nurse">Nurse</option>
                <option value="physician">Physician</option>
                <option value="lab_personnel">Lab Personnel</option>
                <option value="patient">Patient</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Enter username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter password"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

           
          </form>

          <div className="text-center mt-3" style={{ padding: '0 30px 30px' }}>
            <p className="text-muted">New to My Hub Cares?</p>
            <a href="/register" className="btn btn-outline btn-block">
              Create Patient Account
            </a>
            <p className="text-muted mt-2" style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
              Join our family and experience care that feels like home <Home size={14} />
            </p>

            <div className="mt-2" style={{ paddingTop: '15px', borderTop: '1px solid var(--border-color)' }}>
              <p className="text-muted" style={{ fontSize: '13px' }}>Patient on mobile?</p>
              <a
                href="myhubcares://login"
                className="btn btn-primary btn-block"
                style={{ marginTop: '8px', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Smartphone size={16} /> Open Mobile App
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
