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

function formatSapDate(d) {
    if (!d) return null;
    if (d instanceof Date) return d.toISOString().split('T')[0];
    const str = String(d).trim();
    if (str === '99991231' || str === '00000000') return null;
    if (str.length === 8 && /^\d{8}$/.test(str)) {
        return `${str.substring(0, 4)}-${str.substring(4, 6)}-${str.substring(6, 8)}`;
    }
    if (str.includes('-')) return str.split('T')[0];
    return str;
}

const ACTIVE_SQL = `
    SELECT 
        PA0001.BUKRS AS "BUKRS",
        T001.BUTXT AS "BUTXT",
        PA0002.PERNR AS "PERNR",
        PA0002.NACHN AS "APELLIDO_PATERNO",
        PA0002.NAME2 AS "APELLIDO_MATERNO",
        PA0002.VORNA AS "NOMBRE",
        CASE PA0002.GESCH 
            WHEN '1' THEN 'Masculino' 
            WHEN '2' THEN 'Femenino' 
            ELSE 'Otro' 
        END AS "GENERO",
        PA0002.GBDAT AS "FECHANACIMIENTO",
        PA0006.STRAS AS "DIRECCION", 
        PA0006.TELNR AS "TELEFONO", 
        PA0006.LOCAT AS "DIRECCION2", 
        PA0006.ZZ_PROVINCIA,
        NOM_PROVI.BEZEI AS "NOMBRE_PROVINCIA",
        PA0006.ZZ_CANTON,
        NOM_CANTON.BEZEI AS "NOMBRE_CIUDAD",
        PA0001.BEGDA AS "FECHA_INGRESO",
        PA0001.ENDDA AS "FECHA_SALIDA",
        PA0001.PLANS,
        PA0001.STELL,
        PA0001.WERKS,
        T500P.NAME1,
        PA0001.BTRTL,
        T001P.BTEXT,
        hrp1000.stext AS "DESCRIPCION_POSICION",
        PA0001.KOSTL AS "CENTRO_COSTO",
        PA0001.ORGEH,
        PA0001.ANSVH,
        PA0001.VDSK1,
        PA0001.PERSK,
        T503T.PTEXT AS "AREA_PERSONAL",
        hrp10001.stext AS "UNIDAD_ORGANIZATIVA",
        cskt.ktext AS "DESCRIPCION_OPERACION",
        PA0002.FAMST AS "ESTADOCIVIL",
        t502t.FTEXT AS "DESCRIPCION_ESTADO_CIVIL",
        PA0021.FAVOR AS "CONYUGUE",
        PA0021.FANAM AS "CONYUGUE_APELLIDO",
        PA0041.BEGDA AS "FECHA_INGRESO_REAL",
        CASE WHEN PA0001.PERSG='1' THEN 'COLABORADOR'
             WHEN PA0001.PERSG='2' THEN 'ALTA DIRECCION'
             WHEN PA0001.PERSG='3' THEN 'PART-TIME'
             WHEN PA0001.PERSG='4' THEN 'PASANTE'
             WHEN PA0001.PERSG='5' THEN 'SERVICIOS COMPLE'
             WHEN PA0001.PERSG='6' THEN 'JUBILADO' 
        END AS "GRUPO_PERSONAL",
        PA0004.SBGRU AS "GRUPO_INVALIDEZ",
        PA0004.SBPRO AS "GRADO_INVALIDEZ",
        PA0004.SBART AS "CLASE_INVALIDEZ",
        T523T.BTEXT AS "INVALIDEZ",
        PA0185.ICNUM AS "CEDULA",
        T527X.ORGTX,
        PA0001.SNAME,
        PA0001.ENAME,
        PA0105.USRID_LONG AS "MAIL",
        PA0016.CTTYP AS "CLASE_CONTRATO",
        T547S.CTTXT AS "CLASE_CONTRATO_DETALLE",
        PA0002.NATIO AS "NACIONALIDAD",
        '1' AS "ESTADO"
    FROM sapabap1.PA0001 PA0001
    INNER JOIN sapabap1.PA0000 PA0000 
        ON PA0001.PERNR = PA0000.PERNR 
        AND PA0000.STAT2 = '3' 
        AND PA0000.ENDDA >= CURRENT_DATE
    INNER JOIN sapabap1.PA0002 PA0002 
        ON PA0001.PERNR = PA0002.PERNR
    LEFT JOIN sapabap1.T001 ON PA0001.BUKRS = T001.BUKRS
    LEFT JOIN sapabap1.PA0006 ON PA0001.PERNR = PA0006.PERNR AND PA0006.ENDDA >= CURRENT_DATE
    LEFT JOIN sapabap1.hrp1000 ON hrp1000.objid = PA0001.PLANS AND hrp1000.otype = 'S' 
    LEFT JOIN sapabap1.T503T ON T503T.PERSK = PA0001.PERSK AND T503T.SPRSL = 'S' AND T503T.PERSK = 'E5' AND T503T.MANDT = '300'
    LEFT JOIN sapabap1.hrp1000 hrp10001 ON hrp10001.objid = PA0001.orgeh AND hrp10001.otype = 'O' 
    LEFT JOIN sapabap1.cskt ON PA0001.kostl = cskt.kostl AND cskt.datbi = '99991231' AND cskt.spras = 'S'
    LEFT JOIN sapabap1.t502t t502t ON PA0002.famst = t502t.famst AND t502t.SPRSL = 'S' AND t502t.MANDT = '300'
    LEFT JOIN sapabap1.PA0021 ON PA0001.PERNR = PA0021.PERNR AND PA0021.SUBTY = '1' 
    LEFT JOIN sapabap1.PA0041 ON PA0041.PERNR = PA0001.PERNR
    LEFT JOIN sapabap1.PA0185 PA0185 ON (PA0185.PERNR = PA0001.PERNR)
    LEFT JOIN sapabap1.ZHCCEC_T_UBIG_01 NOM_PROVI ON (PA0006.ZZ_PROVINCIA = NOM_PROVI.PROVINCIA AND NOM_PROVI.CANTON = '000000')
    LEFT JOIN sapabap1.ZHCCEC_T_UBIG_01 NOM_CANTON ON (PA0006.ZZ_CANTON = NOM_CANTON.CANTON AND NOM_CANTON.PARROQUIA = '000000')
    LEFT JOIN sapabap1.PA0004 PA0004 ON PA0001.PERNR = PA0004.PERNR AND PA0004.ENDDA >= CURRENT_DATE 
    LEFT JOIN sapabap1.T523T T523T ON T523T.SBART = PA0004.SBART 
    LEFT JOIN sapabap1.T500P T500P ON PA0001.WERKS = T500P.PERSA AND MOLGA = 'EC'
    LEFT JOIN sapabap1.T001P T001P ON PA0001.WERKS = T001P.WERKS AND PA0001.BTRTL = T001P.BTRTL 
    LEFT JOIN sapabap1.T527X T527X ON PA0001.ORGEH = T527X.ORGEH AND T527X.SPRSL = 'S'
    LEFT JOIN sapabap1.PA0105 PA0105 ON PA0105.PERNR = PA0001.PERNR AND PA0105.USRTY = '0012'
    LEFT JOIN sapabap1.PA0016 PA0016 ON PA0016.PERNR = PA0001.PERNR AND PA0016.ENDDA >= CURRENT_DATE
    LEFT JOIN sapabap1.T547S T547S ON T547S.CTTYP = PA0016.CTTYP  
    WHERE PA0001.ENDDA >= CURRENT_DATE
      AND PA0002.ENDDA >= CURRENT_DATE
`;

