import hana from '@sap/hana-client';
import fs from 'fs';
import path from 'path';

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

    const sql = `
      WITH EMPLOYEE_STATUS AS (
          SELECT 
              PERNR,
              CASE  
                  WHEN EXISTS (
                      SELECT 1 
                      FROM sapabap1.PA0001 P2 
                      WHERE P2.PERNR = P1.PERNR 
                      AND P2.ENDDA <> '99991231'
                      AND P2.PLANS <> '99999999'  
                      AND P2.BEGDA <= CURRENT_DATE
                  ) AND NOT EXISTS (
                      SELECT 1 
                      FROM sapabap1.PA0001 P3 
                      WHERE P3.PERNR = P1.PERNR 
                      AND P3.ENDDA = '99991231'
                      AND P3.PLANS <> '99999999'
                      AND P3.BEGDA <= CURRENT_DATE
                  ) THEN 'CESE'
                  WHEN EXISTS (
                      SELECT 1 
                      FROM sapabap1.PA0001 P4 
                      WHERE P4.PERNR = P1.PERNR 
                      AND P4.ENDDA = '99991231'
                      AND P4.PLANS <> '99999999'
                      AND P4.BEGDA <= CURRENT_DATE
                  ) THEN 'ACTIVO'
                  WHEN EXISTS (
                      SELECT 1 
                      FROM sapabap1.PA0001 P5 
                      WHERE P5.PERNR = P1.PERNR 
                      AND P5.ENDDA = '99991231'
                      AND P5.PLANS <> '99999999'
                      AND P5.BEGDA > CURRENT_DATE
                  ) AND NOT EXISTS (
                      SELECT 1 
                      FROM sapabap1.PA0001 P6 
                      WHERE P6.PERNR = P1.PERNR 
                      AND P6.ENDDA = '99991231'
                      AND P6.PLANS <> '99999999'
                      AND P6.BEGDA <= CURRENT_DATE
                  ) THEN 'FUTURO'
                  ELSE 'INACTIVO'
              END AS ESTADO_REAL
          FROM sapabap1.PA0001 P1
          GROUP BY P1.PERNR
      )
      SELECT 
          ESTADO_REAL,
          COUNT(*) as TOTAL
      FROM EMPLOYEE_STATUS
      GROUP BY ESTADO_REAL
      ORDER BY TOTAL DESC
    `;

    client.exec(sql, (err, rows) => {
        if (err) {
            console.error('❌ Error:', err);
        } else {
            console.log('--- Distribución Global de ESTADO_REAL en SAP ---');
            console.log(rows);
        }
        client.disconnect();
    });
});
