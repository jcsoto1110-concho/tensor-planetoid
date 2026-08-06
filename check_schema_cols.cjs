import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envFile = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCols() {
  const { data: resData, error: err1 } = await supabase.from('email_resumes').select('*').limit(1);
  console.log("email_resumes sample keys:", resData ? Object.keys(resData[0]) : err1);
  
  const { data: formCand, error: err2 } = await supabase.from('formative_candidates').select('*, email_resumes(*)').limit(1);
  console.log("formative_candidates sample keys:", formCand ? Object.keys(formCand[0]) : err2);
  if (formCand && formCand[0].email_resumes) {
    console.log("email_resumes inside formative_candidate:", formCand[0].email_resumes);
  }
}

checkCols();
