import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

console.log('URL:', supabaseUrl);
console.log('Anon Key:', supabaseAnonKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: tables, error: schemaError } = await supabase
    .from('states')
    .select('*')
    .limit(5);

  if (schemaError) {
    console.error('Error fetching from states:', schemaError);
  } else {
    console.log('Successfully fetched from states:', tables);
  }

  const { data: cities, error: citiesError } = await supabase
    .from('cities')
    .select('*')
    .limit(5);

  if (citiesError) {
    console.error('Error fetching from cities:', citiesError);
  } else {
    console.log('Successfully fetched from cities:', cities);
  }
}

check();
