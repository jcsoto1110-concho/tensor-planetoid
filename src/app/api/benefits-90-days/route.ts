import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { executeSapQuery } from '@/lib/sapdb';
import path from 'path';
import fs from 'fs';

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

export interface CupoRule {
    id?: string;
    patron: string;
    descripcion?: string;
    cupo: number;
    activo?: boolean;
}

const DEFAULT_CUPO_RULES: CupoRule[] = [
    { patron: 'ASVENT', descripcion: 'Asesor de Ventas', cupo: 1000.00, activo: true },
    { patron: 'AUBODE', descripcion: 'Auxiliar de Bodega', cupo: 1000.00, activo: true },
    { patron: 'CAJERO', descripcion: 'Cajero / Facturación', cupo: 1000.00, activo: true },
    { patron: 'BODEG', descripcion: 'Bodegueros / Operadores de Bodega', cupo: 1000.00, activo: true },
    { patron: 'ANALIS', descripcion: 'Analistas Administrativos / BI', cupo: 1500.00, activo: true },
    { patron: 'ASIST', descripcion: 'Asistentes Administrativos', cupo: 1500.00, activo: true },
    { patron: 'MAYORISTA', descripcion: 'Canal Mayoristas', cupo: 1500.00, activo: true },
    { patron: 'JEALMA', descripcion: 'Jefes de Almacén', cupo: 2500.00, activo: true },
    { patron: 'SUALMA', descripcion: 'Supervisores de Almacén', cupo: 2500.00, activo: true },
    { patron: 'SUTIEN', descripcion: 'Supervisores de Tienda', cupo: 2500.00, activo: true },
    { patron: 'COORD', descripcion: 'Coordinadores / Líderes', cupo: 2500.00, activo: true },
    { patron: 'GEREN', descripcion: 'Gerencias y Directores', cupo: 6000.00, activo: true },
];

async function getCupoRules(supabase: any): Promise<CupoRule[]> {
    try {
        const { data: dedicatedRules, error: dedErr } = await supabase
            .from('digi_cupo_rules')
            .select('*')
            .order('id', { ascending: true });

        if (!dedErr && dedicatedRules && dedicatedRules.length > 0) {
            return dedicatedRules.map((r: any) => ({
                id: String(r.id),
                patron: String(r.patron || '').toUpperCase().trim(),
                descripcion: r.descripcion || '',
                cupo: Number(r.cupo) || 0,
                activo: r.activo !== false
            }));
        }
    } catch (_) {}

    try {
        const { data: auditLog, error: auditErr } = await supabase
            .from('digi_audit_logs')
            .select('description')
            .eq('entity_type', 'CONFIG_CUPOS_RULES')
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (!auditErr && auditLog?.description) {
            const parsed = JSON.parse(auditLog.description);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed.map((r: any, idx: number) => ({
                    id: String(r.id || idx + 1),
                    patron: String(r.patron || '').toUpperCase().trim(),
                    descripcion: r.descripcion || '',
                    cupo: Number(r.cupo) || 0,
                    activo: r.activo !== false
                }));
            }
        }
    } catch (e) {
        console.warn('No se pudieron cargar reglas personalizadas desde digi_audit_logs:', e);
    }

    return DEFAULT_CUPO_RULES;
}

async function saveCupoRules(supabase: any, rules: CupoRule[], userName?: string) {
    const cleanRules = rules.map((r, i) => ({
        id: String(r.id || i + 1),
        patron: String(r.patron || '').toUpperCase().trim(),
        descripcion: (r.descripcion || '').trim(),
        cupo: Math.max(0, Number(r.cupo) || 0),
        activo: r.activo !== false
    })).filter(r => r.patron.length > 0);

    const { error: logErr } = await supabase
        .from('digi_audit_logs')
        .insert({
            action: 'UPDATE_CONFIG',
            entity_type: 'CONFIG_CUPOS_RULES',
            entity_id: 'GLOBAL',
            user_name: userName || 'Talento Humano',
            description: JSON.stringify(cleanRules),
            timestamp: new Date().toISOString()
        });

    if (logErr) {
        console.error('Error guardando en digi_audit_logs:', logErr);
    }

    try {
        await supabase.from('digi_cupo_rules').upsert(cleanRules, { onConflict: 'patron' });
    } catch (_) {}

    return cleanRules;
}