const INACTIVE_SQL = `
    SELECT 
        PA0001.BUKRS AS "BUKRS",
        T001.BUTXT AS "BUTXT",
        PA0002.PERNR AS "PERNR",
        PA0002.NACHN AS "APELLIDO_PATERNO",
        PA0002.NAME2 AS "APELLIDO_MATERNO",
        PA0002.VORNA AS "NOMBRE",
        CASE PA0002.GESCH 
            WHEN '1' THEN 'Masculino' 
            WHEN '2' THEN 'Femenino' 
            ELSE 'Otro' 
        END AS "GENERO",
        PA0002.GBDAT AS "FECHANACIMIENTO",
        PA0006.STRAS AS "DIRECCION", 
        PA0006.TELNR AS "TELEFONO", 
        PA0006.LOCAT AS "DIRECCION2", 
        PA0006.ZZ_PROVINCIA,
        NOM_PROVI.BEZEI AS "NOMBRE_PROVINCIA",
        PA0006.ZZ_CANTON,
        NOM_CANTON.BEZEI AS "NOMBRE_CIUDAD",
        PA0001.BEGDA AS "FECHA_INGRESO",
        PA0001.ENDDA AS "FECHA_SALIDA",
        PA0001.PLANS,
        PA0001.STELL,
        PA0001.WERKS,
        T500P.NAME1,
        PA0001.BTRTL,
        T001P.BTEXT,
        hrp1000.stext AS "DESCRIPCION_POSICION",
        PA0001.KOSTL AS "CENTRO_COSTO",
        PA0001.ORGEH,
        PA0001.ANSVH,
        PA0001.VDSK1,
        PA0001.PERSK,
        T503T.PTEXT AS "AREA_PERSONAL",
        hrp10001.stext AS "UNIDAD_ORGANIZATIVA",
        cskt.ktext AS "DESCRIPCION_OPERACION",
        PA0002.FAMST AS "ESTADOCIVIL",
        t502t.FTEXT AS "DESCRIPCION_ESTADO_CIVIL",
        PA0021.FAVOR AS "CONYUGUE",
        PA0021.FANAM AS "CONYUGUE_APELLIDO",
        PA0041.BEGDA AS "FECHA_INGRESO_REAL",
        CASE WHEN PA0001.PERSG='1' THEN 'COLABORADOR'
             WHEN PA0001.PERSG='2' THEN 'ALTA DIRECCION'
             WHEN PA0001.PERSG='3' THEN 'PART-TIME'
             WHEN PA0001.PERSG='4' THEN 'PASANTE'
             WHEN PA0001.PERSG='5' THEN 'SERVICIOS COMPLE'
             WHEN PA0001.PERSG='6' THEN 'JUBILADO' 
        END AS "GRUPO_PERSONAL",
        PA0004.SBGRU AS "GRUPO_INVALIDEZ",
        PA0004.SBPRO AS "GRADO_INVALIDEZ",
        PA0004.SBART AS "CLASE_INVALIDEZ",
        T523T.BTEXT AS "INVALIDEZ",
        PA0185.ICNUM AS "CEDULA",
        T527X.ORGTX,
        PA0001.SNAME,
        PA0001.ENAME,
        '0' AS "ESTADO"
    FROM sapabap1.PA0000 PA0000
    INNER JOIN sapabap1.PA0001 PA0001 
        ON PA0000.PERNR = PA0001.PERNR 
        AND PA0000.ENDDA = PA0001.ENDDA
    INNER JOIN sapabap1.PA0002 PA0002 ON PA0000.PERNR = PA0002.PERNR
    LEFT JOIN sapabap1.T001 ON PA0001.BUKRS = T001.BUKRS
    LEFT JOIN sapabap1.PA0006 ON PA0000.PERNR = PA0006.PERNR AND PA0006.ENDDA >= CURRENT_DATE
    LEFT JOIN sapabap1.hrp1000 ON hrp1000.objid = PA0001.PLANS AND hrp1000.otype = 'S' 
    LEFT JOIN sapabap1.T503T ON T503T.PERSK = PA0001.PERSK AND T503T.SPRSL = 'S' AND T503T.MANDT = '300'
    LEFT JOIN sapabap1.hrp1000 hrp10001 ON hrp10001.objid = PA0001.orgeh AND hrp10001.otype = 'O' 
    LEFT JOIN sapabap1.cskt ON PA0001.kostl = cskt.kostl AND cskt.datbi = '99991231' AND cskt.spras = 'S'
    LEFT JOIN sapabap1.t502t t502t ON PA0002.famst = t502t.famst AND t502t.SPRSL = 'S' AND t502t.MANDT = '300'
    LEFT JOIN sapabap1.PA0021 ON PA0000.PERNR = PA0021.PERNR AND PA0021.SUBTY = '1' 
    LEFT JOIN sapabap1.PA0041 ON PA0041.PERNR = PA0000.PERNR
    LEFT JOIN sapabap1.PA0185 PA0185 ON PA0185.PERNR = PA0000.PERNR
    LEFT JOIN sapabap1.ZHCCEC_T_UBIG_01 NOM_PROVI ON PA0006.ZZ_PROVINCIA = NOM_PROVI.PROVINCIA AND NOM_PROVI.CANTON = '000000'
    LEFT JOIN sapabap1.ZHCCEC_T_UBIG_01 NOM_CANTON ON PA0006.ZZ_CANTON = NOM_CANTON.CANTON AND NOM_CANTON.PARROQUIA = '000000'
    LEFT JOIN sapabap1.PA0004 PA0004 ON PA0000.PERNR = PA0004.PERNR AND PA0004.ENDDA >= CURRENT_DATE 
    LEFT JOIN sapabap1.T523T T523T ON T523T.SBART = PA0004.SBART 
    LEFT JOIN sapabap1.T500P T500P ON PA0001.WERKS = T500P.PERSA AND T500P.MOLGA = 'EC'
    LEFT JOIN sapabap1.T001P T001P ON PA0001.WERKS = T001P.WERKS AND PA0001.BTRTL = T001P.BTRTL 
    LEFT JOIN sapabap1.T527X T527X ON PA0001.ORGEH = T527X.ORGEH AND T527X.SPRSL = 'S'
    WHERE PA0000.STAT2 = '0' 
      AND PA0000.ENDDA >= CURRENT_DATE
`;

