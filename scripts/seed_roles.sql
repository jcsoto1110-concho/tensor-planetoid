-- =========================================================================
-- Script para Registrar Roles Iniciales (Admin, Aprobador, Operador)
-- IMPORTANTE: Reemplaza las cédulas con las reales si el WS requiere otras.
-- =========================================================================

-- 1. Insertar el Administrador (Rol: ADMIN)
INSERT INTO digi_users (username, name, cedula) 
VALUES ('admin', 'Administrador Principal', '0000000001');

INSERT INTO digi_user_roles (user_id, role)
SELECT id, 'ADMIN' FROM digi_users WHERE username = 'admin';

-- 2. Insertar el Aprobador (Rol: APPROVER)
INSERT INTO digi_users (username, name, cedula) 
VALUES ('aprobador', 'Supervisor de Aprobaciones', '0000000002');

INSERT INTO digi_user_roles (user_id, role)
SELECT id, 'APPROVER' FROM digi_users WHERE username = 'aprobador';

-- 3. Insertar el Operador/Operador (Rol: UPLOADER)
INSERT INTO digi_users (username, name, cedula) 
VALUES ('operador', 'Operador de Carga', '0000000003');

INSERT INTO digi_user_roles (user_id, role)
SELECT id, 'UPLOADER' FROM digi_users WHERE username = 'operador';

-- Confirmar cambios
COMMIT;
