-- ==============================================================================
-- SQL: add_oracle_coupon_columns.sql
-- Ejecutar en Supabase SQL Editor para dar soporte completo a certificados Oracle
-- ==============================================================================

ALTER TABLE public.digi_employee_benefits_90d
ADD COLUMN IF NOT EXISTS discount_id_ws VARCHAR(255),
ADD COLUMN IF NOT EXISTS cupon_oracle_estado VARCHAR(50) DEFAULT 'PENDIENTE',
ADD COLUMN IF NOT EXISTS oracle_cupones JSONB DEFAULT '[]'::jsonb;

-- Índice para consultar rápidamente certificados pendientes
CREATE INDEX IF NOT EXISTS idx_digi_benefits_cupon_oracle 
ON public.digi_employee_benefits_90d(cupon_oracle_estado);
