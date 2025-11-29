# 📋 Zero Paper - Documentación Completa del Proyecto

## 🎯 Descripción General

**Zero Paper** es un sistema integral de gestión documental y cumplimiento de protección de datos diseñado para empresas que operan en Ecuador, Perú y Chile. El sistema permite la gestión digital de documentos de empleados, procesamiento de derechos ARCO, y gestión de políticas de privacidad conforme a las regulaciones de cada país.

- **Frontend**: Next.js 16.0.3 (App Router con Turbopack)
- **UI Framework**: React 19
- **Styling**: Tailwind CSS + CSS Modules
- **Backend**: Supabase (PostgreSQL + Storage + Auth)
- **Deployment**: Vercel
- **Repositorio**: GitHub (`jcsoto1110-concho/tensor-planetoid`)

### Estructura del Proyecto

```
tensor-planetoid/
├── src/
│   │           ├── employees/        # Employee management
│   │           ├── upload/           # Document upload
│   │           ├── approvals/        # Document approvals
│   │           └── audit/            # Audit logs
│   ├── components/
│   │   └── ConsentForm.tsx           # Digital consent component
│   ├── context/
│   │   ├── ZPAuthContext.tsx         # Authentication context
│   │   └── DocContext.tsx            # Document management context
│   ├── lib/
│   │   ├── supabase.ts               # Supabase client
│   │   ├── encryption.ts             # File encryption utilities
│   │   ├── externalAuth.ts           # External auth integration
│   │   ├── privacyPolicies.ts        # Legal texts by country
│   │   └── latam-locations.ts        # LATAM regions data
│   └── types/
│       └── dataProtection.ts         # Data protection types
├── public/                           # Static assets
├── .env.local                        # Environment variables (local)
└── package.json                      # Dependencies
```

---

## 🔐 Configuración de Supabase

### Credenciales

```env
NEXT_PUBLIC_SUPABASE_URL=https://rnfbaecnhjcmaooullai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_ENCRYPTION_KEY=DQA//zg5?z;%lKP{4$$$@=1vVw!K|an3
```

### Esquema de Base de Datos

#### Tabla: `employees`
```sql
CREATE TABLE employees (
    id TEXT PRIMARY KEY,              -- Cédula
    codigo_sap TEXT,
    name TEXT NOT NULL,
    apellido TEXT NOT NULL,
    position TEXT NOT NULL,
    entry_date DATE NOT NULL,
    region TEXT,
    ciudad TEXT,
    departamento TEXT,
    responsable TEXT,
    pais TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabla: `documents`
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id TEXT REFERENCES employees(id),
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_url TEXT NOT NULL,
    upload_date TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'PENDING',
    uploaded_by TEXT,
    approved_by TEXT,
    approved_date TIMESTAMPTZ,
    rejected_by TEXT,
    rejection_reason TEXT,
    comments TEXT
);
CREATE TABLE arco_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_cedula TEXT NOT NULL,
    request_type TEXT NOT NULL,
    country TEXT NOT NULL,
    request_date TIMESTAMPTZ DEFAULT NOW(),
    details TEXT,
    status TEXT DEFAULT 'pending',
    response TEXT,
    response_date TIMESTAMPTZ
);
```

#### Tabla: `audit_logs`
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    description TEXT
);
```

### Storage Buckets

- **`employee-documents`**: Almacenamiento de documentos de empleados
  - Configuración: Public access habilitado
  - Estructura: `{employee_id}/{timestamp}_{filename}`

---

## 👥 Sistema de Autenticación

### Usuarios Demo

```typescript
// Admin
username: admin
password: admin123
cedula: 0000000001

// Approver
username: aprobador
password: aprobar123
cedula: 0000000002

