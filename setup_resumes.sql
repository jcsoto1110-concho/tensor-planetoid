-- ==========================================
-- SCRIPT: Setup para Hojas de Vida (Resumes)
-- ==========================================

-- 1. Crear tabla para almacenar los correos y hojas de vida extraídas
CREATE TABLE IF NOT EXISTS email_resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email_uid VARCHAR(255) UNIQUE NOT NULL, -- UID del correo para no duplicar
    sender_email VARCHAR(255) NOT NULL,
    sender_name VARCHAR(255),
    subject TEXT,
    received_date TIMESTAMPTZ,
    
    -- Información del archivo
    file_name TEXT,
    pdf_url TEXT, -- URL pública del bucket en Supabase
    
    -- Estado de la clasificación
    classification_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, REVIEWED, REJECTED, HIRED
    ai_summary TEXT, -- Por si luego quieres que una IA lo lea y resuma
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar RLS
ALTER TABLE email_resumes ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para tabla email_resumes
CREATE POLICY "Permitir insercion total" ON email_resumes
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Permitir lectura general" ON email_resumes
    FOR SELECT
    USING (true);

CREATE POLICY "Permitir actualizacion general" ON email_resumes
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Permitir borrado general" ON email_resumes
    FOR DELETE
    USING (true);
