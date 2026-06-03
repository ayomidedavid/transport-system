import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideBus } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    // Supabase automatically processes the URL hash/query params
    // and fires onAuthStateChange. We just wait for it here.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const email     = session.user.email ?? '';
        const provider  = session.user.app_metadata?.provider;

        // Google OAuth users must have a @run.edu.ng email
        if (provider === 'google' && !email.toLowerCase().endsWith('@run.edu.ng')) {
          await supabase.auth.signOut();
          setError(`Only @run.edu.ng institutional emails can sign in with Google. You used ${email}.`);
          return;
        }

        // Fetch profile to determine where to redirect
        const { data: profile } = await supabase
          .from('profiles').select('role').eq('id', session.user.id).single();

        const role = profile?.role ?? 'student';
        if (role === 'admin')  navigate('/admin',     { replace: true });
        else if (role === 'vendor') navigate('/vendor',     { replace: true });
        else                        navigate('/dashboard', { replace: true });
      }

      if (event === 'SIGNED_OUT') {
        navigate('/login', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh', background: '#06080F',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '1.5rem', padding: '2rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <LucideBus size={22} color="#10B981" />
        <span style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff', letterSpacing: '-0.02em' }}>
          UNIRIDE
        </span>
      </div>

      {error ? (
        <>
          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 12, padding: '1rem 1.5rem', maxWidth: 420, textAlign: 'center',
          }}>
            <p style={{ color: '#EF4444', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>{error}</p>
          </div>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: '#10B981', color: '#000', border: 'none', borderRadius: 100,
              padding: '10px 28px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
            }}
          >
            Back to Sign In
          </button>
        </>
      ) : (
        <p style={{ color: '#94A3B8', fontSize: '0.9rem', margin: 0 }}>
          Completing sign in…
        </p>
      )}
    </div>
  );
}
