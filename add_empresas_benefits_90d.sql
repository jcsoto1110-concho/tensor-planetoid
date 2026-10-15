-- ==============================================================================
-- MIGRACIÓN: Agregar columna 'empresas' a la tabla digi_employee_benefits_90d
-- Permite que el aprobador seleccione una o todas las empresas para el certificado:
-- E200: Superdeporte
-- E100: Equinox
-- E101: Mundo Dep
-- ==============================================================================

ALTER TABLE public.digi_employee_benefits_90d 
ADD COLUMN IF NOT EXISTS empresas TEXT[] DEFAULT ARRAY['E200', 'E100', 'E101']::TEXT[];

-- Actualizar registros existentes que no tengan empresas definidas
UPDATE public.digi_employee_benefits_90d
SET empresas = ARRAY['E200', 'E100', 'E101']::TEXT[]
WHERE empresas IS NULL OR cardinality(empresas) = 0;
