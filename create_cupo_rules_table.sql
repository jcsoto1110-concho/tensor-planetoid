-- TABLA DEDICADA OPCIONAL: digi_cupo_rules
-- Nota: La aplicación ya funciona de forma 100% resiliente guardando y leyendo 
-- desde digi_audit_logs, pero esta tabla ofrece una estructura relacional directa si se desea.

CREATE TABLE IF NOT EXISTS public.digi_cupo_rules (
    id BIGSERIAL PRIMARY KEY,
    patron VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    cupo NUMERIC(10, 2) NOT NULL DEFAULT 1000.00,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Valores iniciales recomendados
INSERT INTO public.digi_cupo_rules (patron, descripcion, cupo, activo)
VALUES 
    ('ASVENT', 'Asesor de Ventas', 1000.00, true),
    ('AUBODE', 'Auxiliar de Bodega', 1000.00, true),
    ('CAJERO', 'Cajero / Facturación', 1000.00, true),
    ('BODEG', 'Bodegueros / Operadores de Bodega', 1000.00, true),
    ('ANALIS', 'Analistas Administrativos / BI', 1500.00, true),
    ('ASIST', 'Asistentes Administrativos', 1500.00, true),
    ('MAYORISTA', 'Canal Mayoristas', 1500.00, true),
    ('JEALMA', 'Jefes de Almacén', 2500.00, true),
    ('SUALMA', 'Supervisores de Almacén', 2500.00, true),
    ('SUTIEN', 'Supervisores de Tienda', 2500.00, true),
    ('COORD', 'Coordinadores / Líderes', 2500.00, true),
    ('GEREN', 'Gerencias y Directores', 6000.00, true)
ON CONFLICT (patron) DO NOTHING;
