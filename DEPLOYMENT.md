# DIGITALIZACION - Guía de Despliegue para 192.168.91.28

Esta guía detalla los pasos necesarios para desplegar la aplicación en el servidor de producción.

## Requisitos Previos en el Servidor (192.168.91.28)

1.  **Node.js**: Versión 18 o superior instalada.
2.  **Oracle Instant Client**: Requerido por la librería `oracledb`.
    -   Descargar e instalar Oracle Instant Client (Basic o Light).
    -   Configurar las variables de entorno (`PATH`, `LD_LIBRARY_PATH` o `OCI_LIB_DIR`).
3.  **PM2**: Instalar globalmente para gestionar el proceso: `npm install -g pm2`.

## Pasos para el Despliegue

### 1. Preparación de Archivos
Copiar los siguientes archivos/carpetas al servidor:
-   `.next` (Generado por el comando build)
-   `public`
-   `package.json`
-   `package-lock.json`
-   `.env.local` (O crear un `.env.production`)

### 2. Instalación de Dependencias
En la carpeta del proyecto en el servidor, ejecutar:
```bash
npm install --production
```

### 3. Configuración de Variables de Entorno
Asegurarse de que el archivo `.env.production` contenga las credenciales correctas:
```env
NEXT_PUBLIC_ENCRYPTION_KEY=...
ORACLE_USER=DIGITALIZACION
ORACLE_PASSWORD=...
ORACLE_CONNECTION_STRING=...
```

### 4. Lanzamiento con PM2
Ejecutar el siguiente comando para iniciar la aplicación:
```bash
pm2 start npm --name "digitalizacion-app" -- start -- -p 3000
```

Para asegurar que inicie con el servidor:
```bash
pm2 save
pm2 startup
```

## Verificación
Acceder a `http://192.168.91.28:3000` para verificar que la aplicación esté respondiendo.
