import { useState } from 'react';
import {
  LucideMail, LucideLock, LucideEye, LucideEyeOff,
  LucideUser, LucidePhone, LucideBuilding2, LucideHash,
  LucideMapPin, LucideBus, LucideGraduationCap, LucideChevronDown,
  LucideBookOpen, LucideTrendingUp, LucideShieldCheck,
  LucideCreditCard, LucideClock, LucideArrowLeft,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser, type AccountType, type User } from '../_context/UserContext';
import { useVendor, type Company } from '../_context/VendorContext';
import { api } from '../../lib/api';
import '../auth.css';

type Mode = 'login' | 'signup' | 'forgot' | 'reset';

const DEPARTMENTS = [
  'Engineering', 'Computer Science', 'Medicine & Surgery', 'Law',
  'Business Administration', 'Social Sciences', 'Arts & Humanities',
  'Education', 'Agriculture', 'Pharmacy', 'Architecture',
];

function Brand() {
  return (
    <Link to="/" className="auth-brand">
      <div className="auth-brand-icon"><LucideBus size={17} /></div>
      <div>
        <p className="auth-brand-name">UNITRANSIT</p>
        <p className="auth-brand-sub">University Transport Management</p>
      </div>
    </Link>
  );
}

function genStudentId() {
  return 'UNI/' + Math.floor(10000 + Math.random() * 90000);
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
      if (!sig.email.toLowerCase().endsWith('.edu.ng'))
        return setError('Only .edu.ng institutional emails are allowed.');
      if (!sig.matric.trim())           return setError('Matric number is required.');
      if (!sig.phone.trim())            return setError('Phone number is required.');
      if (!dept)                        return setError('Please select your department.');
      if (sig.password.trim().length < 8) return setError('Password must be at least 8 characters.');
      if (sig.password.trim() !== sig.confirm.trim()) return setError('Passwords do not match.');

      setSubmitting(true);
      try {
        const { data } = await api.post('/auth/signup', {
          email:      signupEmail,
          password:   sig.password.trim(),
          firstName:  sig.firstName.trim(),
          lastName:   sig.lastName.trim(),
          phone:      sig.phone.trim(),
          matric:     sig.matric.trim(),
          department: dept,
          studentId:  genStudentId(),
        });
        
        if (data.ok) {
          login(data.user, data.token);
          navigate('/dashboard');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'Could not reach the server. Please try again.');
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
        const { data } = await api.post('/auth/vendor-signup', {
          email: signupEmail,
          password: sig.password.trim(),
          contactName: sig.contactName.trim(),
          companyName: sig.companyName.trim(),
          regNumber: sig.regNumber?.trim(),
          phone: sig.companyPhone?.trim(),
          address: sig.address?.trim()
        });
        
        if (data.ok) {
          login(data.user, data.token);
          if (data.vendor) {
            vendorLogin({
              id:                 data.vendor.id,
              backendId:          data.vendor.id,
              name:               data.vendor.name,
              registrationNumber: data.vendor.registrationNumber || '',
              contactPerson:      data.vendor.contactPerson,
              email:              data.vendor.email,
              phone:              data.vendor.phone || '',
              address:            data.vendor.address || '',
              verificationStatus: data.vendor.verificationStatus,
            });
          }
          navigate('/vendor');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || 'An unexpected error occurred.');
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
      await api.post('/auth/send-otp', { email: forgotEmail.trim() });
      setMode('reset');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error requesting reset.');
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
      await api.post('/auth/reset-password', { email: forgotEmail.trim(), code: resetCode.trim(), newPassword: resetNewPass });
      setMode('login');
      setError('');
      alert('Password reset successfully. You can now log in.');
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Error resetting password.');
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

    try {
      const { data } = await api.post('/auth/login', {
        email: log.email.trim().toLowerCase(),
        password: log.password.trim(),
      });

      if (data.ok) {
        login(data.user, data.token);

        if (data.user.accountType === 'logistics') {
          try {
            const { data: vendorData } = await api.get(`/vendors/owner/${data.user.id}`);
            if (vendorData) {
              vendorLogin({
                id:                 vendorData.id,
                backendId:          vendorData.id,
                name:               vendorData.name,
                registrationNumber: vendorData.registrationNumber || '',
                contactPerson:      vendorData.contactPerson,
                email:              vendorData.email,
                phone:              vendorData.phone    || '',
                address:            vendorData.address  || '',
                verificationStatus: vendorData.verificationStatus,
              });
            }
          } catch (e) {
             setError('Your vendor profile is incomplete or missing. Please contact support.');
             return;
          }
        }

        if (data.user.accountType === 'admin') navigate('/admin');
        else if (data.user.accountType === 'logistics') navigate('/vendor');
        else navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed.');
    } finally {
      setSubmitting(false);
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
                    <div className="auth-field-group"><label>Institutional Email</label><div className="auth-input-wrap"><LucideMail size={13} className="auth-input-icon" /><input type="email" placeholder="you@student.edu.ng" value={sig.email} onChange={e => us('email', e.target.value)} /></div></div>
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
          <p>Connect tertiary institution students with verified logistics partners for safe, reliable travel.</p>
          <ul className="auth-feat-list">
            <li><span className="auth-feat-dot"><LucideShieldCheck size={13} /></span>Verified Transport Partners</li>
            <li><span className="auth-feat-dot"><LucideClock size={13} /></span>Real-time Trip Tracking</li>
          </ul>
        </div>
        <div className="auth-info-body auth-info-signup">
          <h2>Join UNITRANSIT<br />Today</h2>
          <p>The only travel platform made exclusively for tertiary institution students.</p>
          <ul className="auth-feat-list">
            <li><span className="auth-feat-dot"><LucideBus size={13} /></span>Book verified transport</li>
            <li><span className="auth-feat-dot"><LucideMapPin size={13} /></span>Track your journey live</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
