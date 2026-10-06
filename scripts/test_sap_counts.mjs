import hana from '@sap/hana-client';
import fs from 'fs';
import path from 'path';

// Cargar variables de entorno desde .env.local
const envPath = path.resolve('.env.local');
let env = {};

if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [k, ...v] = trimmed.split('=');
            env[k.trim()] = v.join('=').trim().replace(/^["']|["']$/g, '');
        }
    });
}

const sapHost = env.SAP_HANA_HOST || '172.1.2.10';
const sapPort = env.SAP_HANA_PORT || '30015';
const sapUser = env.SAP_HANA_USER || 'USERBI';
const sapPassword = env.SAP_HANA_PASSWORD || 'MaraBI2021*';
const sapSchema = env.SAP_HANA_SCHEMA || 'sapabap1';

const client = hana.createConnection();

const config = {
    serverNode: `${sapHost}:${sapPort}`,
    uid: sapUser,
    pwd: sapPassword,
    currentSchema: sapSchema,
    autoReconnect: true
};

client.connect(config, (err) => {
    if (err) {
        console.error('❌ Error conectando a SAP:', err.message);
        process.exit(1);
    }
    console.log('✔ Conectado a SAP HANA');

    // 1. Conteo según PA0000.STAT2
    const q1 = `
        SELECT 
            STAT2,
            COUNT(*) as TOTAL
        FROM sapabap1.PA0000
        WHERE ENDDA >= CURRENT_DATE
        GROUP BY STAT2
        ORDER BY STAT2
    `;

    client.exec(q1, (err, rows) => {
        if (err) {
            console.error('Error q1:', err);
        } else {
            console.log('--- STAT2 en PA0000 (Vigentes) ---');
            console.log(rows);
        }

        // 2. Conteo por Empresa BUKRS
        const q2 = `
            SELECT 
                PA0001.BUKRS,
                COUNT(DISTINCT PA0001.PERNR) as TOTAL_PERNR
            FROM sapabap1.PA0001 PA0001
            INNER JOIN sapabap1.PA0000 PA0000 
                ON PA0001.PERNR = PA0000.PERNR 
                AND PA0000.STAT2 = '3' 
                AND PA0000.ENDDA >= CURRENT_DATE
            WHERE PA0001.ENDDA >= CURRENT_DATE
            GROUP BY PA0001.BUKRS
        `;

        client.exec(q2, (err2, rows2) => {
            if (err2) {
                console.error('Error q2:', err2);
            } else {
                console.log('--- Empleados Realmente Activos (STAT2=3) por Empresa (BUKRS) ---');
                console.log(rows2);
            }
            client.disconnect();
        });
    });
});
