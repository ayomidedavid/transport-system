import { useState } from 'react';
import {
  LucideMail, LucideLock, LucideEye, LucideEyeOff,
  LucideUser, LucidePhone, LucideBuilding2, LucideHash,
  LucideMapPin, LucideBus, LucideGraduationCap, LucideChevronDown,
  LucideBookOpen, LucideTrendingUp, LucideShieldCheck,
  LucideCreditCard, LucideClock, LucideArrowLeft,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useUser, type AccountType, type User } from '../_context/UserContext';
import { useVendor, type Company } from '../_context/VendorContext';
import '../auth.css';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';

const DEPARTMENTS = [
  'Engineering', 'Computer Science', 'Medicine & Surgery', 'Law',
  'Business Administration', 'Social Sciences', 'Arts & Humanities',
  'Education', 'Agriculture', 'Pharmacy', 'Architecture',
];

const GoogleSVG = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

function Brand() {
  return (
    <Link to="/" className="auth-brand">
      <div className="auth-brand-icon"><LucideBus size={17} /></div>
      <div>
        <p className="auth-brand-name">UNIRIDE</p>
        <p className="auth-brand-sub">University Transport Management</p>
      </div>
    </Link>
  );
}

function genStudentId() {
  return 'RUN/' + Math.floor(10000 + Math.random() * 90000);
}

async function handleGoogleSignIn() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        hd: 'run.edu.ng',
        prompt: 'select_account',
      },
    },
  });
}

