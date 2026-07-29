import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, User, ShieldCheck, ArrowRight } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', displayName: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.displayName.trim()) e.displayName = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'At least 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e'][strength];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.email, form.password, form.displayName);
      toast.success('Account created! Please log in.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = () => {
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <ShieldCheck size={36} />
        </div>
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join us today — it's free</p>

        <button className="btn-google" onClick={googleLogin} type="button">
          <GoogleIcon />
          Continue with Google
        </button>

        <div className="divider"><span>or</span></div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label>Full Name</label>
            <div className={`input-wrap ${errors.displayName ? 'error' : ''}`}>
              <User size={16} className="input-icon" />
              <input
                type="text"
                placeholder="John Doe"
                value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
              />
            </div>
            {errors.displayName && <span className="field-error">{errors.displayName}</span>}
          </div>

          <div className="field-group">
            <label>Email</label>
            <div className={`input-wrap ${errors.email ? 'error' : ''}`}>
              <Mail size={16} className="input-icon" />
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="field-group">
            <label>Password</label>
            <div className={`input-wrap ${errors.password ? 'error' : ''}`}>
              <Lock size={16} className="input-icon" />
              <input
                type={show ? 'text' : 'password'}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <button type="button" className="toggle-eye" onClick={() => setShow(s => !s)}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.password && (
              <div className="strength-bar">
                <div className="strength-track">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="strength-seg" style={{ background: i <= strength ? strengthColor : undefined }} />
                  ))}
                </div>
                <span style={{ color: strengthColor, fontSize: '11px', fontWeight: 600 }}>{strengthLabel}</span>
              </div>
            )}
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <div className="field-group">
            <label>Confirm Password</label>
            <div className={`input-wrap ${errors.confirm ? 'error' : ''}`}>
              <Lock size={16} className="input-icon" />
              <input
                type={show ? 'text' : 'password'}
                placeholder="Repeat password"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              />
            </div>
            {errors.confirm && <span className="field-error">{errors.confirm}</span>}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : <><ArrowRight size={16} /> Create Account</>}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
