-- Crear tabla de consentimientos si no existe
CREATE TABLE IF NOT EXISTS consents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_cedula TEXT NOT NULL,
    country TEXT NOT NULL,
    consent_date TIMESTAMP WITH TIME ZONE NOT NULL,
    consent_text TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    accepted BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE consents ENABLE ROW LEVEL SECURITY;

-- Política para permitir INSERT a cualquier usuario autenticado
CREATE POLICY "Allow insert for authenticated users" ON consents
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Política para permitir SELECT a cualquier usuario autenticado
CREATE POLICY "Allow select for authenticated users" ON consents
    FOR SELECT
    TO authenticated
    USING (true);

-- Política para permitir INSERT a usuarios anónimos (para el portal de empleados)
CREATE POLICY "Allow insert for anon users" ON consents
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Política para permitir SELECT a usuarios anónimos
CREATE POLICY "Allow select for anon users" ON consents
    FOR SELECT
    TO anon
    USING (true);

-- Crear índice para búsquedas rápidas por cédula
CREATE INDEX IF NOT EXISTS idx_consents_employee_cedula ON consents(employee_cedula);