function calcularCupo(row: any, customRules?: CupoRule[]) {
    const posicion = String(row.posicion || row.Posicion || row.DESCRIPCION_POSICION || '').toUpperCase().trim();
    const gerencia = String(row.gerencia || row.Gerencia || '').toUpperCase().trim();
    const operacion = String(row.operacion || row.Descripcion_operacion || '').toUpperCase().trim();
    const unidadOrg = String(row.Unidad_Organizativa || '').toUpperCase().trim();
    const centroCosto = String(row.Centro_costo || '').toUpperCase().trim();
    const areaPersonal = String(row.Are_Personal || '').toUpperCase().trim();
    const grupoPersonal = String(row.grupo_personal || row.GRUPO_PERSONAL || '').toUpperCase().trim();

    // 1. Exclusión obligatoria: No aplica a pasantes
    if (grupoPersonal.includes('PASANTE') || posicion.includes('PASANTE')) {
        return { aplica: false, tipo: 'PASANTE', cupo: 0, motivo: 'Pasante no aplica al beneficio' };
    }

    // 2. Evaluar reglas configuradas por el usuario (ej. ASVENT, CAJERO, AUBODE, etc.)
    if (customRules && customRules.length > 0) {
        for (const rule of customRules) {
            if (rule.activo === false) continue;
            const pat = (rule.patron || '').toUpperCase().trim();
            if (!pat) continue;

            if (
                posicion.startsWith(pat) || 
                posicion.includes(pat) || 
                operacion.includes(pat) || 
                gerencia.includes(pat) ||
                unidadOrg.includes(pat)
            ) {
                return { 
                    aplica: true, 
                    tipo: pat, 
                    cupo: Number(rule.cupo) || 0, 
                    motivo: rule.descripcion ? `${rule.descripcion} (${pat})` : `Puesto configurado: ${pat}` 
                };
            }
        }
    }

    // 3. Fallback a reglas estándar por defecto si no coincide ninguna regla personalizada
    // Tienda y Bodegas (CD): $1,000
    const isTiendaBodega = 
        posicion.startsWith('ASVENT') ||
        posicion.startsWith('AUBODE') ||
        posicion.startsWith('CAJERO') ||
        posicion.startsWith('BODEG') ||
        posicion.includes('VENTA') || 
        posicion.includes('ASESOR') || 
        posicion.includes('BODEGA') || 
        posicion.includes('BODEGUER') || 
        posicion.includes('CAJER') || 
        posicion.includes('ESTIBADOR') || 
        posicion.includes('PERCHERO') || 
        posicion.includes('DESPACH') ||
        posicion.includes('OPERADOR DE BODEGA') ||
        operacion.includes('TIENDA') ||
        operacion.includes('BODEGA') ||
        operacion.includes('CENTRO DE DISTRIB');

    if (isTiendaBodega && 
        !posicion.includes('JEFE') && 
        !posicion.startsWith('JEALMA') && 
        !posicion.startsWith('SUALMA') && 
        !posicion.startsWith('SUTIEN') && 
        !posicion.includes('GERENTE') && 
        !posicion.includes('SUPERVISOR')
    ) {
        return { aplica: true, tipo: 'TIENDA_BODEGA', cupo: 1000.00, motivo: 'Tienda y Bodegas (CD): Asesor de ventas, bodeguero, bodega, cajero' };
    }

    // Gerencias: $6,000
    if (
        posicion.startsWith('GEREN') ||
        posicion.includes('GERENTE') || 
        posicion.includes('GERENCIA') || 
        gerencia.includes('GERENCIA GENERAL') || 
        posicion.includes('DIRECTOR') || 
        posicion.includes('VICEPRESIDENTE') ||
        posicion.startsWith('VP')
    ) {
        return { aplica: true, tipo: 'GERENCIA', cupo: 6000.00, motivo: 'Gerencias y Directores' };
    }

    // Jefaturas y Supervisión: $2,500
    if (
        posicion.startsWith('JEALMA') || 
        posicion.startsWith('JEDEB') ||  
        posicion.startsWith('JEF') ||
        posicion.startsWith('SUALMA') || 
        posicion.startsWith('SUTIEN') || 
        posicion.startsWith('SUP') ||
        posicion.startsWith('COORD') ||
        posicion.includes('JEFE') || 
        posicion.includes('JEFATURA') || 
        posicion.includes('SUPERVISOR') || 
        posicion.includes('SUPERVISORA') || 
        posicion.includes('SUPERVISION') || 
        posicion.includes('COORDINADOR') || 
        posicion.includes('COORDINADORA') ||
        posicion.includes('ADMINISTRADOR DE TIENDA') ||
        posicion.includes('SUBGERENTE') ||
        posicion.includes('LIDER')
    ) {
        return { aplica: true, tipo: 'JEFATURA_SUPERVISION', cupo: 2500.00, motivo: 'Jefaturas y Supervisión' };
    }

    // Adm Asistencial: $1,500
    const isMayoristas = operacion.includes('MAYORISTA') || unidadOrg.includes('MAYORISTA') || centroCosto.includes('MAYORISTA');
    const isAdministrativo = 
        posicion.startsWith('ANALIS') ||
        posicion.startsWith('ASIST') ||
        posicion.includes('ANALISTA') ||
        posicion.includes('ASISTENTE') || 
        posicion.includes('AUXILIAR') || 
        posicion.includes('RECEPCION') || 
        posicion.includes('SECRETAR') ||
        posicion.includes('CONTAB') ||
        posicion.includes('ESPECIALISTA') ||
        areaPersonal.includes('ADMIN') || 
        unidadOrg.includes('ADMIN') ||
        operacion.includes('ADMIN');

    if (isMayoristas || isAdministrativo) {
        return { aplica: true, tipo: 'ADM_ASISTENCIAL', cupo: 1500.00, motivo: isMayoristas ? 'Canal Mayoristas' : 'Adm Asistencial' };
    }

    // Por defecto: Tienda y Bodegas (CD): $1,000
    return { aplica: true, tipo: 'TIENDA_BODEGA', cupo: 1000.00, motivo: 'Tienda y Bodegas (CD)' };
}

