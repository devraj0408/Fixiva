import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read .env manually
const envPath = '.env';
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: profiles, error } = await supabase.from('profiles').select('*').limit(1);
  if (profiles && profiles.length > 0) {
    console.log('Columns in profiles:', Object.keys(profiles[0]));
  } else {
    console.log('No profiles found or error:', error);
  }
}

check();
