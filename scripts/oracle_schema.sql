-- =========================================================================
-- Script de Creación de Esquema Oracle para Sistema Zero Paper
-- Usuario: DIGITALIZACION
-- =========================================================================

-- Tabla: digi_employees (Empleados)
CREATE TABLE digi_employees (
    id VARCHAR2(255) PRIMARY KEY,              -- Cédula
    codigo_sap VARCHAR2(255),
    name VARCHAR2(255) NOT NULL,
    apellido VARCHAR2(255) NOT NULL,
    position VARCHAR2(255) NOT NULL,
    entry_date DATE NOT NULL,
    region VARCHAR2(255),
    ciudad VARCHAR2(255),
    departamento VARCHAR2(255),
    responsable VARCHAR2(255),
    pais VARCHAR2(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: digi_documents (Documentos)
CREATE TABLE digi_documents (
    id VARCHAR2(36) DEFAULT RAWTOHEX(SYS_GUID()) PRIMARY KEY,
    employee_id VARCHAR2(255),
    file_name VARCHAR2(500) NOT NULL,
    file_type VARCHAR2(50) NOT NULL,
    file_url VARCHAR2(1000) NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR2(50) DEFAULT 'PENDING',
    uploaded_by VARCHAR2(255),
    approved_by VARCHAR2(255),
    approved_date TIMESTAMP WITH TIME ZONE,
    rejected_by VARCHAR2(255),
    rejection_reason VARCHAR2(1000),
    comments VARCHAR2(1000),
    CONSTRAINT fk_documents_employee FOREIGN KEY (employee_id) REFERENCES digi_employees(id) ON DELETE CASCADE
);

-- Tabla: digi_arco_requests (Peticiones ARCO)
CREATE TABLE digi_arco_requests (
    id VARCHAR2(36) DEFAULT RAWTOHEX(SYS_GUID()) PRIMARY KEY,
    employee_cedula VARCHAR2(255) NOT NULL,
    request_type VARCHAR2(100) NOT NULL,
    country VARCHAR2(100) NOT NULL,
    request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    details CLOB,
    status VARCHAR2(50) DEFAULT 'pending',
    response CLOB,
    response_date TIMESTAMP WITH TIME ZONE
);

-- Tabla: digi_audit_logs (Logs de Auditoría)
CREATE TABLE digi_audit_logs (
    id VARCHAR2(36) DEFAULT RAWTOHEX(SYS_GUID()) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    user_name VARCHAR2(255) NOT NULL,
    action VARCHAR2(255) NOT NULL,
    entity_type VARCHAR2(255) NOT NULL,
    entity_id VARCHAR2(255),
    description CLOB
);

-- Tabla: digi_consents (Consentimientos Digitales)
CREATE TABLE digi_consents (
    id VARCHAR2(36) DEFAULT RAWTOHEX(SYS_GUID()) PRIMARY KEY,
    employee_cedula VARCHAR2(255) NOT NULL,
    country VARCHAR2(100) NOT NULL,
    consent_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    consent_text CLOB,
    ip_address VARCHAR2(100),
    user_agent VARCHAR2(1000),
    accepted NUMBER(1) DEFAULT 1
);

-- =========================================================================
-- Consideraciones opcionales (Índices)
-- =========================================================================
CREATE INDEX idx_digi_doc_emp_id ON digi_documents(employee_id);
CREATE INDEX idx_digi_arco_emp ON digi_arco_requests(employee_cedula);
CREATE INDEX idx_digi_consents_emp ON digi_consents(employee_cedula);
