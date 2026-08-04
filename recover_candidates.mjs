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
  console.log("Fetching candidates with status SYNCED...");
  const { data, error } = await supabase
    .from('onboarding_candidates')
    .select('id, nombres, apellidos, status')
    .eq('status', 'SYNCED');

  if (error) {
    console.error("Error fetching:", error);
    return;
  }

  console.log(`Found ${data.length} candidates. Updating them to APPROVED...`);

  for (const c of data) {
    console.log(`Updating ${c.nombres} ${c.apellidos}...`);
    const { error: updateError } = await supabase
      .from('onboarding_candidates')
      .update({ status: 'APPROVED' })
      .eq('id', c.id);
    
    if (updateError) {
      console.error(`Error updating ${c.id}:`, updateError);
    }
  }
  
  console.log("Done!");
}

main();
