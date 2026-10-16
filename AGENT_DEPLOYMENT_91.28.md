# Guía de Instalación del Agente Vigilante en Servidor 192.168.91.28

Este agente se ejecuta en segundo plano como un servicio 24/7 en el servidor **192.168.91.28**.

### ¿Qué hace este Agente?
1. **Escucha en tiempo real**: Monitorea Supabase cada 30 segundos buscando colaboradores en estado `APROBADO` (que hayan sido aprobados desde la web `uneteanuestroequipo.ec.aseyco.com` o el portal admin).
2. **Conexión Directa a Oracle LAN**: Al estar en el servidor de la red interna `192.168.91.28`, se conecta de forma directa y nativa a Oracle Retail Pro (`192.168.91.14:1521/rproods`).
3. **Generación del Certificado**:
   - Obtiene el siguiente secuencial de la tabla `SECUENCIALES`.
   - Genera el código con prefijo fijo `ATS` + subsidiaria + secuencial + dígito Luhn (ej: `ATS1180000000457`).
   - Inserta la fila completa en `CERTIFICADOS` con el monto de cupo, fecha de validez y estilos excluidos.
   - Confirma la transacción (`COMMIT`).
4. **Sincronización en la Nube**: Actualiza Supabase registrando el ID del certificado (`discount_id_ws`) para que aparezca disponible en el QR del empleado y en Sporty.

---

## Pasos para Instalar en 192.168.91.28

### 1. Actualizar el repositorio en el servidor
En la terminal del servidor `192.168.91.28`, ingresar al directorio del proyecto y descargar los cambios:
```bash
git pull origin main
```

### 2. Verificar que el archivo `.env.local` o `.env.production` exista
Asegúrate de que el archivo `.env.local` tenga las variables:
```env
NEXT_PUBLIC_SUPABASE_URL=https://zfbrwcflzbauycszajpc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_supabase_service_role_key

# Configuración Oracle Retail Pro
ORACLE_RPRO_USER=REPORTUSER
ORACLE_RPRO_PASSWORD=report
ORACLE_RPRO_CONNECT_STRING=192.168.91.14:1521/rproods
# Ruta al cliente Instant Client (si es Windows ej: C:\SAP_Monitor\instantclient_19_22 o /opt/oracle en Linux)
ORACLE_CLIENT_LIB=C:\SAP_Monitor\instantclient_19_22
```

---

## 3. Iniciar el Agente con PM2

Ejecutar en la carpeta del proyecto:

```bash
pm2 start ecosystem.config.cjs
```

O de forma directa:
```bash
pm2 start scripts/process_oracle_coupons.mjs --name "oracle-coupons-agent" -- --watch
```

---

## 4. Asegurar que inicie automáticamente al reiniciar el servidor

```bash
pm2 save
pm2 startup
```

---

## Comandos de Monitoreo

* **Ver estado del agente:**
  ```bash
  pm2 status
  ```
* **Ver logs en tiempo real:**
  ```bash
  pm2 logs oracle-coupons-agent
  ```
* **Reiniciar el agente:**
  ```bash
  pm2 restart oracle-coupons-agent
  ```
* **Detener el agente:**
  ```bash
  pm2 stop oracle-coupons-agent
  ```
