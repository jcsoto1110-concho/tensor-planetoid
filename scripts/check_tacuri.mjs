import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
let env = {};

if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [k, ...v] = trimmed.split('=');
            env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://zfbrwcflzbauycszajpc.supabase.co';
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.from('digi_employees').select('*').ilike('name', '%TACURI%');
    console.log('Resultados Tacuri:', data);
    
    const { count: activeCount } = await supabase.from('digi_employees').select('*', { count: 'exact', head: true }).eq('estado', '1');
    const { count: inactiveCount } = await supabase.from('digi_employees').select('*', { count: 'exact', head: true }).eq('estado', '0');
    console.log(`Activos: ${activeCount} | Inactivos: ${inactiveCount}`);
}

run();
