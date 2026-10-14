import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { executeSapQuery } from '@/lib/sapdb';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function getSupabase() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zfbrwcflzbauycszajpc.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    return createClient(supabaseUrl, supabaseKey);
}

function parseSapDate(d: any): Date | null {
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

function formatSqlDate(d: any): string | null {
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
            ELSE 'OTRO'
        END AS ESTADO_REAL
    FROM sapabap1.PA0001 P1
    GROUP BY PERNR
)
SELECT 
    PA0001.PERNR AS "Num_Per",
    PA0002.VORNA AS "Nombre",
    PA0002.NACHN AS "Apellido_Paterno",
    PA0002.NAME2 AS "Apellido_Materno",
    hrp1000.stext AS "Posicion",
    hrp10001.stext AS "Gerencia",
    hrp10002.stext AS "Jefatura",
    CASE PA0002.GESCH 
        WHEN '1' THEN 'MASCULINO' 
        WHEN '2' THEN 'FEMENINO' 
        ELSE 'OTRO' 
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
             OR (ES.ESTADO_REAL = 'CESE' AND PA0001.ENDDA = '99991231') THEN '0'
        WHEN PA0001.ENDDA = '99991231' AND ES.ESTADO_REAL = 'ACTIVO' THEN '1'
        ELSE '0'
    END AS "ESTADO_DIGI"
FROM sapabap1.PA0001 PA0001
LEFT JOIN EMPLOYEE_STATUS ES ON PA0001.PERNR = ES.PERNR
LEFT JOIN sapabap1.PA0002 PA0002 ON PA0001.PERNR = PA0002.PERNR
LEFT JOIN sapabap1.PA0006 PA0006 
    ON PA0001.PERNR = PA0006.PERNR 
    AND PA0006.SUBTY = '1'
    AND PA0006.ENDDA = '99991231'
LEFT JOIN sapabap1.ZHCCEC_T_UBIG_01 NOM_PROVI 
    ON PA0006.ZZ_PROVINCIA = NOM_PROVI.PROVINCIA 
    AND NOM_PROVI.CANTON = '000000'
LEFT JOIN sapabap1.ZHCCEC_T_UBIG_01 NOM_CANTON 
    ON PA0006.ZZ_CANTON = NOM_CANTON.CANTON 
    AND NOM_CANTON.PARROQUIA = '000000'
LEFT JOIN sapabap1.hrp1000 hrp1000 
    ON PA0001.PLANS = hrp1000.objid 
    AND hrp1000.otype = 'S' 
    AND hrp1000.plvar = '01' 
    AND hrp1000.endda = '99991231' 
    AND hrp1000.begda <= CURRENT_DATE
LEFT JOIN sapabap1.T500P T500P 
    ON PA0001.WERKS = T500P.PERSA 
    AND T500P.MOLGA = 'EC'
LEFT JOIN sapabap1.T001P T001P 
    ON PA0001.WERKS = T001P.WERKS 
    AND PA0001.BTRTL = T001P.BTRTL
LEFT JOIN sapabap1.cskt cskt 
    ON PA0001.KOSTL = cskt.KOSTL 
    AND cskt.DATBI = '99991231' 
    AND cskt.SPRAS = 'S'
LEFT JOIN sapabap1.T503T T503T 
    ON T503T.PERSK = PA0001.PERSK 
    AND T503T.SPRSL = 'S'
LEFT JOIN sapabap1.hrp1000 hrp10001 
    ON PA0001.ORGEH = hrp10001.objid 
    AND hrp10001.otype = 'O' 
    AND hrp10001.plvar = '01' 
    AND hrp10001.endda = '99991231' 
    AND hrp10001.begda <= CURRENT_DATE
LEFT JOIN sapabap1.hrp1000 hrp10002 
    ON PA0001.STELL = hrp10002.objid 
    AND hrp10002.otype = 'C' 
    AND hrp10002.plvar = '01' 
    AND hrp10002.endda = '99991231' 
    AND hrp10002.begda <= CURRENT_DATE
LEFT JOIN sapabap1.t502t t502t 
    ON PA0002.FAMST = t502t.FAMST 
    AND t502t.SPRSL = 'S'
LEFT JOIN sapabap1.PA0021 PA0021 
    ON PA0001.PERNR = PA0021.PERNR 
    AND PA0021.SUBTY = '1'
    AND PA0021.ENDDA = '99991231'
LEFT JOIN sapabap1.PA0041 PA0041 
    ON PA0001.PERNR = PA0041.PERNR 
    AND PA0041.ENDDA = '99991231'
LEFT JOIN sapabap1.PA0004 PA0004 
    ON PA0001.PERNR = PA0004.PERNR 
    AND PA0004.ENDDA = '99991231'
LEFT JOIN sapabap1.T523T T523T 
    ON PA0004.SBART = T523T.SBART 
    AND T523T.SPRSL = 'S'
LEFT JOIN sapabap1.PA0185 PA0185 
    ON PA0001.PERNR = PA0185.PERNR 
    AND PA0185.SUBTY = '01'
    AND PA0185.ENDDA = '99991231'
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
WHERE
    PA0001.BEGDA <= CURRENT_DATE
    AND (PA0001.BUKRS IS NULL OR PA0001.BUKRS NOT IN ('E100', 'E101'))
ORDER BY PA0001.PERNR, PA0001.BEGDA DESC
`;

function calcularCupo(row: any) {
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
    if (
        posicion.includes('GERENTE') || 
        posicion.includes('GERENCIA') || 
        gerencia.includes('GERENCIA GENERAL') || 
        posicion.includes('DIRECTOR') || 
        posicion.includes('VICEPRESIDENTE')
    ) {
        return { aplica: true, tipo: 'GERENCIA', cupo: 6000.00, motivo: 'Gerencias y Directores' };
    }

    // 3. Jefaturas y Supervisión: $2,500
    if (
        posicion.includes('JEFE') || 
        posicion.includes('JEFATURA') || 
        posicion.includes('SUPERVISOR') || 
        posicion.includes('SUPERVISION') || 
        posicion.includes('COORDINADOR') || 
        posicion.includes('LIDER') || 
        jefatura.includes('JEFATURA')
    ) {
        return { aplica: true, tipo: 'JEFATURA_SUPERVISION', cupo: 2500.00, motivo: 'Jefaturas, Supervisión y Coordinación' };
    }

    // 4. Adm Asistencial y Mayoristas: $1,500
    const isMayoristas = operacion.includes('MAYORISTA') || unidadOrg.includes('MAYORISTA') || centroCosto.includes('MAYORISTA');
    const isAdministrativo = 
        areaPersonal.includes('ADMIN') || 
        unidadOrg.includes('ADMIN') || 
        posicion.includes('ASISTENTE') || 
        posicion.includes('ANALISTA') || 
        posicion.includes('AUXILIAR ADMIN') || 
        posicion.includes('RECEPCION') || 
        posicion.includes('SECRETAR');

    if (isMayoristas || isAdministrativo) {
        return { aplica: true, tipo: 'ADM_ASISTENCIAL', cupo: 1500.00, motivo: isMayoristas ? 'Canal Mayoristas' : 'Administrativo Asistencial' };
    }

    // 5. Por defecto: Tienda y Bodegas (CD): $1,000
    return { aplica: true, tipo: 'TIENDA_BODEGA', cupo: 1000.00, motivo: 'Tienda y Bodegas (CD)' };
}

// 1. GET: Listar registros de beneficios con filtros y estadísticas
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const status = searchParams.get('status') || 'ALL';
        const search = (searchParams.get('search') || '').trim().toLowerCase();

        const supabase = getSupabase();

        let query = supabase
            .from('digi_employee_benefits_90d')
            .select('*')
            .order('dias_laborados', { ascending: false });

        if (status !== 'ALL') {
            query = query.eq('estado', status);
        }

        const { data, error } = await query;
        if (error) {
            console.error('Error al consultar digi_employee_benefits_90d:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        const allRecords = data || [];

        // Filtrado por búsqueda en memoria
        const filtered = allRecords.filter(r => {
            if (!search) return true;
            return (
                (r.nombre_completo && r.nombre_completo.toLowerCase().includes(search)) ||
                (r.cedula && r.cedula.includes(search)) ||
                (r.pernr && r.pernr.includes(search)) ||
                (r.posicion && r.posicion.toLowerCase().includes(search)) ||
                (r.ciudad && r.ciudad.toLowerCase().includes(search))
            );
        });

        // Métricas
        const stats = {
            total: allRecords.length,
            pendientes: allRecords.filter(r => r.estado === 'PENDIENTE').length,
            aprobados: allRecords.filter(r => r.estado === 'APROBADO').length,
            rechazados: allRecords.filter(r => r.estado === 'RECHAZADO').length,
            montoTotalAprobado: allRecords
                .filter(r => r.estado === 'APROBADO')
                .reduce((acc, curr) => acc + (Number(curr.cupo_aprobado) || 0), 0)
        };

        return NextResponse.json({
            success: true,
            data: filtered,
            stats
        });
    } catch (e: any) {
        console.error('Error en GET /api/benefits-90-days:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

// 2. PUT: Modificar cupo u observaciones
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, cupo_aprobado, observaciones } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID es requerido' }, { status: 400 });
        }

        const supabase = getSupabase();
        const updateData: any = { updated_at: new Date().toISOString() };

        if (cupo_aprobado !== undefined) updateData.cupo_aprobado = Number(cupo_aprobado);
        if (observaciones !== undefined) updateData.observaciones = observaciones;

        const { data, error } = await supabase
            .from('digi_employee_benefits_90d')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, data });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

// 3. POST: Acciones (sync_sap, approve, reject, set_ws_discount_id)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, ids, id, observaciones, aprobado_por, discount_id_ws } = body;

        const supabase = getSupabase();

        // ACCIÓN A: SINCRONIZAR DIRECTAMENTE DESDE SAP HANA
        if (action === 'sync_sap') {
            console.log('🔄 Iniciando sincronización de beneficio 90 días directamente desde SAP HANA...');
            const rows = await executeSapQuery(SAP_QUERY_90_DAYS);
            console.log(`📊 Registros obtenidos de SAP: ${rows.length}`);

            const today = new Date();
            const eligibleMap = new Map<string, any>();

            // Obtener registros existentes para preservar estados, cupos editados o IDs previos
            const { data: existingBenefits } = await supabase
                .from('digi_employee_benefits_90d')
                .select('pernr, cupo_aprobado, estado, discount_id_ws, qr_token, email_sent');

            const existingMap = new Map();
            if (existingBenefits) {
                existingBenefits.forEach((b: any) => existingMap.set(b.pernr, b));
            }

            for (const row of rows) {
                const estadoSap = String(row.ESTADO_SAP || '').toUpperCase();
                if (estadoSap !== 'ACTIVO') continue;

                const pernr = String(row.Num_Per || '').trim();
                const cedula = String(row.CEDULA || '').trim();
                if (!pernr || !cedula) continue;
                if (eligibleMap.has(pernr)) continue;

                // Condición solicitada: ingresados a partir del 1 de julio de 2026
                const fechaCorteJulio2026 = new Date(2026, 6, 1); // 01/07/2026

                // Prioridad a FECHA_INGRESO_REAL (fecha real de ingreso a la compañía)
                const rawFechaIngreso = row.FECHA_INGRESO_REAL || row.Fecha_Ingreso;
                const parsedIngreso = parseSapDate(rawFechaIngreso);
                if (!parsedIngreso || isNaN(parsedIngreso.getTime())) continue;

                // Descartar si ingresó antes del 1 de julio de 2026
                if (parsedIngreso < fechaCorteJulio2026) continue;

                // Calcular días laborados desde el ingreso
                const diffMs = today.getTime() - parsedIngreso.getTime();
                const diasLaborados = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                if (diasLaborados < 90) continue;

                const { aplica, tipo, cupo } = calcularCupo(row);
                if (!aplica) continue;

                const existing = existingMap.get(pernr);

                let email = '';
                if (row.Correos) {
                    const parts = String(row.Correos).split(/[;,]/).map((s: string) => s.trim()).filter(Boolean);
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
                    qr_token: existing?.qr_token || null,
                    email_sent: existing ? existing.email_sent : false,
                    updated_at: new Date().toISOString()
                };

                eligibleMap.set(pernr, record);
            }

            const eligibleRecords = Array.from(eligibleMap.values());

            if (eligibleRecords.length > 0) {
                const batchSize = 100;
                for (let i = 0; i < eligibleRecords.length; i += batchSize) {
                    const batch = eligibleRecords.slice(i, i + batchSize);
                    const { error: upsertErr } = await supabase
                        .from('digi_employee_benefits_90d')
                        .upsert(batch, { onConflict: 'pernr' });

                    if (upsertErr) {
                        console.error('Error insertando lote en Supabase:', upsertErr);
                        throw upsertErr;
                    }
                }
            }

            return NextResponse.json({
                success: true,
                count: eligibleRecords.length,
                message: `¡Sincronización con SAP HANA completada! Se actualizaron ${eligibleRecords.length} colaboradores activos con 90 días o más.`
            });
        }

        // ACCIÓN B: RECHAZAR
        if (action === 'reject') {
            const targetId = id || (ids && ids[0]);
            if (!targetId) return NextResponse.json({ success: false, error: 'ID requerido' }, { status: 400 });

            const { data, error } = await supabase
                .from('digi_employee_benefits_90d')
                .update({
                    estado: 'RECHAZADO',
                    observaciones: observaciones || 'Rechazado por Talento Humano',
                    aprobado_por: aprobado_por || 'Talento Humano',
                    aprobado_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', targetId)
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        // ACCIÓN C: ASIGNAR ID DEL WEB SERVICE
        if (action === 'set_ws_discount_id') {
            if (!id || !discount_id_ws) {
                return NextResponse.json({ success: false, error: 'ID y discount_id_ws requeridos' }, { status: 400 });
            }

            const { data, error } = await supabase
                .from('digi_employee_benefits_90d')
                .update({
                    discount_id_ws,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, data });
        }

        // ACCIÓN D: APROBAR Y ENVIAR QR POR EMAIL
        if (action === 'approve') {
            const targetIds: string[] = ids || (id ? [id] : []);
            if (targetIds.length === 0) {
                return NextResponse.json({ success: false, error: 'Debe especificar al menos un ID' }, { status: 400 });
            }

            // Consultar datos de los empleados a aprobar
            const { data: employeesToApprove, error: fetchErr } = await supabase
                .from('digi_employee_benefits_90d')
                .select('*')
                .in('id', targetIds);

            if (fetchErr || !employeesToApprove) {
                return NextResponse.json({ success: false, error: fetchErr?.message || 'Error al obtener registros' }, { status: 500 });
            }

            // Configurar Azure Graph para envío de correo
            const tenantId = process.env.AZURE_TENANT_ID;
            const clientId = process.env.AZURE_CLIENT_ID;
            const clientSecret = process.env.AZURE_CLIENT_SECRET;
            const senderEmail = process.env.AZURE_SENDER_EMAIL || 'uneteanuestroequipo@ec.marathon-sports.com';

            let graphClient: Client | null = null;
            if (tenantId && clientId && clientSecret) {
                try {
                    const cca = new ConfidentialClientApplication({
                        auth: {
                            clientId,
                            authority: `https://login.microsoftonline.com/${tenantId}`,
                            clientSecret
                        }
                    });

                    graphClient = Client.init({
                        authProvider: async (done) => {
                            try {
                                const response = await cca.acquireTokenByClientCredential({
                                    scopes: ['https://graph.microsoft.com/.default']
                                });
                                done(null, response?.accessToken || '');
                            } catch (e: any) {
                                done(e, null);
                            }
                        }
                    });
                } catch (ccaErr) {
                    console.error('Error inicializando cliente MSAL:', ccaErr);
                }
            }

            const now = new Date();
            const results: any[] = [];

            for (const emp of employeesToApprove) {
                const qrToken = emp.qr_token || `BEN90-${emp.pernr}-${Date.now()}`;
                
                // Generar contenido del QR Code
                const qrPayload = JSON.stringify({
                    empresa: 'SUPERDEPORTE S.A. / MARATHON',
                    beneficio: 'CUPO_DESCUENTO_90_DIAS',
                    pernr: emp.pernr,
                    cedula: emp.cedula,
                    colaborador: emp.nombre_completo,
                    cargo: emp.posicion,
                    cupo_aprobado: emp.cupo_aprobado,
                    token: qrToken,
                    id_ws: emp.discount_id_ws || null,
                    fecha_emision: now.toISOString()
                });

                // Generar buffer de imagen PNG del código QR
                const qrPngBuffer = await QRCode.toBuffer(qrPayload, {
                    type: 'png',
                    width: 320,
                    margin: 2,
                    color: {
                        dark: '#002f6c',
                        light: '#ffffff'
                    }
                });

                let emailSent = false;

                // Enviar correo si tenemos email del colaborador y cliente de Azure Graph activo
                if (graphClient && emp.email) {
                    try {
                        const emailHtml = `
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <style>
                                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; line-height: 1.6; margin: 0; padding: 0; background-color: #f1f5f9; }
                                .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
                                .header { background: linear-gradient(135deg, #002f6c 0%, #001838 100%); color: #ffffff; padding: 36px 30px; text-align: center; }
                                .content { padding: 32px 30px; }
                                .badge { display: inline-block; background-color: #e0e7ff; color: #3730a3; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 13px; margin-bottom: 12px; }
                                .card-cupo { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0; }
                                .cupo-monto { font-size: 36px; font-weight: 900; color: #002f6c; margin: 8px 0; }
                                .qr-box { text-align: center; margin: 24px 0; padding: 16px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; display: inline-block; }
                                .instructions { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 14px 18px; border-radius: 0 10px 10px 0; font-size: 13.5px; color: #166534; margin: 20px 0; }
                                .footer { background-color: #f8fafc; padding: 24px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <div class="badge">🎁 BENEFICIO DE COLABORADOR</div>
                                    <h1 style="margin: 0; font-size: 24px; font-weight: 800;">¡Felicitaciones por tus 90 Días!</h1>
                                    <p style="margin: 10px 0 0; opacity: 0.9; font-size: 15px;">Superdeporte S.A. / Grupo Marathon</p>
                                </div>
                                <div class="content">
                                    <p style="font-size: 16px;">Estimado/a <strong>${emp.nombre_completo}</strong>,</p>
                                    <p>Nos alegra celebrar junto a ti tus primeros 90 días en la empresa. Como parte de tu paquete de beneficios, nos complace informarte que ya tienes habilitado tu <strong>Cupo de Descuento de Colaborador</strong>.</p>
                                    
                                    <div class="card-cupo">
                                        <div style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 700;">Cupo Asignado para Compras</div>
                                        <div class="cupo-monto">$${Number(emp.cupo_aprobado).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</div>
                                        <div style="font-size: 12.5px; color: #64748b;">Aplica según las políticas institucionales de descuento para empleados.</div>
                                    </div>

                                    <div style="text-align: center;">
                                        <p style="font-weight: 700; margin-bottom: 8px; color: #0f172a;">Tu Código QR de Identificación:</p>
                                        <div class="qr-box">
                                            <img src="cid:qrCodeBeneficio" alt="Código QR Beneficio" style="width: 220px; height: 220px; display: block;" />
                                            <div style="margin-top: 8px; font-family: monospace; font-size: 12px; color: #64748b; font-weight: 700;">
                                                ID: ${emp.pernr} | C.I.: ${emp.cedula}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="instructions">
                                        <strong>¿Cómo utilizar tu beneficio?</strong><br>
                                        Presenta este código QR desde tu teléfono celular junto con tu cédula de identidad en cualquiera de nuestras tiendas autorizadas al momento de pagar.
                                    </div>

                                    <p style="font-size: 13.5px; color: #64748b;">
                                        Si tienes dudas sobre el consumo o alcance de tu cupo, comunícate con el área de Talento Humano.
                                    </p>
                                </div>
                                <div class="footer">
                                    <p style="margin: 0;">Superdeporte S.A. / Marathon Sports · Departamento de Talento Humano</p>
                                    <p style="margin: 6px 0 0; font-size: 11px;">Este es un mensaje automático generado por el Sistema de Digitalización Zero-Paper.</p>
                                </div>
                            </div>
                        </body>
                        </html>
                        `;

                        const sendMailPayload = {
                            message: {
                                subject: '🎉 ¡Felicitaciones! Ya tienes habilitado tu Cupo de Descuento (Beneficio 90 Días)',
                                body: {
                                    contentType: 'HTML',
                                    content: emailHtml
                                },
                                toRecipients: [
                                    {
                                        emailAddress: {
                                            address: emp.email,
                                            name: emp.nombre_completo
                                        }
                                    }
                                ],
                                attachments: [
                                    {
                                        '@odata.type': '#microsoft.graph.fileAttachment',
                                        name: 'qr-beneficio.png',
                                        contentType: 'image/png',
                                        contentBytes: qrPngBuffer.toString('base64'),
                                        contentId: 'qrCodeBeneficio',
                                        isInline: true
                                    }
                                ]
                            },
                            saveToSentItems: true
                        };

                        await graphClient.api(`/users/${senderEmail}/sendMail`).post(sendMailPayload);
                        emailSent = true;
                    } catch (mailErr: any) {
                        console.error(`Error enviando correo a ${emp.email}:`, mailErr);
                    }
                }

                // Actualizar registro en Supabase
                const { error: updErr } = await supabase
                    .from('digi_employee_benefits_90d')
                    .update({
                        estado: 'APROBADO',
                        qr_token: qrToken,
                        email_sent: emailSent,
                        email_sent_at: emailSent ? now.toISOString() : null,
                        aprobado_por: aprobado_por || 'Talento Humano',
                        aprobado_at: now.toISOString(),
                        updated_at: now.toISOString()
                    })
                    .eq('id', emp.id);

                if (!updErr) {
                    results.push({
                        id: emp.id,
                        pernr: emp.pernr,
                        nombre: emp.nombre_completo,
                        email_sent: emailSent,
                        cupo_aprobado: emp.cupo_aprobado
                    });
                }
            }

            return NextResponse.json({
                success: true,
                count: results.length,
                results
            });
        }

        return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
    } catch (e: any) {
        console.error('Error en POST /api/benefits-90-days:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
