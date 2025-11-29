
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertEmployee() {
  const cedula = '1712217502';
  
  console.log(`Intentando insertar empleado: ${cedula}...`);

  // Check if already exists just in case
  const { data: existing } = await supabase
    .from('employees')
    .select('*')
    .eq('id', cedula)
    .single();

  if (existing) {
    console.log('El empleado ya existe:', existing);
    return;
  }

  const { data, error } = await supabase
    .from('employees')
    .insert([
      {
        id: cedula,
        name: 'Usuario', // Valores por defecto para pruebas
        apellido: 'Prueba',
        email: 'usuario.prueba@example.com',
        department: 'Sistemas',
        position: 'Tester',
        status: 'ACTIVE'
      }
    ])
    .select();

  if (error) {
    console.error('Error al insertar:', error);
  } else {
    console.log('✅ Empleado insertado correctamente:', data);
  }
}

insertEmployee();
