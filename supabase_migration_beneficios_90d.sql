-- ==============================================================================
-- MIGRACIÓN SUPABASE: Beneficio 90 Días y Certificados Oracle Retail Pro
-- Ejecutar en Supabase -> SQL Editor para añadir las columnas necesarias
-- ==============================================================================

ALTER TABLE public.digi_employee_benefits_90d
ADD COLUMN IF NOT EXISTS empresas TEXT[] DEFAULT ARRAY['E200']::TEXT[],
ADD COLUMN IF NOT EXISTS discount_id_ws VARCHAR(255),
ADD COLUMN IF NOT EXISTS cupon_oracle_estado VARCHAR(50) DEFAULT 'PENDIENTE',
ADD COLUMN IF NOT EXISTS oracle_cupones JSONB DEFAULT '[]'::jsonb;

-- Índice para optimizar consultas de cupones pendientes
CREATE INDEX IF NOT EXISTS idx_digi_benefits_cupon_oracle 
ON public.digi_employee_benefits_90d(cupon_oracle_estado);

-- Actualizar empresas por defecto en registros existentes
UPDATE public.digi_employee_benefits_90d
SET empresas = ARRAY['E200']::TEXT[]
WHERE empresas IS NULL OR cardinality(empresas) = 0;
