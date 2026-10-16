# 🤖 Agente Autónomo Oracle Retail Pro (`agent-oracle-coupons`)

Este micro-agente es ultra liviano (pesa menos de 30 KB) y se encarga de monitorear Supabase cada 30 segundos para emitir certificados de descuento en **Oracle Retail Pro** (`192.168.91.14:1521/rproods`) desde el servidor **192.168.91.28**.

---

## 🚀 Despliegue en 3 Pasos en el Servidor `192.168.91.28`

Solo necesitas copiar esta subcarpeta `agent-oracle-coupons` al servidor `192.168.91.28` (o hacer `git pull` si clonaste el repo).

### 1. Entrar a la subcarpeta e instalar las 2 librerías necesarias:
```bash
cd agent-oracle-coupons
npm install
```
*(Solo descarga `@supabase/supabase-js` y `oracledb`, se instala en segundos).*

### 2. Configurar el archivo `.env`:
Copia el archivo de ejemplo a `.env`:
```bash
cp .env.example .env
```
Y verifica que contenga la clave de Supabase y las credenciales de Oracle.

### 3. Iniciar el Agente con PM2 (24/7):
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 📊 Comandos de Control

* **Ver el estado:**
  ```bash
  pm2 status
  ```
* **Ver logs en tiempo real:**
  ```bash
  pm2 logs agent-oracle-coupons
  ```
* **Reiniciar el agente:**
  ```bash
  pm2 restart agent-oracle-coupons
  ```
* **Detener el agente:**
  ```bash
  pm2 stop agent-oracle-coupons
  ```

---

## 🧪 Prueba Manual Rápida (sin PM2)
Si deseas probarlo una sola vez en la consola para ver qué hace:
```bash
npm run once
```
O para probar el modo vigilante interactivo:
```bash
npm start
```
