require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function setupAdmin() {
  const email = 'unitransit3@gmail.com';
  const password = 'admin123456';

  console.log(`Setting up admin user: ${email}`);

  // 1. Create or get user
  let { data: { user }, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true // bypass email confirmation
  });

  if (error) {
    if (error.message.includes('already exists') || error.message.includes('registered')) {
      console.log('User already exists, fetching user...');
      // List users and find this one
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.error('Error fetching users:', listError);
        return;
      }
      user = usersData.users.find(u => u.email === email);
      
      // Update password just in case
      if (user) {
         console.log('Updating password for existing user...');
         await supabase.auth.admin.updateUserById(user.id, { password });
      }
    } else {
      console.error('Error creating user:', error);
      return;
    }
  }

  if (!user) {
    console.error('Could not determine user ID.');
    return;
  }

  console.log(`User ID: ${user.id}`);

  // 2. Set role to 'admin' in profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      first_name: 'Super',
      last_name: 'Admin',
      email: email,
      role: 'admin'
    });

  if (profileError) {
    console.error('Error updating profile role:', profileError);
    return;
  }

  console.log('Admin account successfully created and authorized!');
}

setupAdmin();
