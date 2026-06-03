import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LucideMail, LucideLock, LucideEye, LucideEyeOff,
  LucideShieldCheck, LucideBus, LucideTrendingUp,
  LucideLayoutDashboard, LucideShield, LucideArrowRight,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import './admin-login.css';

export default function AdminLoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ 
      email: email.trim(), 
      password 
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        setError('Access denied. This portal is for admins only.');
        setLoading(false);
        return;
      }

      navigate('/admin');
    }

    setLoading(false);
  };

  return (
    <div className="adl-page">

      {/* ── Left: info panel ── */}
      <div className="adl-panel">
        <div className="adl-panel-inner">
          <div className="adl-panel-badge">
            <LucideShieldCheck size={22} color="#10B981" />
          </div>
          <h2>UniRide Platform<br />Control Center</h2>
          <p>Centralized management for Redeemer's University logistics. Oversee every agency, booking, and transaction in real-time.</p>

          <ul className="adl-feat-list">
            <li><span className="adl-feat-dot"><LucideLayoutDashboard size={13} /></span>Unified Fleet Oversight</li>
            <li><span className="adl-feat-dot"><LucideTrendingUp      size={13} /></span>Real-time Revenue Analytics</li>
            <li><span className="adl-feat-dot"><LucideShield          size={13} /></span>Security &amp; Access Control</li>
          </ul>

          <div className="adl-steps">
            <div className="adl-step active"><div className="adl-step-num">1</div><p>Authenticate</p></div>
            <div className="adl-step"><div className="adl-step-num">2</div><p>Manage Fleet</p></div>
            <div className="adl-step"><div className="adl-step-num">3</div><p>Scale Platform</p></div>
          </div>
        </div>
      </div>

      {/* ── Right: login form ── */}
      <div className="adl-form-side">
        <div className="adl-form-wrap">
          <Link to="/" className="adl-brand">
            <div className="adl-brand-icon"><LucideBus size={17} /></div>
            <div>
              <p className="adl-brand-name">UNIRIDE</p>
              <p className="adl-brand-sub">Admin Dashboard</p>
            </div>
          </Link>

          <h1 className="adl-heading">Admin Login</h1>
          <p className="adl-subheading">Sign in to manage the UNIRIDE platform.</p>

          {error && <div className="adl-error">{error}</div>}

          <form className="adl-form" onSubmit={handleLogin}>
            <div className="adl-field">
              <label>Email Address</label>
              <div className="adl-input-wrap">
                <LucideMail size={13} className="adl-input-icon" />
                <input type="email" placeholder="unitransit3@gmail.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="adl-field">
              <label>Password</label>
              <div className="adl-input-wrap">
                <LucideLock size={13} className="adl-input-icon" />
                <input type={showPass ? 'text' : 'password'} placeholder="Enter your password"
                  value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="adl-eye" onClick={() => setShowPass(p => !p)}>
                  {showPass ? <LucideEyeOff size={13} /> : <LucideEye size={13} />}
                </button>
              </div>
            </div>

            <div className="adl-row-meta">
              <label className="adl-remember"><input type="checkbox" /> Remember me</label>
              <a href="#" className="adl-forgot">Forgot password?</a>
            </div>

            <button type="submit" className="adl-submit" disabled={loading}>
              {loading ? 'Signing in…' : <><span>Sign In</span><LucideArrowRight size={15} /></>}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
