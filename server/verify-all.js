require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function verifyAll() {
  console.log('Fetching users...');
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  for (const user of data.users) {
    if (!user.email_confirmed_at) {
      console.log(`Verifying email for ${user.email}...`);
      await supabase.auth.admin.updateUserById(user.id, { email_confirm: true });
    }
  }
  console.log('All users verified!');
}

verifyAll();
