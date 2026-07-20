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
  const tables = ['profiles', 'workers', 'contractors', 'services', 'cities', 'city_services', 'bookings', 'reviews', 'support_tickets', 'pricing_rules', 'trust_scores', 'partner_applications', 'coverage_requests', 'states'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`Table '${table}': ERROR - ${error.message} (code: ${error.code})`);
    } else {
      console.log(`Table '${table}': SUCCESS (${data.length} records found)`);
    }
  }
}

check();
