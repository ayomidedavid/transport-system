import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LucideArrowLeft, LucideBus, LucideMailCheck, LucideAlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useUser } from '../_context/UserContext';
import './verify.css';

export default function VerifyPage() {
  const navigate          = useNavigate();
  const location          = useLocation();
  const { user, loading } = useUser();

  const [digits,    setDigits]    = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [error,     setError]     = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resent,    setResent]    = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const email    = location.state?.email    as string | undefined;
  const password = location.state?.password as string | undefined;
  const accountType = location.state?.accountType as string | undefined;

  useEffect(() => { if (!email) navigate('/signup'); }, [email, navigate]);

  useEffect(() => {
    if (!loading && user) {
      navigate((user as any).user_metadata?.role === 'vendor' || accountType === 'logistics' ? '/vendor' : '/dashboard', { replace: true });
    }
  }, [user, loading, navigate, accountType]);

  useEffect(() => {
    if (countdown === 0) { setCanResend(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (digits.every(d => d !== '') && !verifying) handleVerify();
  }, [digits]);

  function handleInput(i: number, val: string) {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputRefs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...digits];
    pasted.split('').forEach((c, i) => { next[i] = c; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  async function handleVerify() {
    if (!email) return;
    setError('');
    setVerifying(true);

    try {
      const res  = await fetch(`${API_URL}/api/auth/verify-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, code: digits.join('') }),
      });
      const data = await res.json();

      if (!res.ok) {
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setError(data.error || 'Invalid or expired code.');
        setVerifying(false);
        return;
      }

      // OTP verified — sign in to create session
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: password ?? '',
      });

      setVerifying(false);
      if (signInError) navigate('/login', { state: { email, verified: true } });
      else navigate(accountType === 'logistics' ? '/vendor' : '/dashboard');
    } catch {
      setVerifying(false);
      setError('Could not reach the server. Please try again.');
    }
  }

  async function handleResend() {
    if (!email) return;
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/auth/send-otp`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      });
      if (!res.ok) { setError('Failed to resend code.'); return; }
      setCanResend(false);
      setCountdown(60);
      setResent(true);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      setError('Could not reach the server.');
    }
  }

  return (
    <div className="vfy-root">
      <div className="vfy-card">

        <Link to="/signup" className="vfy-back">
          <LucideArrowLeft size={13} /> Back to sign up
        </Link>

        <Link to="/" className="vfy-brand">
          <div className="vfy-brand-icon"><LucideBus size={18} /></div>
          <div>
            <p className="vfy-brand-name">UNIRIDE</p>
            <p className="vfy-brand-sub">University Transport Management</p>
          </div>
        </Link>

        <div className="vfy-icon-wrap">
          <LucideMailCheck size={28} />
        </div>

        <h1 className="vfy-title">Check your email</h1>
        <p className="vfy-subtitle">
          We sent a 6-digit verification code to<br />
          <strong>{email}</strong>
        </p>

        {resent && (
          <div className="vfy-success-banner">
            <LucideMailCheck size={14} /> New code sent — check your inbox and spam folder.
          </div>
        )}

        {error && (
          <div className="vfy-error">
            <LucideAlertCircle size={14} style={{ flexShrink: 0 }} /> {error}
          </div>
        )}

        <div className="vfy-otp-row" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              className={`vfy-otp-box${verifying ? ' verifying' : ''}${d ? ' filled' : ''}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleInput(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              autoFocus={i === 0}
              disabled={verifying}
            />
          ))}
        </div>

        <button
          className="vfy-btn"
          disabled={digits.join('').length < 6 || verifying}
          onClick={handleVerify}
        >
          {verifying ? 'Verifying…' : 'Verify Email'}
        </button>

        <p className="vfy-resend">
          {canResend ? (
            <>Didn&apos;t get the code?{' '}
              <button className="vfy-resend-btn" onClick={handleResend}>Resend code</button>
            </>
          ) : (
            <>Resend available in <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{countdown}s</span></>
          )}
        </p>

        <div className="vfy-footer">
          Already verified? <Link to="/login">Sign in</Link>
        </div>

      </div>
    </div>
  );
}
