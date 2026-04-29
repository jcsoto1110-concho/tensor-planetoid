-- =====================================================
-- Tabla para guardar cargos predefinidos del proceso de selección
-- Ejecutar en el Dashboard de Supabase > SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS job_positions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cargo       VARCHAR(150) NOT NULL,
  ciudad      VARCHAR(100),
  funciones   TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Habilitar acceso público (ajusta según tus políticas RLS)
ALTER TABLE job_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso público lectura job_positions"
  ON job_positions FOR SELECT USING (true);

CREATE POLICY "Acceso público inserción job_positions"
  ON job_positions FOR INSERT WITH CHECK (true);

CREATE POLICY "Acceso público eliminación job_positions"
  ON job_positions FOR DELETE USING (true);

-- Datos de ejemplo para cargos comunes
INSERT INTO job_positions (cargo, ciudad, funciones) VALUES
(
  'Cajero',
  'Quito',
  'Manejo de caja registradora y POS. Cobro en efectivo y tarjetas de crédito/débito. Cuadre y cierre de caja al final del turno. Atención al cliente en punto de pago. Manejo básico de sistemas de facturación. Honestidad y responsabilidad con valores monetarios. Orientación al servicio al cliente.'
),
(
  'Vendedor',
  'Quito',
  'Asesoramiento y venta de productos al cliente. Cumplimiento de metas y cuotas de ventas mensuales. Mantenimiento y organización del área de ventas. Conocimiento de catálogo y características de productos. Excelente comunicación y trato con clientes. Capacidad de trabajo bajo presión. Experiencia en retail o ventas presenciales.'
),
(
  'Bodeguero',
  'Quito',
  'Recepción y verificación de mercadería. Control y registro de inventario. Organización de bodega y productos. Despacho de productos a las áreas solicitadas. Manejo de montacargas o transpaletas (deseable). Registro en sistema de gestión de inventarios. Trabajo físico y en ambientes de almacenamiento.'
);