function mapRow(row) {
    const rawId = String(row.CEDULA || row.cedula || row.PERNR || '').trim();
    if (!rawId) return null;

    const apellido = `${row.APELLIDO_PATERNO || ''} ${row.APELLIDO_MATERNO || ''}`.trim();
    const position = row.DESCRIPCION_POSICION || row.DESCRIPCION_OPERACION || row.GRUPO_PERSONAL || 'Colaborador';
    const entryDate = formatSapDate(row.FECHA_INGRESO_REAL || row.FECHA_INGRESO) || new Date().toISOString().split('T')[0];
    const region = row.NOMBRE_PROVINCIA || row.NAME1 || row.ZZ_PROVINCIA || '';
    const ciudad = row.NOMBRE_CIUDAD || row.BTEXT || '';
    const departamento = row.ORGTX || row.UNIDAD_ORGANIZATIVA || '';
    const responsable = row.SNAME || row.ENAME || '';
    const pais = row.BUTXT || 'SUPERDEPORTE S.A.';
    const estado = String(row.ESTADO || '1');

    return {
        id: rawId,
        codigo_sap: String(row.PERNR || '').trim(),
        name: String(row.NOMBRE || 'Sin Nombre').trim(),
        apellido: apellido || ' ',
        position: position || 'Colaborador',
        entry_date: entryDate,
        region: region || null,
        ciudad: ciudad || null,
        departamento: departamento || null,
        responsable: responsable || null,
        pais: pais || 'Ecuador',
        estado: estado
    };
}

