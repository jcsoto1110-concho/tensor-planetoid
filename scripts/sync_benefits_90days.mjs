import hana from '@sap/hana-client';
import { createClient } from '@supabase/supabase-js';
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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://zfbrwcflzbauycszajpc.supabase.co';
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const sapHost = env.SAP_HANA_HOST || '172.1.2.10';
const sapPort = env.SAP_HANA_PORT || '30015';
const sapUser = env.SAP_HANA_USER || 'USERBI';
const sapPassword = env.SAP_HANA_PASSWORD || 'MaraBI2021*';
const sapSchema = env.SAP_HANA_SCHEMA || 'sapabap1';

const supabase = createClient(supabaseUrl, supabaseKey);

function parseSapDate(d) {
    if (!d) return null;
    if (d instanceof Date) return d;
    const str = String(d).trim();
    if (str === '99991231' || str === '00000000') return null;
    if (str.length === 8 && /^\d{8}$/.test(str)) {
        const y = parseInt(str.substring(0, 4), 10);
        const m = parseInt(str.substring(4, 6), 10) - 1;
        const day = parseInt(str.substring(6, 8), 10);
        return new Date(y, m, day);
    }
    if (str.includes('-')) {
        const parts = str.split('T')[0].split('-');
        return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    }
    return new Date(str);
}