export function AuthPage({ initialMode }: { initialMode: Mode }) {
  const navigate        = useNavigate();
  const { login }       = useUser();
  const { vendorLogin } = useVendor();

  const [mode,           setMode]           = useState<Mode>(initialMode);
  const [accountType,    setAccountType]    = useState<AccountType>('student');
  const [loginShowPass,  setLoginShowPass]  = useState(false);
  const [signupShowPass, setSignupShowPass] = useState(false);
  const [signupShowConf, setSignupShowConf] = useState(false);
  const [dept,           setDept]           = useState('');
  const [submitting,     setSubmitting]     = useState(false);
  const [error,          setError]          = useState('');

  const [sig, setSig] = useState({
    firstName: '', lastName: '', matric: '', phone: '',
    email: '', password: '', confirm: '',
    companyName: '', regNumber: '', companyEmail: '',
    companyPhone: '', address: '', contactName: '',
  });
  const [log, setLog] = useState({ email: '', password: '' });

  const [forgotEmail, setForgotEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfPass, setResetConfPass] = useState('');

  function us(k: keyof typeof sig, v: string) { setSig(s => ({ ...s, [k]: v })); setError(''); }
  function ul(k: keyof typeof log, v: string) { setLog(l => ({ ...l, [k]: v })); setError(''); }


  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const signupEmail = accountType === 'student' ? sig.email.trim().toLowerCase() : sig.companyEmail.trim().toLowerCase();

    if (accountType === 'student') {
      if (!sig.firstName.trim())        return setError('First name is required.');
      if (!sig.lastName.trim())         return setError('Last name is required.');
      if (!sig.email.trim())            return setError('Email is required.');
      if (!sig.email.toLowerCase().endsWith('@run.edu.ng'))
        return setError('Only @run.edu.ng institutional emails are allowed.');
      if (!sig.matric.trim())           return setError('Matric number is required.');
      if (!sig.phone.trim())            return setError('Phone number is required.');
      if (!dept)                        return setError('Please select your department.');
      if (sig.password.trim().length < 8) return setError('Password must be at least 8 characters.');
      if (sig.password.trim() !== sig.confirm.trim()) return setError('Passwords do not match.');

      setSubmitting(true);
      try {
        const res = await fetch(`/api/auth/signup`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            email:      signupEmail,
            password:   sig.password.trim(),
            firstName:  sig.firstName.trim(),
            lastName:   sig.lastName.trim(),
            phone:      sig.phone.trim(),
            matric:     sig.matric.trim(),
            department: dept,
            studentId:  genStudentId(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || 'Signup failed. Please try again.');
          return;
        }
        navigate('/verify', { state: { email: signupEmail, password: sig.password.trim() } });
      } catch (err: any) {
        if (err.message && err.message.includes('fetch failed')) {
          setError('Supabase connection failed: Your Supabase project appears to be paused or deleted.');
        } else {
          setError(err.message || 'Could not reach the server. Please try again.');
        }
      } finally {
        setSubmitting(false);
      }

    } else {
      if (!sig.companyName.trim())      return setError('Company name is required.');
      if (!sig.companyEmail.trim())     return setError('Company email is required.');
      if (!sig.contactName.trim())      return setError('Contact person name is required.');
      if (sig.password.trim().length < 8) return setError('Password must be at least 8 characters.');
      if (sig.password.trim() !== sig.confirm.trim()) return setError('Passwords do not match.');

      setSubmitting(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/vendor-signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: signupEmail,
            password: sig.password.trim(),
            contactName: sig.contactName.trim(),
            companyName: sig.companyName.trim(),
            regNumber: sig.regNumber?.trim(),
            phone: sig.companyPhone?.trim(),
            address: sig.address?.trim()
          })
        });
        const authData = await res.json();
        
        if (!res.ok) {
          return setError(authData.error || 'Signup failed');
        }

        // Navigate to verify page where they enter the OTP
        navigate('/verify', {
          state: {
            email: signupEmail,
            password: sig.password.trim(),
            accountType: 'logistics'
          }
        });
      } catch (err: any) {
        if (err.message && err.message.includes('fetch failed')) {
          setError('Supabase connection failed: Your Supabase project appears to be paused or deleted.');
        } else {
          setError(err.message || 'An unexpected error occurred.');
        }
      } finally {
        setSubmitting(false);
      }
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!forgotEmail.trim()) return setError('Email is required.');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim() })
      });
      if (!res.ok) throw new Error('Failed to send reset code');
      setMode('reset');
    } catch (err: any) {
      setError(err.message || 'Error requesting reset.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!resetCode.trim() || !resetNewPass.trim()) return setError('Code and new password are required.');
    if (resetNewPass !== resetConfPass) return setError('Passwords do not match.');
    if (resetNewPass.length < 8) return setError('Password must be at least 8 characters.');
    
    setSubmitting(true);
    try {
      const res = await fetch(`/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim(), code: resetCode.trim(), newPassword: resetNewPass })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset password');
      
      setMode('login');
      setError('');
      alert('Password reset successfully. You can now log in.');
    } catch (err: any) {
      setError(err.message || 'Error resetting password.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!log.email.trim())    return setError('Email is required.');
    if (!log.password.trim()) return setError('Password is required.');

    setSubmitting(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email:    log.email.trim().toLowerCase(),
      password: log.password.trim(),
    });

    if (loginError) {
      setSubmitting(false);
      if (loginError.message.toLowerCase().includes('email not confirmed')) {
        navigate('/verify', { state: { email: log.email.trim().toLowerCase() } });
        return;
      }
      return setError(loginError.message);
    }

    if (data.user) {
      let profile = null;
      for (let i = 0; i < 8; i++) {
        const { data: p } = await supabase
          .from('profiles').select('*').eq('id', data.user.id).single();
        if (p) { profile = p; break; }
        await new Promise(res => setTimeout(res, 1500));
      }

      if (!profile) {
        setSubmitting(false);
        return setError('Could not load your profile. Please try again.');
      }

      const accountType = profile.role === 'vendor'
        ? 'logistics'
        : profile.role === 'admin'
          ? 'admin'
          : 'student';

      const meta      = data.user.user_metadata ?? {};
      const fullName  = meta.full_name || meta.name || '';
      const firstName = profile.first_name  || meta.first_name  || fullName.split(' ')[0]                 || '';
      const lastName  = profile.last_name   || meta.last_name   || fullName.split(' ').slice(1).join(' ') || '';

      const userData: User = {
        id:          profile.id,
        firstName,
        lastName,
        email:       profile.email,
        phone:       profile.phone       || meta.phone      || '',
        matric:      profile.matric      || meta.matric     || '',
        department:  profile.department  || meta.department || '',
        accountType: accountType as AccountType,
        studentId:   profile.student_id  || meta.student_id || '',
      };

      login(userData);

      if (accountType === 'logistics') {
        const { data: vendorData } = await supabase
          .from('vendors').select('*').eq('owner_id', data.user.id).single();
        if (vendorData) {
          vendorLogin({
            id:                 vendorData.id,
            backendId:          vendorData.id,
            name:               vendorData.name,
            registrationNumber: vendorData.registration_number || '',
            contactPerson:      vendorData.contact_person,
            email:              vendorData.email,
            phone:              vendorData.phone    || '',
            address:            vendorData.address  || '',
            verificationStatus: vendorData.verification_status,
          });
        } else {
          setSubmitting(false);
          await supabase.auth.signOut();
          return setError('Your vendor profile is incomplete or missing. Please sign up again or contact support.');
        }
      }

      setSubmitting(false);
      if (accountType === 'admin')      navigate('/admin');
      else if (accountType === 'logistics') navigate('/vendor');
      else                              navigate('/dashboard');
    }
  }

  return (
    <div className={`auth-root mode-${mode === 'signup' ? 'signup' : 'login'}`}>
      <Link to="/" className="auth-back-btn">
        <LucideArrowLeft size={16} /> Back to Home
      </Link>
      <div className="auth-slot auth-slot-left">
        <div className="auth-form-wrap">
          <>
              <Brand />
              <h2 className="auth-heading">Create Account</h2>
              <p className="auth-subheading">Choose your account type to get started</p>
              <div className="auth-tabs">
                <button type="button" className={`auth-tab-btn ${accountType === 'student' ? 'active' : ''}`} onClick={() => setAccountType('student')}>
                  <LucideGraduationCap size={15} /> Student
                </button>
                <button type="button" className={`auth-tab-btn ${accountType === 'logistics' ? 'active' : ''}`} onClick={() => setAccountType('logistics')}>
                  <LucideBuilding2 size={15} /> Logistics Company
                </button>
              </div>
              {accountType === 'student' && (
                <>
                  <button type="button" className="auth-social-btn auth-social-full" onClick={handleGoogleSignIn}>
                    <GoogleSVG /> Continue with Google <span style={{ fontSize:'0.7rem', color:'#10B981', fontWeight:600 }}>(@run.edu.ng)</span>
                  </button>
                  <div className="auth-divider"><span>Or</span></div>
                </>
              )}
              {error && mode === 'signup' && (
                <p style={{ fontSize:'0.78rem', color:'#EF4444', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 12px', marginBottom:'0.75rem' }}>{error}</p>
              )}
              <form className="auth-form" onSubmit={handleSignup}>
                {accountType === 'student' ? (
                  <>
                    <div className="auth-fields-row">
                      <div className="auth-field-group"><label>First Name</label><div className="auth-input-wrap"><LucideUser size={13} className="auth-input-icon" /><input type="text" placeholder="John" value={sig.firstName} onChange={e => us('firstName', e.target.value)} /></div></div>
                      <div className="auth-field-group"><label>Last Name</label><div className="auth-input-wrap"><LucideUser size={13} className="auth-input-icon" /><input type="text" placeholder="Doe" value={sig.lastName} onChange={e => us('lastName', e.target.value)} /></div></div>
                    </div>
                    <div className="auth-fields-row">
                      <div className="auth-field-group"><label>Matric Number</label><div className="auth-input-wrap"><LucideBookOpen size={13} className="auth-input-icon" /><input type="text" placeholder="STU/2024/001" value={sig.matric} onChange={e => us('matric', e.target.value)} /></div></div>
                      <div className="auth-field-group"><label>Phone Number</label><div className="auth-input-wrap"><LucidePhone size={13} className="auth-input-icon" /><input type="tel" placeholder="+234 800" value={sig.phone} onChange={e => us('phone', e.target.value)} /></div></div>
                    </div>
                    <div className="auth-field-group"><label>Institutional Email</label><div className="auth-input-wrap"><LucideMail size={13} className="auth-input-icon" /><input type="email" placeholder="you@run.edu.ng" value={sig.email} onChange={e => us('email', e.target.value)} /></div></div>
                    <div className="auth-field-group"><label>Department</label><div className="auth-input-wrap"><LucideBuilding2 size={13} className="auth-input-icon" /><select value={dept} onChange={e => setDept(e.target.value)}><option value="">Select department</option>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select><LucideChevronDown size={13} className="auth-select-arrow" /></div></div>
                    <div className="auth-fields-row">
                      <div className="auth-field-group"><label>Password</label><div className="auth-input-wrap"><LucideLock size={13} className="auth-input-icon" /><input type={signupShowPass ? 'text' : 'password'} value={sig.password} onChange={e => us('password', e.target.value)} /><button type="button" className="auth-eye" onClick={() => setSignupShowPass(!signupShowPass)}>{signupShowPass ? <LucideEyeOff size={13} /> : <LucideEye size={13} />}</button></div></div>
                      <div className="auth-field-group"><label>Confirm</label><div className="auth-input-wrap"><LucideLock size={13} className="auth-input-icon" /><input type={signupShowConf ? 'text' : 'password'} value={sig.confirm} onChange={e => us('confirm', e.target.value)} /><button type="button" className="auth-eye" onClick={() => setSignupShowConf(!signupShowConf)}>{signupShowConf ? <LucideEyeOff size={13} /> : <LucideEye size={13} />}</button></div></div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="auth-fields-row">
                      <div className="auth-field-group"><label>Company Name</label><div className="auth-input-wrap"><LucideBuilding2 size={13} className="auth-input-icon" /><input type="text" value={sig.companyName} onChange={e => us('companyName', e.target.value)} /></div></div>
                      <div className="auth-field-group"><label>Reg Number</label><div className="auth-input-wrap"><LucideHash size={13} className="auth-input-icon" /><input type="text" value={sig.regNumber} onChange={e => us('regNumber', e.target.value)} /></div></div>
                    </div>
                    <div className="auth-fields-row">
                      <div className="auth-field-group"><label>Company Email</label><div className="auth-input-wrap"><LucideMail size={13} className="auth-input-icon" /><input type="email" value={sig.companyEmail} onChange={e => us('companyEmail', e.target.value)} /></div></div>
                      <div className="auth-field-group"><label>Company Phone</label><div className="auth-input-wrap"><LucidePhone size={13} className="auth-input-icon" /><input type="tel" value={sig.companyPhone} onChange={e => us('companyPhone', e.target.value)} /></div></div>
                    </div>
                    <div className="auth-field-group"><label>Contact Person</label><div className="auth-input-wrap"><LucideUser size={13} className="auth-input-icon" /><input type="text" value={sig.contactName} onChange={e => us('contactName', e.target.value)} /></div></div>
                    <div className="auth-fields-row">
                      <div className="auth-field-group"><label>Password</label><div className="auth-input-wrap"><LucideLock size={13} className="auth-input-icon" /><input type={signupShowPass ? 'text' : 'password'} value={sig.password} onChange={e => us('password', e.target.value)} /><button type="button" className="auth-eye" onClick={() => setSignupShowPass(!signupShowPass)}>{signupShowPass ? <LucideEyeOff size={13} /> : <LucideEye size={13} />}</button></div></div>
                      <div className="auth-field-group"><label>Confirm</label><div className="auth-input-wrap"><LucideLock size={13} className="auth-input-icon" /><input type={signupShowConf ? 'text' : 'password'} value={sig.confirm} onChange={e => us('confirm', e.target.value)} /><button type="button" className="auth-eye" onClick={() => setSignupShowConf(!signupShowConf)}>{signupShowConf ? <LucideEyeOff size={13} /> : <LucideEye size={13} />}</button></div></div>
                    </div>
                  </>
                )}
                <button type="submit" className="auth-btn-submit" disabled={submitting}>
                  {submitting ? 'Processing...' : (accountType === 'student' ? 'Create Account' : 'Submit Registration')}
                </button>
                <p className="auth-switch">Already have an account? <button type="button" className="auth-switch-link" onClick={() => { setMode('login'); setError(''); }}>Sign in</button></p>
              </form>
            </>
        </div>
      </div>

      <div className="auth-slot auth-slot-right">
        <div className="auth-form-wrap">
          <Brand />
          
          {mode === 'forgot' ? (
            <>
              <h2 className="auth-heading">Forgot Password</h2>
              <p className="auth-subheading">Enter your email to receive a reset code</p>
              {error && <p style={{ fontSize:'0.78rem', color:'#EF4444', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 12px', marginBottom:'0.75rem' }}>{error}</p>}
              <form className="auth-form" onSubmit={handleForgotPassword}>
                <div className="auth-field-group"><label>Email Address</label><div className="auth-input-wrap"><LucideMail size={13} className="auth-input-icon" /><input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} /></div></div>
                <button type="submit" className="auth-btn-submit" disabled={submitting}>{submitting ? 'Sending...' : 'Send Reset Code'}</button>
                <p className="auth-switch">Remembered your password? <button type="button" className="auth-switch-link" onClick={() => { setMode('login'); setError(''); }}>Sign in</button></p>
              </form>
            </>
          ) : mode === 'reset' ? (
            <>
              <h2 className="auth-heading">Reset Password</h2>
              <p className="auth-subheading">Enter the code sent to {forgotEmail}</p>
              {error && <p style={{ fontSize:'0.78rem', color:'#EF4444', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 12px', marginBottom:'0.75rem' }}>{error}</p>}
              <form className="auth-form" onSubmit={handleResetPassword}>
                <div className="auth-field-group"><label>Reset Code</label><div className="auth-input-wrap"><LucideLock size={13} className="auth-input-icon" /><input type="text" placeholder="6-digit code" value={resetCode} onChange={e => setResetCode(e.target.value)} /></div></div>
                <div className="auth-fields-row">
                  <div className="auth-field-group"><label>New Password</label><div className="auth-input-wrap"><LucideLock size={13} className="auth-input-icon" /><input type={loginShowPass ? 'text' : 'password'} value={resetNewPass} onChange={e => setResetNewPass(e.target.value)} /><button type="button" className="auth-eye" onClick={() => setLoginShowPass(!loginShowPass)}>{loginShowPass ? <LucideEyeOff size={13} /> : <LucideEye size={13} />}</button></div></div>
                  <div className="auth-field-group"><label>Confirm</label><div className="auth-input-wrap"><LucideLock size={13} className="auth-input-icon" /><input type={loginShowPass ? 'text' : 'password'} value={resetConfPass} onChange={e => setResetConfPass(e.target.value)} /><button type="button" className="auth-eye" onClick={() => setLoginShowPass(!loginShowPass)}>{loginShowPass ? <LucideEyeOff size={13} /> : <LucideEye size={13} />}</button></div></div>
                </div>
                <button type="submit" className="auth-btn-submit" disabled={submitting}>{submitting ? 'Resetting...' : 'Reset Password'}</button>
                <p className="auth-switch">Remembered your password? <button type="button" className="auth-switch-link" onClick={() => { setMode('login'); setError(''); }}>Sign in</button></p>
              </form>
            </>
          ) : (
            <>
              <h2 className="auth-heading">Welcome Back</h2>
              <p className="auth-subheading">Sign in to continue your travel planning</p>
              {error && mode === 'login' && (
                <p style={{ fontSize:'0.78rem', color:'#EF4444', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'8px 12px', marginBottom:'0.75rem' }}>{error}</p>
              )}
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="auth-field-group"><label>Email Address</label><div className="auth-input-wrap"><LucideMail size={13} className="auth-input-icon" /><input type="email" value={log.email} onChange={e => ul('email', e.target.value)} /></div></div>
                <div className="auth-field-group">
                  <div className="auth-row-meta">
                    <label>Password</label>
                    <button type="button" className="auth-switch-link auth-forgot" onClick={() => { setMode('forgot'); setError(''); }}>Forgot password?</button>
                  </div>
                  <div className="auth-input-wrap"><LucideLock size={13} className="auth-input-icon" /><input type={loginShowPass ? 'text' : 'password'} value={log.password} onChange={e => ul('password', e.target.value)} /><button type="button" className="auth-eye" onClick={() => setLoginShowPass(!loginShowPass)}>{loginShowPass ? <LucideEyeOff size={13} /> : <LucideEye size={13} />}</button></div>
                </div>
                <div className="auth-divider"><span>Or continue with</span></div>
                <button type="button" className="auth-social-btn auth-social-full" onClick={handleGoogleSignIn}><GoogleSVG /> Continue with Google</button>
                <button type="submit" className="auth-btn-submit" disabled={submitting}>{submitting ? 'Signing in...' : 'Sign In'}</button>
                <p className="auth-switch">Don't have an account? <button type="button" className="auth-switch-link" onClick={() => { setMode('signup'); setError(''); }}>Get started</button></p>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="auth-info-panel">
        <div className="auth-info-body auth-info-login">
          <h2>Seamless University<br />Transportation</h2>
          <p>Connect RUN students with verified logistics partners for safe, reliable travel.</p>
          <ul className="auth-feat-list">
            <li><span className="auth-feat-dot"><LucideShieldCheck size={13} /></span>Verified Transport Partners</li>
            <li><span className="auth-feat-dot"><LucideClock size={13} /></span>Real-time Trip Tracking</li>
          </ul>
        </div>
        <div className="auth-info-body auth-info-signup">
          <h2>Join UNIRIDE<br />Today</h2>
          <p>The only travel platform made exclusively for Redeemer's University students.</p>
          <ul className="auth-feat-list">
            <li><span className="auth-feat-dot"><LucideBus size={13} /></span>Book verified transport</li>
            <li><span className="auth-feat-dot"><LucideMapPin size={13} /></span>Track your journey live</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