async function runSync() {
    const syncAll = process.argv.includes('--all');
    console.log('=====================================================');
    console.log(`🚀 SINCRONIZADOR SAP HANA -> SUPABASE`);
    console.log(`📡 Servidor SAP: ${sapHost}:${sapPort} (Esquema: ${sapSchema})`);
    console.log(`🌐 Destino Supabase: ${supabaseUrl}`);
    console.log(`🎯 Modo: ${syncAll ? 'TODOS (Activos + Inactivos)' : 'SOLO ACTIVOS'}`);
    console.log('=====================================================');

    const client = hana.createConnection();
    const connConfig = {
        serverNode: `${sapHost}:${sapPort}`,
        uid: sapUser,
        pwd: sapPassword,
        currentSchema: sapSchema,
        autoReconnect: true
    };

    client.connect(connConfig, async (err) => {
        if (err) {
            console.error('❌ Error de red conectando a SAP HANA:', err.message);
            console.error('👉 Asegúrate de estar conectado a la red local de la oficina o VPN (172.1.2.10).');
            process.exit(1);
        }

        console.log('✅ Conexión establecida con SAP HANA.');
        console.log('⏳ Extrayendo registros activos...');

        client.exec(ACTIVE_SQL, async (err1, activeRows) => {
            if (err1) {
                console.error('❌ Error ejecutando consulta de activos:', err1);
                client.disconnect();
                process.exit(1);
            }

            console.log(`📊 Empleados activos extraídos: ${activeRows.length}`);
            let allRows = [...activeRows];

            if (syncAll) {
                console.log('⏳ Extrayendo registros inactivos...');
                client.exec(INACTIVE_SQL, async (err2, inactiveRows) => {
                    client.disconnect();
                    if (err2) {
                        console.error('❌ Error extrayendo inactivos:', err2);
                    } else {
                        console.log(`📊 Empleados inactivos extraídos: ${inactiveRows.length}`);
                        allRows = [...allRows, ...inactiveRows];
                    }
                    await processAndUpload(allRows);
                });
            } else {
                client.disconnect();
                await processAndUpload(allRows);
            }
        });
    });
}

