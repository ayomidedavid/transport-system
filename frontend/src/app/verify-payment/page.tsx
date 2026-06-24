import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LucideCheckCircle, LucideXCircle, LucideLoader2, LucideBus } from 'lucide-react';

export default function VerifyPaymentPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  const reference = searchParams.get('reference');

  useEffect(() => {
    async function verify() {
      if (!reference) {
        setStatus('error');
        setMessage('No payment reference found.');
        return;
      }

      try {
        const API_URL = import.meta.env.VITE_API_URL || '';
        const res = await fetch(`${API_URL}/api/payments/verify/${reference}`);
        const data = await res.json();

        if (res.ok) {
          setStatus('success');
          setMessage('Payment successful! Your booking has been confirmed.');
          setTimeout(() => {
            navigate('/dashboard/browse');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(data.message || 'Payment verification failed.');
        }
      } catch (err) {
        setStatus('error');
        setMessage('Failed to connect to the server.');
      }
    }

    verify();
  }, [reference, navigate]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: '#050505',
      color: '#fff',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ 
        background: '#111', 
        padding: '3rem', 
        borderRadius: '24px', 
        textAlign: 'center', 
        maxWidth: '400px',
        width: '90%',
        border: '1px solid #222',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>
        <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
          <div style={{ 
            width: '60px', 
            height: '60px', 
            borderRadius: '18px', 
            background: '#ffffff', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <LucideBus size={30} color="#000" />
          </div>
        </div>

        {status === 'verifying' && (
          <>
            <LucideLoader2 size={48} className="animate-spin" style={{ color: '#ffffff', margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Verifying Payment</h2>
            <p style={{ color: '#888', lineHeight: 1.5 }}>Please wait while we confirm your transaction with Paystack.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <LucideCheckCircle size={48} style={{ color: '#ffffff', margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Payment Successful!</h2>
            <p style={{ color: '#888', lineHeight: 1.5 }}>{message}</p>
            <p style={{ color: '#ffffff', fontSize: '0.85rem', marginTop: '1.5rem', fontWeight: 600 }}>Redirecting to your bookings...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <LucideXCircle size={48} style={{ color: '#EF4444', margin: '0 auto 1.5rem' }} />
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Payment Failed</h2>
            <p style={{ color: '#888', lineHeight: 1.5 }}>{message}</p>
            <button 
              onClick={() => navigate('/dashboard/browse')}
              style={{ 
                marginTop: '2rem', 
                background: '#ffffff', 
                color: '#000', 
                border: 'none', 
                padding: '0.75rem 2rem', 
                borderRadius: '12px', 
                fontWeight: 700, 
                cursor: 'pointer' 
              }}
            >
              Try Again
            </button>
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
}
