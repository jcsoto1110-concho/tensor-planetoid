import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase
    .from('candidate_tracking')
    .select('*')
    .eq('status', 'FORMATIVA_CERRADA')
    .order('updated_at', { ascending: false })
    .limit(50);
    
  if (error) {
    console.error(error);
  } else {
    console.log(`Found ${data.length} recently closed candidates:`);
    data.forEach(d => {
      console.log(`${d.updated_at} - Cargo: ${d.cargo} - Resume ID: ${d.resume_id} - Company: ${d.company_slug}`);
    });
  }
}

main();
