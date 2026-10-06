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
          WHERE P1.PERNR = '00000015'
          GROUP BY P1.PERNR
      )
      SELECT 
          PA0001.BUKRS AS "Soc",
          T001.BUTXT AS "Nom_Soc",
          PA0002.PERNR AS "Num_Per",
          PA0002.NACHN AS "Apellido_Paterno",
          PA0002.NAME2 AS "Apellido_Materno",
          PA0002.VORNA AS "Nombre",
          CASE PA0002.GESCH 
              WHEN '1' THEN 'Masculino' 
              WHEN '2' THEN 'Femenino' 
              ELSE 'Otro' 
          END AS "Genero",
          PA0001.BEGDA AS "Fecha_Ingreso",
          CASE 
              WHEN PA0001.ENDDA <> '99991231' THEN PA0001.ENDDA 
              ELSE NULL 
          END AS "Fecha_Salida",
          hrp1000.stext AS DESCRIPCION_POSICION,
          PA0001.KOSTL AS "Centro_costo",
          hrp10001.stext AS "Unidad_Organizativa",
          PA0041.BEGDA AS FECHA_INGRESO_REAL,
          PA0185.ICNUM AS CEDULA,
          PA0001.ENAME,
          ES.ESTADO_REAL AS "ESTADO_SAP",
          PA0000.STAT3 AS "CODIGO_ESTADO",
          CASE 
              WHEN PA0001.ENDDA <> '99991231' 
                  AND PA0001.ENDDA = (
                      SELECT MAX(P6.ENDDA) 
                      FROM sapabap1.PA0001 P6 
                      WHERE P6.PERNR = PA0001.PERNR 
                      AND P6.ENDDA <> '99991231'
                  ) THEN 'DESVINCULACION'
              WHEN PA0001.BEGDA = (
                  SELECT MIN(P7.BEGDA) 
                  FROM sapabap1.PA0001 P7 
                  WHERE P7.PERNR = PA0001.PERNR
              ) THEN 'CONTRATACION'
              WHEN EXISTS (
                  SELECT 1 
                  FROM sapabap1.PA0001 P8 
                  WHERE P8.PERNR = PA0001.PERNR 
                  AND P8.BEGDA < PA0001.BEGDA 
                  AND P8.WERKS <> PA0001.WERKS
              ) THEN 'CAMBIO_TIENDA'
              ELSE 'CAMBIO_DATOS'
          END AS "TIPO_MOVIMIENTO",
          h2.short AS "Jefatura",
          h3.short AS "Gerencia",
          h1.short AS "Posicion"
      FROM sapabap1.PA0001 PA0001
      INNER JOIN sapabap1.PA0002 PA0002 
          ON PA0001.PERNR = PA0002.PERNR
          AND PA0002.ENDDA = '99991231'
          AND PA0002.BEGDA <= CURRENT_DATE
      LEFT JOIN EMPLOYEE_STATUS ES 
          ON ES.PERNR = PA0001.PERNR
      LEFT JOIN sapabap1.T001 
          ON PA0001.BUKRS = T001.BUKRS
      LEFT JOIN sapabap1.hrp1000   
          ON hrp1000.objid = PA0001.PLANS   
          AND hrp1000.otype = 'S' 
          AND hrp1000.plvar = '01'
          AND hrp1000.endda = '99991231'
          AND hrp1000.begda <= CURRENT_DATE
      LEFT JOIN sapabap1.hrp1000 hrp10001  
          ON hrp10001.objid = PA0001.ORGEH    
          AND hrp10001.otype = 'O' 
          AND hrp10001.plvar = '01'
          AND hrp10001.endda = '99991231'
          AND hrp10001.begda <= CURRENT_DATE
      LEFT JOIN sapabap1.PA0041   
          ON PA0041.PERNR = PA0001.PERNR
          AND PA0041.ENDDA = '99991231'
          AND PA0041.DAR01 = '01'
      LEFT JOIN sapabap1.PA0185 PA0185 
          ON PA0185.PERNR = PA0001.PERNR
          AND PA0185.ENDDA = '99991231'
          AND PA0185.SUBTY = '01'
      LEFT JOIN (
          SELECT 
              PERNR,
              STAT3,
              ROW_NUMBER() OVER (PARTITION BY PERNR ORDER BY BEGDA DESC, ENDDA DESC) AS rn_0000
          FROM sapabap1.PA0000
          WHERE BEGDA <= CURRENT_DATE
      ) PA0000 ON PA0001.PERNR = PA0000.PERNR AND PA0000.rn_0000 = 1
      LEFT JOIN sapabap1.hrp1000 AS h1 
          ON PA0001.PLANS = h1.objid
          AND h1.otype = 'S'
          AND h1.plvar = '01'
          AND h1.endda = '99991231'
          AND h1.begda <= CURRENT_DATE
      LEFT JOIN sapabap1.hrp1001 AS rel1 
          ON h1.objid = rel1.objid
          AND rel1.otype = 'S'
          AND rel1.plvar = '01'
          AND rel1.rsign = 'A'
          AND rel1.relat = '002'
          AND rel1.endda = '99991231'
          AND rel1.begda <= CURRENT_DATE
      LEFT JOIN sapabap1.hrp1000 AS h2 
          ON rel1.sobid = h2.objid
          AND h2.otype = rel1.sclas
          AND h2.plvar = '01'
          AND h2.endda = '99991231'
          AND h2.begda <= CURRENT_DATE
      LEFT JOIN sapabap1.hrp1001 AS rel2 
          ON h2.objid = rel2.objid
          AND rel2.otype = 'O'
          AND rel2.plvar = '01'
          AND rel2.rsign = 'A'
          AND rel2.relat = '002'
          AND rel2.endda = '99991231'
          AND rel2.begda <= CURRENT_DATE
      LEFT JOIN sapabap1.hrp1000 AS h3 
          ON rel2.sobid = h3.objid
          AND h3.otype = rel2.sclas
          AND h3.plvar = '01'
          AND h3.endda = '99991231'
          AND h3.begda <= CURRENT_DATE
      WHERE
          PA0001.PERNR = '00000015'
          AND PA0001.BEGDA <= CURRENT_DATE
      ORDER BY PA0001.PERNR, PA0001.BEGDA DESC
    `;

    client.exec(sql, (err, rows) => {
        if (err) {
            console.error('❌ Error ejecutando consulta:', err);
        } else {
            console.log('Resultados obtenidos:');
            console.log(JSON.stringify(rows, null, 2));
        }
        client.disconnect();
    });
});