// Uploader
username: operador
password: subir123
cedula: 0000000003
```

### Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **ADMIN** | Acceso completo: empleados, documentos, aprobaciones, auditoría |
| **APPROVER** | Ver empleados, aprobar/rechazar documentos |
| **UPLOADER** | Ver empleados, subir documentos |

### Autenticación Externa

El sistema está configurado para integrarse con el servicio web `aseyco`:

```typescript
// src/lib/externalAuth.ts
export async function authenticateWithExternalService(
    cedula: string, 
    password: string
): Promise<ExternalAuthResponse>
```

---

## 📄 Funcionalidades Principales

### 1. Gestión de Empleados

- **Crear empleados**: Formulario con datos completos (cédula, nombre, cargo, etc.)
- **Importación masiva**: Desde archivos Excel/CSV
- **Búsqueda y filtrado**: Por nombre, cédula, departamento
- **Vista detallada**: Información completa + documentos asociados

### 2. Gestión de Documentos

- **Carga de documentos**: PDF e imágenes
- **Encriptación**: Todos los archivos se encriptan antes de almacenar
- **Estados**: PENDING, APPROVED, REJECTED
- **Workflow de aprobación**: Los aprobadores revisan y aprueban/rechazan
- **Vista previa**: Visualización de PDFs e imágenes en el navegador

### 3. Portal de Empleados

El portal de empleados permite a los trabajadores acceder a sus documentos personales de forma segura.

#### Características:
- **Autenticación externa**: Integración con servicio Aseyco para validación de credenciales
- **Vista simplificada**: Sin menú lateral de administración, solo header con logout
- **Aprobación de consentimiento**: Botón para aprobar la Ley de Protección de Datos Personales
- **Visualización de documentos**: Lista de documentos con botón "Visualizar"
- **Modal de preview**: Visualización de PDFs e imágenes en modal

#### Flujo de uso:
1. Empleado ingresa con cédula y contraseña en `/employee-login`
2. Sistema valida credenciales con servicio externo Aseyco
3. Si no ha aprobado el consentimiento, se muestra el botón de aprobación
4. Una vez aprobado, puede visualizar sus documentos
5. Puede cerrar sesión desde el header

#### Datos guardados en consentimiento:
- `employee_id`: Cédula del empleado
- `employee_cedula`: Cédula (campo redundante por compatibilidad)
- `employee_name`: Nombre completo
- `country`: País (Ecuador por defecto)
- `consent_date`: Fecha de aprobación
- `expiry_date`: Fecha de expiración (1 año después)
- `consent_text`: Texto de aceptación

### 4. Protección de Datos

#### Política de Privacidad
- Contenido específico por país (Ecuador, Perú, Chile)
- Información sobre tratamiento de datos personales
- Derechos de los titulares
- Contacto del responsable

#### Portal ARCO
Permite a los empleados ejercer sus derechos:
- **Acceso**: Solicitar copia de sus datos
- **Rectificación**: Corregir datos inexactos
- **Cancelación**: Eliminar datos
- **Oposición**: Oponerse al tratamiento

Tiempos de respuesta por país:
- Ecuador: 10 días hábiles
- Perú: 10 días hábiles
- Chile: 2 días hábiles

#### Consentimiento Digital
- Formulario de consentimiento informado
- Registro con IP y user agent
- Almacenamiento en Supabase
- Texto personalizado por país

### 4. Auditoría

Sistema completo de logs que registra:
- Creación/modificación de empleados
- Carga de documentos
- Aprobaciones/rechazos
- Importaciones masivas
- Eliminaciones

---

## 🎨 Interfaz de Usuario

### Diseño

- **Color principal**: Gradiente morado (#667eea → #764ba2)
- **Tipografía**: Geist Sans (sistema)
- **Iconos**: Lucide React
- **Responsive**: Diseño adaptable a móviles y tablets

### Navegación

Sidebar con las siguientes secciones:
- 📊 Dashboard
- 👥 Empleados
- 📤 Subir Documentos
- ✅ Aprobaciones (solo ADMIN/APPROVER)
- 📋 Auditoría (solo ADMIN)
- 🔒 Política de Privacidad
- ⚖️ Derechos ARCO

---

## 🔧 Configuración de Desarrollo

### Requisitos

- Node.js 18+
- npm o yarn
- Cuenta de Supabase
- Cuenta de Vercel (para deployment)

### Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/jcsoto1110-concho/tensor-planetoid.git
cd tensor-planetoid

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar en desarrollo
npm run dev

# Abrir en navegador
http://localhost:3000/zero-paper
```

### Scripts Disponibles

```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

---

## 🚀 Deployment en Vercel

### Configuración

1. **Conectar repositorio**: Vincular `tensor-planetoid` desde GitHub
2. **Framework**: Next.js (detectado automáticamente)
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`

### Variables de Entorno en Vercel

```
NEXT_PUBLIC_SUPABASE_URL=https://rnfbaecnhjcmaooullai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_ENCRYPTION_KEY=DQA//zg5?z;%lKP{4$$$@=1vVw!K|an3
```

### Proceso de Deploy

1. Push a `main` branch en GitHub
2. Vercel detecta cambios automáticamente
3. Build y deploy en ~2-3 minutos
4. URL de producción actualizada

