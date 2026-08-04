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
    .gte('updated_at', '2026-08-04T00:00:00.000Z')
    .order('updated_at', { ascending: false });
    
  if (error) {
    console.error(error);
  } else {
    console.log(`Found ${data.length} candidates closed today (2026-08-04):`);
    console.log(JSON.stringify(data, null, 2));
  }
}

main();