// 1. GET: Listar registros de beneficios con filtros y estadísticas
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const rulesOnly = searchParams.get('rules');
        const supabase = getSupabase();

        if (rulesOnly === 'true') {
            const rules = await getCupoRules(supabase);
            return NextResponse.json({ success: true, rules });
        }

        const status = searchParams.get('status') || 'ALL';
        const empresa = searchParams.get('empresa') || 'ALL';
        const search = (searchParams.get('search') || '').trim().toLowerCase();

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

        const rawRecords = data || [];
        const allRecords = rawRecords.map((r: any) => ({
            ...r,
            empresas: (Array.isArray(r.empresas) && r.empresas.length > 0)
                ? r.empresas
                : (typeof r.empresas === 'string' && r.empresas.trim()
                    ? r.empresas.split(',').map((s: string) => s.trim())
                    : ['E200'])
        }));

        // Filtrado por búsqueda y empresa en memoria
        const filtered = allRecords.filter((r: any) => {
            if (empresa !== 'ALL' && (!r.empresas || !r.empresas.includes(empresa))) {
                return false;
            }
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

// 2. PUT: Modificar cupo, empresas u observaciones
export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, cupo_aprobado, observaciones, empresas } = body;

        if (!id) {
            return NextResponse.json({ success: false, error: 'ID es requerido' }, { status: 400 });
        }

        const supabase = getSupabase();
        const updateData: any = { updated_at: new Date().toISOString() };

        if (cupo_aprobado !== undefined) updateData.cupo_aprobado = Number(cupo_aprobado);
        if (observaciones !== undefined) updateData.observaciones = observaciones;
        if (empresas !== undefined) {
            updateData.empresas = Array.isArray(empresas) ? empresas : [empresas];
        }

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

// 3. POST: Acciones (sync_sap, approve, reject, set_ws_discount_id, get_rules, save_rules)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, ids, id, observaciones, aprobado_por, discount_id_ws, rules, recalculatePending } = body;

        const supabase = getSupabase();

        // ACCIÓN: OBTENER REGLAS DE DESCUENTO POR PUESTO
        if (action === 'get_rules') {
            const currentRules = await getCupoRules(supabase);
            return NextResponse.json({ success: true, rules: currentRules });
        }

        // ACCIÓN: GUARDAR REGLAS DE DESCUENTO POR PUESTO
        if (action === 'save_rules') {
            if (!Array.isArray(rules)) {
                return NextResponse.json({ success: false, error: 'Lista de reglas requerida' }, { status: 400 });
            }

            const savedRules = await saveCupoRules(supabase, rules, body.user_name || 'Talento Humano');

            let recalculateCount = 0;
            if (recalculatePending) {
                // Actualizar automáticamente los colaboradores en estado PENDIENTE con las nuevas reglas
                const { data: pendingEmployees, error: pErr } = await supabase
                    .from('digi_employee_benefits_90d')
                    .select('id, pernr, posicion, operacion, gerencia, grupo_personal, cupo_aprobado, cupo_sugerido')
                    .eq('estado', 'PENDIENTE');

                if (!pErr && pendingEmployees && pendingEmployees.length > 0) {
                    for (const emp of pendingEmployees) {
                        const { cupo, tipo } = calcularCupo(emp, savedRules);
                        if (cupo > 0) {
                            await supabase
                                .from('digi_employee_benefits_90d')
                                .update({
                                    cupo_sugerido: cupo,
                                    cupo_aprobado: cupo,
                                    tipo_operacion: tipo,
                                    updated_at: new Date().toISOString()
                                })
                                .eq('id', emp.id);
                            recalculateCount++;
                        }
                    }
                }
            }

            return NextResponse.json({
                success: true,
                message: recalculatePending 
                    ? `Reglas guardadas exitosamente y se recalcularon ${recalculateCount} colaboradores pendientes.`
                    : 'Reglas de descuento por puesto guardadas correctamente.',
                rules: savedRules,
                recalculateCount
            });
        }

        // ACCIÓN A: SINCRONIZAR DIRECTAMENTE DESDE SAP HANA
        if (action === 'sync_sap') {
            console.log('🔄 Iniciando sincronización de beneficio 90 días directamente desde SAP HANA...');
            const rows = await executeSapQuery(SAP_QUERY_90_DAYS);
            console.log(`📊 Registros obtenidos de SAP: ${rows.length}`);

            const customRules = await getCupoRules(supabase);
            const today = new Date();
            const eligibleMap = new Map<string, any>();

            // Obtener registros existentes para preservar estados, cupos editados o IDs previos
            const { data: existingBenefits } = await supabase
                .from('digi_employee_benefits_90d')
                .select('pernr, cupo_aprobado, estado, discount_id_ws, qr_token, email_sent, empresas');

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

                const { aplica, tipo, cupo } = calcularCupo(row, customRules);
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
                    cupo_aprobado: (existing && existing.estado !== 'PENDIENTE') ? existing.cupo_aprobado : cupo,
                    estado: existing ? existing.estado : 'PENDIENTE',
                    discount_id_ws: existing?.discount_id_ws || null,
                    empresas: existing?.empresas || ['E200'],
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

        // ACCIÓN NUEVA: PROCESAR CERTIFICADOS ORACLE MANUALMENTE
        if (action === 'generate_oracle_coupons') {
            try {
                const scriptPath = path.resolve('scripts/process_oracle_coupons.mjs');
                if (!fs.existsSync(scriptPath)) {
                    return NextResponse.json({
                        success: false,
                        error: 'Script scripts/process_oracle_coupons.mjs no encontrado en el servidor local.'
                    }, { status: 404 });
                }
                const { pathToFileURL } = await import('url');
                const { processOracleCoupons } = await import(pathToFileURL(scriptPath).href);
                const result = await processOracleCoupons();
                return NextResponse.json({
                    success: true,
                    count: result.count || 0,
                    totalCertificados: result.totalCertificados || 0,
                    message: result.count > 0 
                        ? `¡Se generaron ${result.totalCertificados} certificados en Oracle para ${result.count} colaborador(es)!`
                        : 'No se encontraron colaboradores pendientes para generar certificados en Oracle.'
                });
            } catch (oracleErr: any) {
                console.error('Error ejecutando processOracleCoupons:', oracleErr);
                return NextResponse.json({
                    success: false,
                    isLocalRequired: true,
                    error: `La base Oracle (192.168.91.14) está en la red interna privada: ${oracleErr.message}. Ejecute 'npm run process:coupons' en la consola local.`
                }, { status: 500 });
            }
        }

        // ACCIÓN D: APROBAR Y ENVIAR QR POR EMAIL
        if (action === 'approve') {
            const targetIds: string[] = ids || (id ? [id] : []);
            if (targetIds.length === 0) {
                return NextResponse.json({ success: false, error: 'Debe especificar al menos un ID' }, { status: 400 });
            }

            const empresasMap = body.empresasMap || {};
            const globalEmpresas = body.empresas;

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
                
                // Empresas aprobadas para este colaborador (E200 Superdeporte, E100 Equinox, E101 Mundo Dep)
                const selectedEmpresas: string[] = empresasMap[emp.id] || 
                    (Array.isArray(globalEmpresas) && globalEmpresas.length > 0 
                        ? globalEmpresas 
                        : (Array.isArray(emp.empresas) && emp.empresas.length > 0 ? emp.empresas : ['E200']));

                // HOOK / DISPARADOR PARA EL WEB SERVICE DE CERTIFICADO DE DESCUENTO
                // Con esta selección se disparará la creación del certificado de descuento en el WS
                console.log(`🚀 [CERTIFICADO DESCUENTO WS] Creando certificados para ${emp.nombre_completo} (PERNR: ${emp.pernr}) en empresas:`, selectedEmpresas);

                // Generar contenido del QR Code con las empresas autorizadas
                const qrPayload = JSON.stringify({
                    empresa: 'SUPERDEPORTE S.A. / MARATHON',
                    beneficio: 'CUPO_DESCUENTO_90_DIAS',
                    empresas_autorizadas: selectedEmpresas,
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

                // Cargar imagen de Sporty si existe
                let sportyBannerBuffer: Buffer | null = null;
                try {
                    const bannerPath = path.resolve('public/images/sporty_banner.png');
                    if (fs.existsSync(bannerPath)) {
                        sportyBannerBuffer = fs.readFileSync(bannerPath);
                    }
                } catch (bErr) {
                    console.warn('Banner de Sporty no disponible para adjuntar:', bErr);
                }

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
                                .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
                                .header { background: linear-gradient(135deg, #002f6c 0%, #001838 100%); color: #ffffff; padding: 36px 30px; text-align: center; }
                                .content { padding: 32px 30px; }
                                .badge { display: inline-block; background-color: #fef08a; color: #854d0e; padding: 6px 14px; border-radius: 9999px; font-weight: 800; font-size: 12px; margin-bottom: 12px; letter-spacing: 0.05em; }
                                .sporty-card { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border: 2px solid #3b82f6; border-radius: 16px; padding: 22px; margin: 24px 0; text-align: left; }
                                .sporty-badge { display: inline-block; background: #2563eb; color: #ffffff; font-size: 11px; font-weight: 800; padding: 4px 10px; border-radius: 9999px; text-transform: uppercase; margin-bottom: 8px; }
                                .card-cupo { background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0; }
                                .cupo-monto { font-size: 38px; font-weight: 900; color: #002f6c; margin: 8px 0; letter-spacing: -0.02em; }
                                .qr-box { text-align: center; margin: 20px 0; padding: 18px; background: #ffffff; border-radius: 14px; border: 1.5px solid #e2e8f0; display: inline-block; box-shadow: 0 2px 8px rgba(0,0,0,0.04); }
                                .instructions { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px 20px; border-radius: 0 12px 12px 0; font-size: 13.5px; color: #166534; margin: 20px 0; }
                                .empresas-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; margin: 20px 0; text-align: center; }
                                .empresa-tag { display: inline-block; background: #e0f2fe; color: #0369a1; padding: 6px 12px; border-radius: 8px; font-size: 12.5px; font-weight: 800; margin: 4px; border: 1px solid #bae6fd; }
                                .step-pill { background: #ffffff; border-radius: 10px; padding: 10px 14px; margin: 8px 0; border: 1px solid #bfdbfe; font-size: 13px; color: #1e3a8a; display: flex; align-items: center; gap: 8px; }
                                .footer { background-color: #f8fafc; padding: 24px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="header">
                                    <div class="badge">🎉 ¡FELICITACIONES POR TUS 90 DÍAS!</div>
                                    <h1 style="margin: 0; font-size: 24px; font-weight: 800;">¡Bienvenido/a a tu Beneficio de Descuento de Colaborador!</h1>
                                    <p style="margin: 10px 0 0; opacity: 0.9; font-size: 14px;">Superdeporte S.A. / Grupo Marathon</p>
                                </div>
                                <div class="content">
                                    <p style="font-size: 16px; margin-top: 0;">Estimado/a <strong>${emp.nombre_completo}</strong>,</p>
                                    <p>¡Nos complace darte la bienvenida a tu beneficio de empleado! Al haber cumplido exitosamente tus primeros <strong>90 días</strong> en nuestra compañía, ya tienes habilitado tu <strong>Cupo de Descuento para Compras</strong>.</p>

                                    <!-- SECCIÓN DESTACADA SPORTY -->
                                    <div class="sporty-card">
                                        <div class="sporty-badge">🤖 DISPONIBLE EN SPORTY</div>
                                        <h3 style="margin: 0 0 8px; color: #1e3a8a; font-size: 18px; font-weight: 800;">
                                            ¡Obtén tu QR de Descuento directamente desde SPORTY!
                                        </h3>
                                        <p style="color: #1e40af; font-size: 13.5px; margin: 0 0 14px; line-height: 1.5;">
                                            Además de este correo, tu código QR personal ya se encuentra disponible <strong>24/7 en nuestro asistente virtual Sporty</strong> para que puedas consultarlo y presentarlo siempre desde tu teléfono celular.
                                        </p>

                                        <div style="font-size: 13px; font-weight: 800; color: #1e3a8a; margin-bottom: 6px;">
                                            ¿Cómo obtener tu código en Sporty?
                                        </div>
                                        <div class="step-pill">
                                            <strong>1.</strong> Abre tu chat habitual con <strong>Sporty</strong> (Teams / WhatsApp / Intranet).
                                        </div>
                                        <div class="step-pill">
                                            <strong>2.</strong> En el menú <em>¿Qué puedes consultar hoy en Sporty?</em>, elige la opción:
                                        </div>
                                        <div style="background: #2563eb; color: white; border-radius: 10px; padding: 10px 14px; font-size: 13.5px; font-weight: 800; text-align: center; margin: 8px 0; box-shadow: 0 2px 6px rgba(37,99,235,0.3);">
                                            📱 QR de Descuento (Accede a tu código de empleado)
                                        </div>
                                        <div class="step-pill">
                                            <strong>3.</strong> ¡Listo! Sporty te entregará tu QR al instante para canjear tus compras.
                                        </div>
                                    </div>

                                    ${sportyBannerBuffer ? `
                                    <div style="text-align: center; margin: 20px 0;">
                                        <img src="cid:sportyBanner" alt="Sporty - QR de Descuento" style="width: 100%; max-width: 520px; border-radius: 14px; border: 1px solid #e2e8f0; display: block; margin: 0 auto;" />
                                    </div>
                                    ` : ''}

                                    <!-- CUPO ASIGNADO -->
                                    <div class="card-cupo">
                                        <div style="font-size: 12.5px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 800;">Tu Cupo Asignado para Descuentos</div>
                                        <div class="cupo-monto">$${Number(emp.cupo_aprobado).toLocaleString('es-EC', { minimumFractionDigits: 2 })}</div>
                                        <div style="font-size: 12.5px; color: #64748b;">Aplica con el <strong>30% de descuento</strong> institucional según políticas vigentes.</div>
                                    </div>

                                    <!-- EMPRESAS AUTORIZADAS -->
                                    <div class="empresas-box">
                                        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 800; margin-bottom: 8px;">
                                            🏢 Empresas Habilitadas para tus Compras:
                                        </div>
                                        <div>
                                            ${selectedEmpresas.map(code => {
                                                const label = code === 'E200' ? 'E200 - Superdeporte' : code === 'E100' ? 'E100 - Equinox' : code === 'E101' ? 'E101 - Mundo Dep' : code;
                                                return `<span class="empresa-tag">${label}</span>`;
                                            }).join('')}
                                        </div>
                                    </div>

                                    <!-- QR CODE ADJUNTO -->
                                    <div style="text-align: center;">
                                        <p style="font-weight: 700; margin-bottom: 8px; color: #0f172a;">Tu Código QR de Identificación:</p>
                                        <div class="qr-box">
                                            <img src="cid:qrCodeBeneficio" alt="Código QR Beneficio" style="width: 220px; height: 220px; display: block;" />
                                            <div style="margin-top: 8px; font-family: monospace; font-size: 12px; color: #64748b; font-weight: 700;">
                                                ID Empleado: ${emp.pernr} | Cédula: ${emp.cedula}
                                            </div>
                                        </div>
                                    </div>

                                    <div class="instructions">
                                        <strong>📌 ¿Cómo utilizar tu beneficio en tienda?</strong><br>
                                        1. Solicita tu <strong>QR de Descuento</strong> en <strong>Sporty</strong> o presenta el código QR de este correo desde tu celular.<br>
                                        2. Presenta tu <strong>cédula de identidad original</strong> en la caja de cualquier tienda autorizada.<br>
                                        3. El cajero escaneará tu código y aplicará automáticamente tu descuento institucional.
                                    </div>

                                    <p style="font-size: 13px; color: #64748b; margin-top: 24px;">
                                        Para cualquier duda o consulta sobre el alcance de tu beneficio, comunícate con el departamento de Talento Humano.
                                    </p>
                                </div>
                                <div class="footer">
                                    <p style="margin: 0; font-weight: 700;">Superdeporte S.A. / Marathon Sports · Talento Humano</p>
                                    <p style="margin: 6px 0 0; font-size: 11px;">Mensaje de bienvenida al programa de beneficios corporativos.</p>
                                </div>
                            </div>
                        </body>
                        </html>
                        `;

                        const sendMailPayload: any = {
                            message: {
                                subject: '🎉 ¡Bienvenido/a a tu Beneficio 90 Días! Obtén tu QR de Descuento en Sporty',
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
                                    },
                                    ...(sportyBannerBuffer ? [{
                                        '@odata.type': '#microsoft.graph.fileAttachment',
                                        name: 'sporty-banner.png',
                                        contentType: 'image/png',
                                        contentBytes: sportyBannerBuffer.toString('base64'),
                                        contentId: 'sportyBanner',
                                        isInline: true
                                    }] : [])
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

                // Actualizar registro en Supabase incluyendo empresas asignadas
                const baseUpdate: any = {
                    estado: 'APROBADO',
                    qr_token: qrToken,
                    email_sent: emailSent,
                    email_sent_at: emailSent ? now.toISOString() : null,
                    aprobado_por: aprobado_por || 'Talento Humano',
                    aprobado_at: now.toISOString(),
                    updated_at: now.toISOString()
                };

                // Guardar empresas en observaciones como respaldo JSON si la columna empresas no existe en DB
                try {
                    const prevObs = emp.observaciones ? JSON.parse(emp.observaciones) : {};
                    baseUpdate.observaciones = JSON.stringify({ ...prevObs, empresas: selectedEmpresas });
                } catch {
                    baseUpdate.observaciones = JSON.stringify({ empresas: selectedEmpresas });
                }

                // 1. Intentar con todas las columnas extendidas
                let { error: updErr } = await supabase
                    .from('digi_employee_benefits_90d')
                    .update({
                        ...baseUpdate,
                        empresas: selectedEmpresas,
                        cupon_oracle_estado: 'PENDIENTE'
                    })
                    .eq('id', emp.id);

                // 2. Si falla por cupon_oracle_estado o empresas, intentar con empresas solamente
                if (updErr) {
                    const retry1 = await supabase
                        .from('digi_employee_benefits_90d')
                        .update({
                            ...baseUpdate,
                            empresas: selectedEmpresas
                        })
                        .eq('id', emp.id);
                    updErr = retry1.error;
                }

                // 3. Si la columna empresas aún no existe en Supabase, usar baseUpdate (garantizado de existir)
                if (updErr) {
                    console.warn(`⚠️ Usando fallback baseUpdate sin columna empresas para empleado ${emp.id}:`, updErr.message);
                    const retry2 = await supabase
                        .from('digi_employee_benefits_90d')
                        .update(baseUpdate)
                        .eq('id', emp.id);
                    updErr = retry2.error;
                }

                if (!updErr) {
                    results.push({
                        id: emp.id,
                        pernr: emp.pernr,
                        nombre: emp.nombre_completo,
                        email_sent: emailSent,
                        cupo_aprobado: emp.cupo_aprobado,
                        empresas: selectedEmpresas
                    });
                } else {
                    console.error(`❌ Error actualizando estado de aprobación para empleado ${emp.id}:`, updErr);
                }
            }

            // Intentar ejecución directa en Oracle si el servidor tiene acceso a la red local (192.168.91.14)
            try {
                const scriptPath = path.resolve('scripts/process_oracle_coupons.mjs');
                if (fs.existsSync(scriptPath)) {
                    const { pathToFileURL } = await import('url');
                    const { processOracleCoupons } = await import(pathToFileURL(scriptPath).href);
                    await processOracleCoupons();
                }
            } catch (oracleAsyncErr: any) {
                console.log('ℹ️ Generación directa en Oracle diferida a daemon/script local:', oracleAsyncErr.message);
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
