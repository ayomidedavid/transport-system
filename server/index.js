const express    = require('express');
const cors       = require('cors');
const dotenv     = require('dotenv');
const path       = require('path');
const axios      = require('axios');
const { createClient } = require('@supabase/supabase-js');
const paystack   = require('./services/paystack');

dotenv.config({ path: path.join(__dirname, '.env') });

/* ── Supabase admin client (service role — bypasses RLS) ── */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/* ── Express setup ── */
const app  = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) =>
    (!origin || allowedOrigins.includes(origin))
      ? cb(null, true)
      : cb(new Error(`CORS blocked: ${origin}`)),
  credentials: true,
}));
app.use(express.json());

/* ════════════════════════════════════════════════
   HEALTH
   ════════════════════════════════════════════════ */
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

/* ════════════════════════════════════════════════
   STUDENT SIGNUP — create user + send OTP
   ════════════════════════════════════════════════ */

app.post('/api/auth/signup', async (req, res) => {
  const { email, password, firstName, lastName, phone, matric, department, studentId } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const normalEmail = email.toLowerCase().trim();

  try {
    /* Create user via admin API — no confirmation email sent */
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email:         normalEmail,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName || '',
        last_name:  lastName  || '',
        phone:      phone     || '',
        matric:     matric    || '',
        department: department || '',
        role:       'student',
        student_id: studentId || '',
      },
    });

    if (authError) {
      const msg = authError.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }
      throw new Error(msg);
    }

    /* Send OTP */
    const code      = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: dbErr } = await supabase
      .from('otps')
      .insert([{ email: normalEmail, code, expires_at: expiresAt }]);
    if (dbErr) throw new Error(dbErr.message);

    await sendEmail({
      to:          email,
      subject:     'Your UniRide Verification Code',
      htmlContent: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; padding: 40px 20px; color: #0F172A;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #E2E8F0;">
            <div style="background-color: #10B981; padding: 28px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px;">UNIRIDE</h1>
            </div>
            <div style="padding: 40px 32px; text-align: center;">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #0F172A; font-weight: 700;">Verify your account</h2>
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #64748B; line-height: 1.6;">
                Use the secure verification code below to complete your registration. This code is valid for <strong>10 minutes</strong>.
              </p>
              <div style="background-color: #F1F5F9; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #E2E8F0;">
                <div style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #10B981; text-align: center; margin-left: 12px;">${code}</div>
              </div>
              <p style="margin: 0; font-size: 13px; color: #94A3B8;">If you did not request this code, you can safely ignore this email.</p>
            </div>
            <div style="background-color: #F8FAFC; padding: 24px; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">&copy; ${new Date().getFullYear()} UniRide Transport Management. All rights reserved.</p>
            </div>
          </div>
        </div>`,
    });

    /* Admin notification */
    supabase.from('notifications').insert([{
      type:           'user',
      title:          'New Student Registered',
      body:           `${firstName} ${lastName} (${normalEmail}) signed up.`,
      recipient_role: 'admin',
    }]).then(() => {});

    res.json({ ok: true, userId: authData.user.id });
  } catch (err) {
    console.error('[auth/signup]', err.message);
    if (err.message.includes('fetch failed') || err.message.includes('ENOTFOUND')) {
      return res.status(500).json({ error: 'Supabase connection failed: Your Supabase project appears to be paused or deleted. Please unpause your project.' });
    }
    res.status(500).json({ error: err.message || 'Signup failed' });
  }
});

/* ════════════════════════════════════════════════
   OTP — student email verification
   ════════════════════════════════════════════════ */

app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  try {
    const code      = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: dbErr } = await supabase
      .from('otps')
      .insert([{ email: email.toLowerCase().trim(), code, expires_at: expiresAt }]);

    if (dbErr) throw new Error(dbErr.message);

    await sendEmail({
      to:          email,
      subject:     'Your UniRide Verification Code',
      htmlContent: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; padding: 40px 20px; color: #0F172A;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #E2E8F0;">
            <div style="background-color: #10B981; padding: 28px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px;">UNIRIDE</h1>
            </div>
            <div style="padding: 40px 32px; text-align: center;">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #0F172A; font-weight: 700;">Verify your account</h2>
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #64748B; line-height: 1.6;">
                Use the secure verification code below to complete your registration. This code is valid for <strong>10 minutes</strong>.
              </p>
              <div style="background-color: #F1F5F9; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #E2E8F0;">
                <div style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #10B981; text-align: center; margin-left: 12px;">${code}</div>
              </div>
              <p style="margin: 0; font-size: 13px; color: #94A3B8;">If you did not request this code, you can safely ignore this email.</p>
            </div>
            <div style="background-color: #F8FAFC; padding: 24px; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">&copy; ${new Date().getFullYear()} UniRide Transport Management. All rights reserved.</p>
            </div>
          </div>
        </div>`,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[send-otp]', err.message);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });

  const normalEmail = email.toLowerCase().trim();

  try {
    /* 1. Check OTP */
    const { data: otp, error: otpErr } = await supabase
      .from('otps')
      .select('id')
      .eq('email', normalEmail)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpErr || !otp) return res.status(400).json({ error: 'Invalid or expired code' });

    /* 2. Find user via profiles table */
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalEmail)
      .single();

    if (!profile) return res.status(404).json({ error: 'User not found' });

    /* 3. Confirm email in Supabase Auth */
    const { error: confirmErr } = await supabase.auth.admin.updateUserById(
      profile.id,
      { email_confirm: true }
    );
    if (confirmErr) throw new Error(confirmErr.message);

    /* 4. Delete used OTP */
    await supabase.from('otps').delete().eq('email', normalEmail);

    res.json({ ok: true });
  } catch (err) {
    console.error('[verify-otp]', err.message);
    res.status(500).json({ error: 'Verification failed' });
  }
});

