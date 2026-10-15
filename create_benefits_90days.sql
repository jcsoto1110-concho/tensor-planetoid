-- ==============================================================================
-- TABLA: digi_employee_benefits_90d
-- Módulo de Beneficio 90 Días para colaboradores activos en Digitalización
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.digi_employee_benefits_90d (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pernr VARCHAR(50) NOT NULL,
    cedula VARCHAR(20) NOT NULL,
    nombre_completo VARCHAR(255) NOT NULL,
    genero VARCHAR(20),
    email VARCHAR(255),
    telefono VARCHAR(100),
    direccion TEXT,
    ciudad VARCHAR(100),
    posicion VARCHAR(255),
    operacion VARCHAR(255),
    jefatura VARCHAR(255),
    gerencia VARCHAR(255),
    grupo_personal VARCHAR(100),
    fecha_ingreso DATE,
    fecha_ingreso_real DATE,
    dias_laborados INTEGER DEFAULT 90,
    tipo_operacion VARCHAR(100) NOT NULL DEFAULT 'TIENDA_BODEGA', -- TIENDA_BODEGA, ADM_ASISTENCIAL, JEFATURA_SUPERVISION, GERENCIA
    cupo_sugerido NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
    cupo_aprobado NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
    estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE', -- PENDIENTE, APROBADO, RECHAZADO, CONSUMIDO
    qr_token TEXT,
    discount_id_ws VARCHAR(100), -- ID devuelto por el Web Service de creación de códigos de descuento
    empresas TEXT[] DEFAULT ARRAY['E200', 'E100', 'E101']::TEXT[], -- E200 (Superdeporte), E100 (Equinox), E101 (Mundo Dep)
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMPTZ,
    aprobado_por VARCHAR(255),
    aprobado_at TIMESTAMPTZ,
    observaciones TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT digi_employee_benefits_90d_pernr_key UNIQUE (pernr)
);

-- Índices para optimizar búsquedas y filtros
CREATE INDEX IF NOT EXISTS idx_digi_benefits_estado ON public.digi_employee_benefits_90d(estado);
CREATE INDEX IF NOT EXISTS idx_digi_benefits_cedula ON public.digi_employee_benefits_90d(cedula);
CREATE INDEX IF NOT EXISTS idx_digi_benefits_pernr ON public.digi_employee_benefits_90d(pernr);
CREATE INDEX IF NOT EXISTS idx_digi_benefits_fecha_ingreso ON public.digi_employee_benefits_90d(fecha_ingreso_real);

-- Habilitar RLS y políticas permisivas
ALTER TABLE public.digi_employee_benefits_90d ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir select público beneficios 90d" ON public.digi_employee_benefits_90d;
DROP POLICY IF EXISTS "Permitir insert público beneficios 90d" ON public.digi_employee_benefits_90d;
DROP POLICY IF EXISTS "Permitir update público beneficios 90d" ON public.digi_employee_benefits_90d;
DROP POLICY IF EXISTS "Permitir delete público beneficios 90d" ON public.digi_employee_benefits_90d;

CREATE POLICY "Permitir select público beneficios 90d" ON public.digi_employee_benefits_90d FOR SELECT USING (true);
CREATE POLICY "Permitir insert público beneficios 90d" ON public.digi_employee_benefits_90d FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir update público beneficios 90d" ON public.digi_employee_benefits_90d FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Permitir delete público beneficios 90d" ON public.digi_employee_benefits_90d FOR DELETE USING (true);