async function processAndUpload(rows) {
    console.log('⏳ Mapeando y depurando duplicados...');
    const empMap = new Map();

    for (const r of rows) {
        const mapped = mapRow(r);
        if (mapped && mapped.id) {
            if (!empMap.has(mapped.id) || mapped.estado === '1') {
                empMap.set(mapped.id, mapped);
            }
        }
    }

    const employees = Array.from(empMap.values());
    console.log(`📦 Total de registros únicos listos para Supabase: ${employees.length}`);

    // Si estamos sincronizando la nómina activa, desactivar preventivamente en Supabase para dar de baja a los que ya no están en SAP
    console.log('⏳ Aplicando baja lógica preventiva en Supabase (estado = 0)...');
    const { error: deactivateErr } = await supabase
        .from('digi_employees')
        .update({ estado: '0' })
        .eq('estado', '1');

    if (deactivateErr) {
        console.warn('Aviso en baja preventiva:', deactivateErr.message);
    }

    const CHUNK_SIZE = 500;
    let saved = 0;

    for (let i = 0; i < employees.length; i += CHUNK_SIZE) {
        const chunk = employees.slice(i, i + CHUNK_SIZE);
        const { error } = await supabase
            .from('digi_employees')
            .upsert(chunk, { onConflict: 'id' });

        if (error) {
            console.error(`❌ Error guardando lote ${i} - ${i + chunk.length}:`, error);
            process.exit(1);
        }

        saved += chunk.length;
        const percent = Math.round((saved / employees.length) * 100);
        process.stdout.write(`\r💾 Progreso guardado en Supabase: ${saved}/${employees.length} (${percent}%)`);
    }

    console.log('\n\n🎉 ¡Sincronización completada con éxito en Supabase!');
    process.exit(0);
}

runSync();
