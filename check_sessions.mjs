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
    .from('formative_candidates')
    .select('session_title');
    
  if (error) {
    console.error(error);
  } else {
    const sessions = {};
    data.forEach(d => {
      sessions[d.session_title] = (sessions[d.session_title] || 0) + 1;
    });
    console.log("Current sessions in formative_candidates:");
    console.log(JSON.stringify(sessions, null, 2));
  }
}

main();