/* ════════════════════════════════════════════════
   FORGOT PASSWORD
   ════════════════════════════════════════════════ */

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const normalEmail = email.toLowerCase().trim();

  try {
    /* Verify user exists */
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalEmail)
      .single();

    if (!profile) {
      // Return ok anyway to prevent email enumeration
      return res.json({ ok: true });
    }

    /* Send OTP */
    const code      = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: dbErr } = await supabase
      .from('otps')
      .insert([{ email: normalEmail, code, expires_at: expiresAt }]);
    
    if (dbErr) throw new Error(dbErr.message);

    await sendEmail({
      to:          normalEmail,
      subject:     'Reset your UniRide Password',
      htmlContent: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; padding: 40px 20px; color: #0F172A;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #E2E8F0;">
            <div style="background-color: #10B981; padding: 28px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px;">UNIRIDE</h1>
            </div>
            <div style="padding: 40px 32px; text-align: center;">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #0F172A; font-weight: 700;">Password Reset Request</h2>
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #64748B; line-height: 1.6;">
                We received a request to reset your UniRide password. Enter this secure code to continue:
              </p>
              <div style="background-color: #F1F5F9; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #E2E8F0;">
                <div style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #10B981; text-align: center; margin-left: 12px;">${code}</div>
              </div>
              <p style="margin: 0; font-size: 13px; color: #94A3B8;">This code expires in 10 minutes. If you did not request this, your account is safe and you can ignore this email.</p>
            </div>
            <div style="background-color: #F8FAFC; padding: 24px; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">&copy; ${new Date().getFullYear()} UniRide Transport Management. All rights reserved.</p>
            </div>
          </div>
        </div>`,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('[forgot-password]', err.message);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;
  if (!email || !code || !newPassword) return res.status(400).json({ error: 'Email, code, and new password are required' });

  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

  const normalEmail = email.toLowerCase().trim();

  try {
    /* 1. Check OTP */
    const { data: otp, error: otpErr } = await supabase
      .from('otps')
      .select('id')
      .eq('email', normalEmail)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpErr || !otp) return res.status(400).json({ error: 'Invalid or expired code' });

    /* 2. Find user */
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalEmail)
      .single();

    if (!profile) return res.status(404).json({ error: 'User not found' });

    /* 3. Update password in Auth */
    const { error: updateErr } = await supabase.auth.admin.updateUserById(
      profile.id,
      { password: newPassword, email_confirm: true }
    );
    if (updateErr) throw new Error(updateErr.message);

    /* 4. Delete used OTP */
    await supabase.from('otps').delete().eq('email', normalEmail);

    res.json({ ok: true });
  } catch (err) {
    console.error('[reset-password]', err.message);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

/* ════════════════════════════════════════════════
   VENDOR SIGNUP (Bypasses Supabase Email Rate Limits)
   ════════════════════════════════════════════════ */
app.post('/api/auth/vendor-signup', async (req, res) => {
  const { email, password, contactName, companyName, regNumber, phone, address } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
  const normalEmail = email.toLowerCase().trim();
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: normalEmail,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: contactName || '',
        last_name: companyName || '',
        role: 'vendor'
      }
    });
    if (error) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already been registered')) {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }
      throw new Error(msg);
    }

    const ownerUserId = data.user?.id;

    /* Create pending vendor row */
    const { error: vErr } = await supabase.from('vendors').upsert([{
      owner_id:            ownerUserId || null,
      name:                companyName,
      registration_number: regNumber   || null,
      contact_person:      contactName,
      email:               normalEmail,
      phone:               phone       || null,
      address:             address     || null,
      verification_status: 'pending',
    }], { onConflict: 'email' });

    if (vErr) throw new Error(vErr.message);

    /* Notify admin */
    await supabase.from('notifications').insert([{
      type:           'vendor',
      title:          'New Vendor Registration',
      body:           `${companyName} (${normalEmail}) has registered and is awaiting approval.`,
      recipient_role: 'admin'
    }]);

    /* Send OTP */
    const code      = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: dbErr } = await supabase
      .from('otps')
      .insert([{ email: normalEmail, code, expires_at: expiresAt }]);
    if (dbErr) throw new Error(dbErr.message);

    await sendEmail({
      to:          normalEmail,
      subject:     'Your UniRide Vendor Verification Code',
      htmlContent: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F8FAFC; padding: 40px 20px; color: #0F172A;">
          <div style="max-width: 500px; margin: 0 auto; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #E2E8F0;">
            <div style="background-color: #10B981; padding: 28px; text-align: center;">
              <h1 style="color: #FFFFFF; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px;">UNIRIDE VENDOR</h1>
            </div>
            <div style="padding: 40px 32px; text-align: center;">
              <h2 style="margin: 0 0 16px 0; font-size: 22px; color: #0F172A; font-weight: 700;">Verify your account</h2>
              <p style="margin: 0 0 32px 0; font-size: 15px; color: #64748B; line-height: 1.6;">
                Welcome, ${companyName}! Use the secure verification code below to complete your registration. This code is valid for <strong>10 minutes</strong>.
              </p>
              <div style="background-color: #F1F5F9; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #E2E8F0;">
                <div style="font-size: 40px; font-weight: 900; letter-spacing: 12px; color: #10B981; text-align: center; margin-left: 12px;">${code}</div>
              </div>
              <p style="margin: 0; font-size: 13px; color: #94A3B8;">Our admin team has already been notified and will review your application shortly.</p>
            </div>
            <div style="background-color: #F8FAFC; padding: 24px; border-top: 1px solid #E2E8F0; text-align: center;">
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">&copy; ${new Date().getFullYear()} UniRide Transport Management. All rights reserved.</p>
            </div>
          </div>
        </div>`,
    });

    res.json({ user: data.user, status: 'OTP_SENT' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════════════
   VENDORS
   ════════════════════════════════════════════════ */

app.post('/api/vendors/register', async (req, res) => {
  const { ownerUserId, companyName, email, contactPerson, regNumber, phone, address } = req.body;

  if (!companyName || !email || !contactPerson)
    return res.status(400).json({ error: 'companyName, email and contactPerson are required' });

  const normalEmail = email.toLowerCase().trim();

  try {
    const { data: vendor, error: vErr } = await supabase
      .from('vendors')
      .upsert([{
        owner_id:            ownerUserId   || null,
        name:                companyName,
        registration_number: regNumber     || null,
        contact_person:      contactPerson,
        email:               normalEmail,
        phone:               phone         || null,
        address:             address       || null,
        verification_status: 'pending',
      }], { onConflict: 'email' })
      .select()
      .single();

    if (vErr) throw new Error(vErr.message);

    /* Notify admin */
    await supabase.from('notifications').insert([{
      type:           'vendor',
      title:          'New Vendor Registration',
      body:           `${companyName} (${normalEmail}) registered and is awaiting verification.`,
      recipient_role: 'admin',
      recipient_id:   null,
    }]);

    /* Auto-verify the vendor email so they don't get stuck */
    if (ownerUserId) {
      await supabase.auth.admin.updateUserById(ownerUserId, { email_confirm: true });
    }

    res.status(201).json({ vendor });
  } catch (err) {
    console.error('[vendors/register]', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ════════════════════════════════════════════════
   PAYMENTS — Paystack (via services/paystack.js)
   ════════════════════════════════════════════════ */

app.post('/api/payments/initialize', async (req, res) => {
  const { email, amount, bookingId, agencyName, route } = req.body;
  if (!email || !amount) return res.status(400).json({ error: 'email and amount are required' });

  try {
    const frontendUrl = process.env.FRONTEND_URL || req.get('origin') || 'http://localhost:5173';
    const callbackUrl = `${frontendUrl.replace(/\/$/, '')}/verify-payment`;

    const data = await paystack.initializeTransaction({
      email,
      amount,
      callbackUrl,
      metadata: { bookingId, agencyName, route },
    });

    res.json(data);
  } catch (err) {
    console.error('[payments/initialize]', err.response?.data || err.message);
    res.status(500).json({ error: 'Could not initialize payment' });
  }
});

app.get('/api/payments/verify/:reference', async (req, res) => {
  try {
    const data = await paystack.verifyTransaction(req.params.reference);

    if (data.status && data.data.status === 'success') {
      const bookingId = data.data.metadata?.bookingId;
      if (bookingId) {
        await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId);
      }
      res.json({ ok: true, booking: data.data.metadata });
    } else {
      res.status(400).json({ ok: false, message: 'Payment not successful' });
    }
  } catch (err) {
    console.error('[payments/verify]', err.response?.data || err.message);
    res.status(500).json({ error: 'Could not verify payment' });
  }
});

app.post('/api/payments/webhook', async (req, res) => {
  if (req.body?.event === 'charge.success') {
    const bookingId = req.body.data?.metadata?.bookingId;
    if (bookingId) {
      await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId);
    }
  }
  res.sendStatus(200);
});

/* ════════════════════════════════════════════════
   EMAIL helper (Brevo)
   ════════════════════════════════════════════════ */

async function sendEmail({ to, subject, htmlContent }) {
  const key = process.env.BREVO_API_KEY;
  if (!key || key === 'YOUR_BREVO_API_KEY_HERE') {
    console.log(`[email-sim] TO: ${to} | SUBJECT: ${subject}`);
    return;
  }
  await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender:      { name: 'UniRide', email: process.env.BREVO_SENDER_EMAIL },
      to:          [{ email: to }],
      subject,
      htmlContent,
    },
    { headers: { 'api-key': key } }
  );
}

/* ════════════════════════════════════════════════
   START
   ════════════════════════════════════════════════ */

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\nUniTransit backend  →  http://localhost:${PORT}`);
    console.log(`Supabase  : ${process.env.SUPABASE_URL}`);
    console.log(`Paystack  : ${paystack.isConfigured() ? 'key present' : 'KEY MISSING'}`);
    console.log(`Brevo     : ${process.env.BREVO_API_KEY ? 'key present' : 'simulated'}\n`);
  });
}

module.exports = app;
