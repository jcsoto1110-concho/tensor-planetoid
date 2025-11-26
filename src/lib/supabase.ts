import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️ Supabase credentials missing! Check .env.local');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseKey || 'placeholder-key'
);

// Tipos de TypeScript
export type Employee = {
    id: string;
    codigo_sap?: string;
    name: string;
    apellido: string;
    position: string;
    entry_date: string;
    region?: string;
    ciudad?: string;
    departamento?: string;
    responsable?: string;
    pais?: string;
    created_at: string;
    updated_at: string;
};

export type Document = {
    id: string;
    employee_id: string;
    file_name: string;
    file_type: 'pdf' | 'image';
    file_url: string;
    file_path: string;
    file_size_bytes?: number;
    is_encrypted: boolean;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    uploaded_by: string;
    upload_date: string;
    approved_by?: string;
    approved_date?: string;
    rejected_by?: string;
    rejection_reason?: string;
    comments?: string;
};

export type AuditLog = {
    id: string;
    action: string;
    entity_type: string;
    description: string;
    user_name: string;
    entity_id?: string;
    timestamp: string;
};
