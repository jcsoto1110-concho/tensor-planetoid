-- ==========================================
-- SCRIPT: Setup para Portal de Onboarding
-- ==========================================

-- 1. Crear tabla para candidatos
CREATE TABLE IF NOT EXISTS onboarding_candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cedula TEXT UNIQUE NOT NULL,
    nombres TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT NOT NULL,
    
    -- Campos JSON para estructuras dinámicas
    datos_personales JSONB,
    datos_bancarios JSONB,
    cargas_familiares JSONB,
    estudios JSONB,
    
    -- Metadata y documentos
    documento_pdf_url TEXT,
    status TEXT DEFAULT 'PENDING', -- PENDING, SYNCED
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE onboarding_candidates ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para tabla onboarding_candidates
-- Permitir que cualquier persona inserte datos (ya que es un portal público anónimo)
CREATE POLICY "Permitir inserción pública" ON onboarding_candidates
    FOR INSERT 
    WITH CHECK (true);

-- Solo administradores pueden ver la data de los candidatos
CREATE POLICY "Permitir lectura autenticada" ON onboarding_candidates
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Permitir actualización autenticada" ON onboarding_candidates
    FOR UPDATE
    TO authenticated
    USING (true);

-- 3. Crear bucket para documentos (si no existe)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('candidate-documents', 'candidate-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Políticas del Storage Bucket
-- Permitir subida pública de PDFs (anónima)
CREATE POLICY "Permitir subida pública de documentos"
    ON storage.objects FOR INSERT
    WITH CHECK ( bucket_id = 'candidate-documents' );

-- Permitir visualización solo a autenticados (opcional, o pública si necesitamos acceder fácil)
-- Para facilitar la visualización en el admin panel, la haremos de lectura pública por ahora, 
-- pero ofuscada por el UUID del nombre del archivo.
CREATE POLICY "Permitir lectura de documentos"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'candidate-documents' );

CREATE POLICY "Permitir borrado autenticado"
    ON storage.objects FOR DELETE
    TO authenticated
    USING ( bucket_id = 'candidate-documents' );