function formatSqlDate(d) {
    if (!d) return null;
    const date = parseSapDate(d);
    if (!date || isNaN(date.getTime())) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

const SAP_QUERY_90_DAYS = `
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
    WHERE P1.ENDDA = '99991231' OR P1.BEGDA <= CURRENT_DATE
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
    PA0002.GBDAT AS FECHANACIMIENTO,
    PA0002.GBJHR AS ANIONACI,
    PA0002.GBMON AS MESNACI,
    PA0002.GBTAG AS DIANACI,
    PA0006.STRAS AS "Direccion", 
    PA0006.TELNR AS "Telefono", 
    PA0006.LOCAT AS "Direccion2", 
    PA0006.ZZ_PROVINCIA,
    NOM_PROVI.BEZEI AS NOMBRE_PROVINCIA,
    PA0006.ZZ_CANTON,
    NOM_CANTON.BEZEI AS NOMBRE_CIUDAD,
    PA0001.BEGDA AS "Fecha_Ingreso",
    CASE 
        WHEN PA0001.ENDDA <> '99991231' THEN PA0001.ENDDA 
        ELSE NULL 
    END AS "Fecha_Salida",
    PA0001.AEDTM AS "Fecha_Registro_Nomina",
    PA0001.PLANS,
    PA0001.STELL,
    PA0001.WERKS,
    T500P.NAME1,
    PA0001.BTRTL,
    T001P.BTEXT,
    hrp1000.stext AS DESCRIPCION_POSICION,
    PA0001.KOSTL AS "Centro_costo",
    PA0001.ORGEH,
    PA0001.ANSVH,
    PA0001.VDSK1,
    PA0001.PERSK,
    T503T.PTEXT AS "Are_Personal",
    hrp10001.stext AS "Unidad_Organizativa",
    cskt.ktext AS "Descripcion_operacion",
    PA0002.FAMST AS ESTADOCIVIL,
    t502t.FTEXT AS DESCRIPCION_ESTADO_CIVIL,
    PA0021.FAVOR AS "Conyugue",
    PA0021.FANAM AS "Conyugue_Apellido",
    PA0041.BEGDA AS FECHA_INGRESO_REAL,
    CASE WHEN PA0001.PERSG = '1' THEN 'COLABORADOR'
         WHEN PA0001.PERSG = '2' THEN 'ALTA DIRECION'
         WHEN PA0001.PERSG = '3' THEN 'PART-TIME'
         WHEN PA0001.PERSG = '4' THEN 'PASANTE'
         WHEN PA0001.PERSG = '5' THEN 'SERVICIOS COMPLE'
         WHEN PA0001.PERSG = '6' THEN 'JUBILADO' 
    END AS GRUPO_PERSONAL,
    PA0004.SBGRU AS GRUPO_INVALIDEZ,
    PA0004.SBPRO AS GRADO_INVALIDEZ,
    PA0004.SBART AS CLASE_INVALIDEZ,
    T523T.BTEXT AS INVALIDEZ,
    PA0185.ICNUM AS CEDULA,
    PA0001.SNAME,
    PA0001.ENAME,
    PA0105_EMAIL.EMAILS AS "Correos",
    PA0105_TEL.TELEFONOS AS "Telefonos_Nomina",
    PA0016.CTTYP AS CLASE_CONTRATO,
    T547S.CTTXT AS CLASE_CONTRATO_DETALLE,
    PA0002.NATIO AS NACIONALIDAD,
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
LEFT JOIN sapabap1.PA0006  
    ON PA0001.PERNR = PA0006.PERNR 
    AND PA0006.ENDDA = '99991231'
    AND PA0006.SUBTY = '1'
LEFT JOIN sapabap1.hrp1000   
    ON hrp1000.objid = PA0001.PLANS   
    AND hrp1000.otype = 'S' 
    AND hrp1000.plvar = '01'
    AND hrp1000.endda = '99991231'
    AND hrp1000.begda <= CURRENT_DATE
LEFT JOIN sapabap1.T503T   
    ON T503T.PERSK = PA0001.PERSK   
    AND T503T.SPRSL = 'ES'
    AND T503T.MANDT = '300'
LEFT JOIN sapabap1.hrp1000 hrp10001  
    ON hrp10001.objid = PA0001.ORGEH    
    AND hrp10001.otype = 'O' 
    AND hrp10001.plvar = '01'
    AND hrp10001.endda = '99991231'
    AND hrp10001.begda <= CURRENT_DATE
LEFT JOIN sapabap1.cskt 
    ON PA0001.kostl = cskt.kostl 
    AND cskt.datbi = '99991231' 
    AND cskt.spras = 'ES'
LEFT JOIN sapabap1.t502t t502t 
    ON PA0002.famst = t502t.famst 
    AND t502t.SPRSL = 'ES'
    AND t502t.MANDT = '300'
LEFT JOIN sapabap1.PA0021 
    ON PA0001.PERNR = PA0021.PERNR 
    AND PA0021.SUBTY = '1'
    AND PA0021.ENDDA = '99991231'
LEFT JOIN sapabap1.PA0041   
    ON PA0041.PERNR = PA0001.PERNR
    AND PA0041.ENDDA = '99991231'
    AND PA0041.DAR01 = '01'
LEFT JOIN sapabap1.PA0185 PA0185 
    ON PA0185.PERNR = PA0001.PERNR
    AND PA0185.ENDDA = '99991231'
    AND PA0185.SUBTY = '01'
LEFT JOIN sapabap1.ZHCCEC_T_UBIG_01 NOM_PROVI 
    ON PA0006.ZZ_PROVINCIA = NOM_PROVI.PROVINCIA 
    AND NOM_PROVI.CANTON = '000000'
LEFT JOIN sapabap1.ZHCCEC_T_UBIG_01 NOM_CANTON 
    ON PA0006.ZZ_CANTON = NOM_CANTON.CANTON 
    AND NOM_CANTON.PARROQUIA = '000000'
    AND NOM_CANTON.PROVINCIA = PA0006.ZZ_PROVINCIA
LEFT JOIN sapabap1.PA0004 PA0004 
    ON PA0001.PERNR = PA0004.PERNR 
    AND PA0004.ENDDA = '99991231'
LEFT JOIN sapabap1.T523T T523T 
    ON T523T.SBART = PA0004.SBART
    AND T523T.SPRSL = 'ES'
LEFT JOIN sapabap1.T500P T500P 
    ON PA0001.WERKS = T500P.PERSA 
    AND T500P.MOLGA = 'EC'
LEFT JOIN sapabap1.T001P T001P 
    ON PA0001.WERKS = T001P.WERKS 
    AND PA0001.BTRTL = T001P.BTRTL
LEFT JOIN sapabap1.T527X T527X 
    ON PA0001.ORGEH = T527X.ORGEH  
    AND T527X.SPRSL = 'ES'
LEFT JOIN (
    SELECT 
        PERNR,
        STRING_AGG(USRID_LONG, '; ' ORDER BY USRID_LONG) AS EMAILS
    FROM sapabap1.PA0105
    WHERE USRTY IN ('0010', '0012')
    AND ENDDA = '99991231'
    GROUP BY PERNR
) PA0105_EMAIL ON PA0105_EMAIL.PERNR = PA0001.PERNR
LEFT JOIN (
    SELECT 
        PERNR,
        STRING_AGG(USRID, '; ' ORDER BY USRID) AS TELEFONOS
    FROM sapabap1.PA0105
    WHERE USRTY = '0020'
    AND ENDDA = '99991231'
    GROUP BY PERNR
) PA0105_TEL ON PA0105_TEL.PERNR = PA0001.PERNR
LEFT JOIN sapabap1.PA0016 PA0016 
    ON PA0016.PERNR = PA0001.PERNR  
    AND PA0016.ENDDA = '99991231'
LEFT JOIN sapabap1.T547S T547S 
    ON T547S.CTTYP = PA0016.CTTYP
    AND T547S.SPRSL = 'ES'
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
    PA0001.BEGDA <= CURRENT_DATE
    AND (PA0001.BUKRS IS NULL OR PA0001.BUKRS NOT IN ('E100', 'E101'))
ORDER BY PA0001.PERNR, PA0001.BEGDA DESC
`;

/**
 * Función que clasifica el cupo según las reglas de negocio del usuario:
 * - Tienda y bodegas (CD): $1,000
 * - Adm Asistencial / Mayoristas: $1,500
 * - Jefaturas y Supervisión: $2,500
 * - Gerencias: $6,000
 * - Pasantes: NO APLICA
 */
function calcularCupo(row) {
    const posicion = String(row.Posicion || row.DESCRIPCION_POSICION || '').toUpperCase();
    const gerencia = String(row.Gerencia || '').toUpperCase();
    const jefatura = String(row.Jefatura || '').toUpperCase();
    const unidadOrg = String(row.Unidad_Organizativa || '').toUpperCase();
    const operacion = String(row.Descripcion_operacion || '').toUpperCase();
    const centroCosto = String(row.Centro_costo || '').toUpperCase();
    const areaPersonal = String(row.Are_Personal || '').toUpperCase();
    const grupoPersonal = String(row.GRUPO_PERSONAL || '').toUpperCase();

    // 1. Exclusión obligatoria: No aplica a pasantes
    if (grupoPersonal.includes('PASANTE') || posicion.includes('PASANTE')) {
        return { aplica: false, tipo: 'PASANTE', cupo: 0, motivo: 'Pasante no aplica al beneficio' };
    }

    // 2. Gerencias: $6,000
    if (gerencia || posicion.includes('GERENTE') || posicion.includes('GERENCIA')) {
        return { aplica: true, tipo: 'GERENCIA', cupo: 6000.00 };
    }

    // 3. Jefaturas y Supervisión: $2,500
    if (jefatura || posicion.includes('JEFE') || posicion.includes('JEFATURA') || posicion.includes('SUPERVISOR') || posicion.includes('SUPERVISION')) {
        return { aplica: true, tipo: 'JEFATURA_SUPERVISION', cupo: 2500.00 };
    }

    // 4. Administrativo Asistencial / Mayoristas: $1,500
    // "solo para Adm aplica código de Mayoristas con los mismos valores asignados"
    const esAdmin = unidadOrg.includes('ADMIN') || 
                    centroCosto.startsWith('ADM') || 
                    areaPersonal.includes('ADMIN') ||
                    posicion.includes('ASISTENTE') || 
                    posicion.includes('ANALISTA') ||
                    posicion.includes('COORDINADOR') ||
                    operacion.includes('MAYORISTA');

    if (esAdmin) {
        return { aplica: true, tipo: 'ADM_ASISTENCIAL', cupo: 1500.00 };
    }

    // 5. Tiendas y Bodegas (CD): $1,000
    return { aplica: true, tipo: 'TIENDA_BODEGA', cupo: 1000.00 };
}

async function runSync() {
    console.log('=====================================================');
    console.log('🎁 SINCRONIZADOR BENEFICIO 90 DÍAS (SAP -> SUPABASE)');
    console.log(`📡 Servidor SAP: ${sapHost}:${sapPort}`);
    console.log(`🌐 Supabase URL: ${supabaseUrl}`);
    console.log('=====================================================');

    const client = hana.createConnection();
    const connectionParams = {
        serverNode: `${sapHost}:${sapPort}`,
        uid: sapUser,
        pwd: sapPassword,
        currentSchema: sapSchema,
        autoReconnect: true
    };

    try {
        console.log('⏳ Conectando a SAP HANA...');
        await new Promise((resolve, reject) => {
            client.connect(connectionParams, (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        console.log('✅ Conexión a SAP HANA establecida.');

        console.log('⏳ Ejecutando consulta de empleados en SAP...');
        const rows = await new Promise((resolve, reject) => {
            client.exec(SAP_QUERY_90_DAYS, [], (err, res) => {
                if (err) return reject(err);
                resolve(res);
            });
        });
        console.log(`📊 Total registros obtenidos de SAP: ${rows.length}`);

        // Desconectar cliente SAP
        client.disconnect();

        // Obtener registros ya aprobados/procesados en Supabase para no sobreescribir su estado
        const { data: existingBenefits, error: fetchErr } = await supabase
            .from('digi_employee_benefits_90d')
            .select('pernr, estado, cupo_aprobado, discount_id_ws, qr_token, email_sent');

        const existingMap = new Map();
        if (existingBenefits) {
            existingBenefits.forEach(b => existingMap.set(b.pernr, b));
        }

        const today = new Date();
        const eligibleMap = new Map();
        let skippedPasantes = 0;
        let skippedLessThan90 = 0;
        let skippedNotActive = 0;

        for (const row of rows) {
            // Validar estado activo
            const estadoSap = String(row.ESTADO_SAP || '').toUpperCase();
            if (estadoSap !== 'ACTIVO') {
                skippedNotActive++;
                continue;
            }

            const pernr = String(row.Num_Per || '').trim();
            const cedula = String(row.CEDULA || '').trim();
            if (!pernr || !cedula) continue;

            // Si ya procesamos el registro más reciente de este pernr (por BEGDA DESC), omitir duplicados
            if (eligibleMap.has(pernr)) continue;

            // Condición solicitada: ingresados a partir del 1 de julio de 2026
            const fechaCorteJulio2026 = new Date(2026, 6, 1); // 01/07/2026

            // Prioridad a FECHA_INGRESO_REAL (fecha real de ingreso a la compañía)
            const rawFechaIngreso = row.FECHA_INGRESO_REAL || row.Fecha_Ingreso;
            const parsedIngreso = parseSapDate(rawFechaIngreso);
            if (!parsedIngreso || isNaN(parsedIngreso.getTime())) continue;

            // Descartar si ingresó antes del 1 de julio de 2026
            if (parsedIngreso < fechaCorteJulio2026) continue;

            // Calcular días laborados
            const diffMs = today.getTime() - parsedIngreso.getTime();
            const diasLaborados = Math.floor(diffMs / (1000 * 60 * 60 * 24));

            // Condición: 90 días o más
            if (diasLaborados < 90) {
                skippedLessThan90++;
                continue;
            }

            // Clasificar cupo y verificar exclusiones
            const { aplica, tipo, cupo, motivo } = calcularCupo(row);
            if (!aplica) {
                skippedPasantes++;
                continue;
            }

            const existing = existingMap.get(pernr);

            // Obtener primer correo válido si hay varios separados por coma o punto y coma
            let email = '';
            if (row.Correos) {
                const parts = String(row.Correos).split(/[;,]/).map(s => s.trim()).filter(Boolean);
                if (parts.length > 0) email = parts[0];
            }

            const nombreCompleto = `${row.Nombre || ''} ${row.Apellido_Paterno || ''} ${row.Apellido_Materno || ''}`.replace(/\s+/g, ' ').trim();

            const record = {
                pernr,
                cedula,
                nombre_completo: nombreCompleto,
                genero: row.Genero || null,
                email: email || null,
                telefono: row.Telefonos_Nomina || row.Telefono || null,
                direccion: row.Direccion || null,
                ciudad: row.NOMBRE_CIUDAD || null,
                posicion: row.Posicion || row.DESCRIPCION_POSICION || null,
                operacion: row.Descripcion_operacion || null,
                jefatura: row.Jefatura || null,
                gerencia: row.Gerencia || null,
                grupo_personal: row.GRUPO_PERSONAL || null,
                fecha_ingreso: formatSqlDate(row.Fecha_Ingreso),
                fecha_ingreso_real: formatSqlDate(row.FECHA_INGRESO_REAL) || formatSqlDate(row.Fecha_Ingreso),
                dias_laborados: diasLaborados,
                tipo_operacion: tipo,
                cupo_sugerido: cupo,
                cupo_aprobado: existing ? existing.cupo_aprobado : cupo,
                estado: existing ? existing.estado : 'PENDIENTE',
                discount_id_ws: existing?.discount_id_ws || null,
                empresas: existing?.empresas || ['E200', 'E100', 'E101'],
                qr_token: existing?.qr_token || null,
                email_sent: existing ? existing.email_sent : false,
                updated_at: new Date().toISOString()
            };

            eligibleMap.set(pernr, record);
        }

        const eligibleRecords = Array.from(eligibleMap.values());

        console.log(`\n🎯 Resumen de filtrado:`);
        console.log(`- Inactivos descartados: ${skippedNotActive}`);
        console.log(`- Menos de 90 días descartados: ${skippedLessThan90}`);
        console.log(`- Pasantes descartados: ${skippedPasantes}`);
        console.log(`- Colaboradores únicos elegibles (>= 90 días): ${eligibleRecords.length}`);

        if (eligibleRecords.length === 0) {
            console.log('ℹ️ No hay colaboradores para sincronizar hoy.');
            return;
        }

        console.log('\n⏳ Guardando registros en Supabase (digi_employee_benefits_90d)...');
        
        // Guardar en lotes de 100 para evitar límites de payload
        const batchSize = 100;
        let inserted = 0;

        for (let i = 0; i < eligibleRecords.length; i += batchSize) {
            const batch = eligibleRecords.slice(i, i + batchSize);
            const { error: upsertErr } = await supabase
                .from('digi_employee_benefits_90d')
                .upsert(batch, { onConflict: 'pernr' });

            if (upsertErr) {
                console.error(`❌ Error al insertar lote ${i}-${i + batch.length}:`, upsertErr.message);
                throw upsertErr;
            }
            inserted += batch.length;
            process.stdout.write(`\r✅ Guardados ${inserted} de ${eligibleRecords.length}...`);
        }

        console.log(`\n✨ ¡Sincronización completada exitosamente! Total procesados: ${inserted}`);

    } catch (error) {
        console.error('❌ Error en proceso de sincronización:', error);
        process.exit(1);
    }
}

runSync();