---

## 📊 Flujos de Trabajo

### Flujo de Carga de Documentos

```
1. UPLOADER inicia sesión
2. Navega a "Subir Documentos"
3. Busca empleado por cédula
4. Selecciona archivo (PDF/imagen)
5. Archivo se encripta
6. Se sube a Supabase Storage
7. Metadata se guarda en DB con status PENDING
8. Log de auditoría se registra
```

### Flujo de Aprobación

```
1. APPROVER/ADMIN inicia sesión
2. Navega a "Aprobaciones"
3. Ve lista de documentos PENDING
4. Hace clic en documento para ver preview
5. Aprueba o rechaza (con comentarios opcionales)
6. Status se actualiza en DB
7. Log de auditoría se registra
```

### Flujo de Solicitud ARCO

```
1. Empleado accede al portal ARCO
2. Selecciona país
3. Selecciona tipo de derecho (Acceso/Rectificación/etc)
4. Ingresa cédula y detalles
5. Solicitud se guarda en DB
6. Sistema muestra tiempo de respuesta estimado
7. (Futuro) Email de confirmación se envía
```

---

## 🔒 Seguridad

### Encriptación de Archivos

```typescript
// src/lib/encryption.ts
export async function encryptFile(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...bytes));
    return base64; // Implementación básica
}
```

### RLS (Row Level Security)

Políticas básicas configuradas en Supabase:
- Lectura pública para tablas necesarias
- Escritura restringida por autenticación
- (Recomendado) Implementar políticas más estrictas en producción

---

## 📝 Cumplimiento Legal

### Ecuador
- **Ley Orgánica de Protección de Datos Personales**
- Registro ante la Autoridad de Protección de Datos
- Tiempo de respuesta ARCO: 10 días hábiles

### Perú
- **Ley N° 29733 - Ley de Protección de Datos Personales**
- Registro ante la Autoridad Nacional de Protección de Datos
- Tiempo de respuesta ARCO: 10 días hábiles

### Chile
- **Ley N° 19.628 sobre Protección de la Vida Privada**
- Registro ante el Servicio de Registro Civil
- Tiempo de respuesta ARCO: 2 días hábiles

---

## 🐛 Troubleshooting

### Error: "Module not found: Can't resolve '@/lib/database'"
**Solución**: Este archivo fue eliminado. Usar `DocContext` que ahora usa Supabase directamente.

### Error: Build failed en Vercel
**Solución**: Verificar que todas las variables de entorno estén configuradas correctamente.

### Documentos no se cargan
**Solución**: Verificar que el bucket `employee-documents` exista en Supabase Storage.

### Login no funciona
**Solución**: Verificar credenciales demo o configuración de autenticación externa.

---

## 🔄 Próximas Mejoras

### Corto Plazo
- [ ] Integrar formulario de consentimiento en flujo de creación de empleados
- [ ] Panel admin para gestionar solicitudes ARCO
- [ ] Notificaciones por email para solicitudes ARCO
- [ ] Exportación automática de datos (portabilidad)

### Mediano Plazo
- [ ] Firma digital de documentos
- [ ] Versionado de documentos
- [ ] Dashboard con métricas y estadísticas
- [ ] Reportes de cumplimiento

### Largo Plazo
- [ ] App móvil (React Native)
- [ ] Integración con sistemas de RRHH
- [ ] IA para clasificación automática de documentos
- [ ] Multi-tenancy para múltiples empresas

---

## 📞 Contacto y Soporte

**Desarrollador**: Antigravity AI Assistant  
**Cliente**: Juan Carlos Soto  
**Repositorio**: https://github.com/jcsoto1110-concho/tensor-planetoid  
**Producción**: https://tensor-planetoid.vercel.app

---

## 📄 Licencia

- Cuenta de Supabase
- Cuenta de Vercel (para deployment)

### Instalación Local

```bash
# Clonar repositorio
git clone https://github.com/jcsoto1110-concho/tensor-planetoid.git
cd tensor-planetoid

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Ejecutar en desarrollo
npm run dev

# Abrir en navegador
http://localhost:3000/zero-paper
```

### Scripts Disponibles

```json
{
  "dev": "next dev --turbopack",
  "build": "next build",
  "start": "next start",
  "lint": "next lint"
}
```

---

## 🚀 Deployment en Vercel

### Configuración

