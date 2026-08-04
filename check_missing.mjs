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
  const { data: currentFormativas } = await supabase.from('formative_candidates').select('resume_id');
  const existingResumeIds = currentFormativas.map(c => c.resume_id);

  const { data: candidates, error } = await supabase
    .from('candidate_tracking')
    .select('*')
    .in('status', ['PENDIENTE', 'MENSAJE_ENVIADO', 'ENTREVISTA_PROGRAMADA', 'FORMATIVA_EN_CURSO'])
    .order('updated_at', { ascending: false });

  const { data: resumes } = await supabase.from('email_resumes').select('id, sender_name, position, cedula');

  if (error) {
    console.error(error);
  } else {
    // Buscar candidates que NO esten en formativas_candidates pero que su interview_date empiece con 2026-08-04
    const missing = candidates.filter(c => 
      !existingResumeIds.includes(c.resume_id) && 
      c.interview_date && c.interview_date.startsWith('2026-08-04')
    );
    
    console.log(`Found ${missing.length} candidates with interview_date 2026-08-04 but not in formativas:`);
    missing.forEach(m => {
      const resume = resumes.find(r => r.id === m.resume_id);
      console.log(`${resume?.sender_name} - ${m.status} - ${m.interview_date} - ${m.resume_id}`);
    });
    
    // Si queremos reinsertarlos automáticamente, podemos hacerlo así:
    /*
    for (const m of missing) {
      await supabase.from('formative_candidates').insert({
        resume_id: m.resume_id,
        session_title: 'Formativas 20260804_936',
        created_by_user: 'SYSTEM',
        confirmed: true // ya que el usuario dijo que los habia marcado confirmados
      });
    }
    */
  }
}

main();