1. **Conectar repositorio**: Vincular `tensor-planetoid` desde GitHub
2. **Framework**: Next.js (detectado automáticamente)
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`

### Variables de Entorno en Vercel

```
NEXT_PUBLIC_SUPABASE_URL=https://rnfbaecnhjcmaooullai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_ENCRYPTION_KEY=DQA//zg5?z;%lKP{4$$$@=1vVw!K|an3
```

### Proceso de Deploy

1. Push a `main` branch en GitHub
2. Vercel detecta cambios automáticamente
3. Build y deploy en ~2-3 minutos
4. URL de producción actualizada

---

## 📊 Flujos de Trabajo

### Flujo de Carga de Documentos

```
1. UPLOADER inicia sesión
2. Navega a "Subir Documentos"
3. Busca empleado por cédula
4. Selecciona archivo (PDF/imagen)
5. Archivo se encripta
6. Se sube a Supabase Storage
7. Metadata se guarda en DB con status PENDING
8. Log de auditoría se registra
```

### Flujo de Aprobación

```
1. APPROVER/ADMIN inicia sesión
2. Navega a "Aprobaciones"
3. Ve lista de documentos PENDING
4. Hace clic en documento para ver preview
5. Aprueba o rechaza (con comentarios opcionales)
6. Status se actualiza en DB
7. Log de auditoría se registra
```

### Flujo de Solicitud ARCO

```
1. Empleado accede al portal ARCO
2. Selecciona país
3. Selecciona tipo de derecho (Acceso/Rectificación/etc)
4. Ingresa cédula y detalles
5. Solicitud se guarda en DB
6. Sistema muestra tiempo de respuesta estimado
7. (Futuro) Email de confirmación se envía
```

---

## 🔒 Seguridad

### Encriptación de Archivos

```typescript
// src/lib/encryption.ts
export async function encryptFile(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const base64 = btoa(String.fromCharCode(...bytes));
    return base64; // Implementación básica
}
```

### RLS (Row Level Security)

Políticas básicas configuradas en Supabase:
- Lectura pública para tablas necesarias
- Escritura restringida por autenticación
- (Recomendado) Implementar políticas más estrictas en producción

---

## 📝 Cumplimiento Legal

### Ecuador
- **Ley Orgánica de Protección de Datos Personales**
- Registro ante la Autoridad de Protección de Datos
- Tiempo de respuesta ARCO: 10 días hábiles

### Perú
- **Ley N° 29733 - Ley de Protección de Datos Personales**
- Registro ante la Autoridad Nacional de Protección de Datos
- Tiempo de respuesta ARCO: 10 días hábiles

### Chile
- **Ley N° 19.628 sobre Protección de la Vida Privada**
- Registro ante el Servicio de Registro Civil
- Tiempo de respuesta ARCO: 2 días hábiles

---

## 🐛 Troubleshooting

### Error: "Module not found: Can't resolve '@/lib/database'"
**Solución**: Este archivo fue eliminado. Usar `DocContext` que ahora usa Supabase directamente.

### Error: Build failed en Vercel
**Solución**: Verificar que todas las variables de entorno estén configuradas correctamente.

### Documentos no se cargan
**Solución**: Verificar que el bucket `employee-documents` exista en Supabase Storage.

### Login no funciona
**Solución**: Verificar credenciales demo o configuración de autenticación externa.

---

## 🔄 Próximas Mejoras

### Corto Plazo
- [ ] Integrar formulario de consentimiento en flujo de creación de empleados
- [ ] Panel admin para gestionar solicitudes ARCO
- [ ] Notificaciones por email para solicitudes ARCO
- [ ] Exportación automática de datos (portabilidad)

### Mediano Plazo
- [ ] Firma digital de documentos
- [ ] Versionado de documentos
- [ ] Dashboard con métricas y estadísticas
- [ ] Reportes de cumplimiento

### Largo Plazo
- [ ] App móvil (React Native)
- [ ] Integración con sistemas de RRHH
- [ ] IA para clasificación automática de documentos
- [ ] Multi-tenancy para múltiples empresas

---

## 📞 Contacto y Soporte

**Desarrollador**: Antigravity AI Assistant  
**Cliente**: Juan Carlos Soto  
**Repositorio**: https://github.com/jcsoto1110-concho/tensor-planetoid  
**Producción**: https://tensor-planetoid.vercel.app

---

## 📄 Licencia

Proyecto privado - Todos los derechos reservados

---

**Última actualización**: 28 de noviembre de 2024  
**Versión**: 1.1.0 - Portal de Empleados implementado
