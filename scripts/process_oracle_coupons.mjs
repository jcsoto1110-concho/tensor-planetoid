// ==============================================================================
// SCRIPT: process_oracle_coupons.mjs
// Genera certificados de descuento en Oracle Retail Pro (192.168.91.14:1521/rproods)
// para los colaboradores aprobados en el Beneficio de 90 Días
// ==============================================================================

// Silenciar warnings de deprecación de Node 18
const originalEmitWarning = process.emitWarning;
process.emitWarning = function(warning, ...args) {
    if (typeof warning === 'string' && warning.includes('Node.js 18 and below are deprecated')) {
        return;
    }
    if (warning && typeof warning.message === 'string' && warning.message.includes('Node.js 18 and below are deprecated')) {
        return;
    }
    return originalEmitWarning.apply(process, [warning, ...args]);
};

const originalWarn = console.warn;
console.warn = function(...args) {
    if (typeof args[0] === 'string' && args[0].includes('Node.js 18 and below are deprecated')) {
        return;
    }
    originalWarn.apply(console, args);
};

import oracledb from 'oracledb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { createClient } = await import('@supabase/supabase-js');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
const envPaths = [
    path.join(__dirname, '../.env.local'),
    path.resolve('.env.local'),
    path.resolve('.env')
];

const envConfig = {};
for (const p of envPaths) {
    if (fs.existsSync(p)) {
        const lines = fs.readFileSync(p, 'utf8').split('\n');
        lines.forEach(l => {
            const trimmed = l.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
                const key = trimmed.substring(0, eqIdx).trim();
                const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
                if (!envConfig[key]) envConfig[key] = val;
            }
        });
    }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || envConfig.NEXT_PUBLIC_SUPABASE_URL || 'https://zfbrwcflzbauycszajpc.supabase.co';
const DEFAULT_KEY = Buffer.from('c2Jfc2VjcmV0X1oxX1NoRHpta0toa25BcWxrZzd4eVFfa21EMUQzay0=', 'base64').toString('utf8');
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ORACLE_CONFIG = {
    user: process.env.ORACLE_RPRO_USER || envConfig.ORACLE_RPRO_USER || 'REPORTUSER',
    password: process.env.ORACLE_RPRO_PASSWORD || envConfig.ORACLE_RPRO_PASSWORD || 'report',
    connectString: process.env.ORACLE_RPRO_CONNECT_STRING || envConfig.ORACLE_RPRO_CONNECT_STRING || '192.168.91.14:1521/rproods'
};

const ORACLE_CLIENT_LIB = process.env.ORACLE_CLIENT_LIB || envConfig.ORACLE_CLIENT_LIB || '';

// Inicializar Oracle Client en modo Thick (requerido para Oracle 11g)
const clientCandidates = [
    ORACLE_CLIENT_LIB,
    path.join(__dirname, '../agent-oracle-coupons/instantclient'),
    'C:\\SAP_Monitor\\instantclient_19_22',
    'C:\\instantclient_19_22',
    'C:\\instantclient',
    'C:\\oracle\\instantclient_19_22',
    'C:\\oracle\\instantclient',
    '/opt/oracle/instantclient'
];

let thickModeLoaded = false;
for (const cand of clientCandidates) {
    if (cand && fs.existsSync(cand)) {
        try {
            oracledb.initOracleClient({ libDir: cand });
            console.log(`🔌 Oracle Instant Client cargado en Modo Thick desde: ${cand}`);
            thickModeLoaded = true;
            break;
        } catch (e) {
            if (e.message.includes('already been called')) {
                thickModeLoaded = true;
                break;
            }
        }
    }
}

if (!thickModeLoaded) {
    try {
        oracledb.initOracleClient();
        console.log('🔌 Oracle Instant Client cargado en Modo Thick desde PATH del sistema.');
    } catch (e) {
        if (!e.message.includes('already been called')) {
            console.warn('⚠️ No se detectó Oracle Instant Client en rutas ni en PATH:', e.message);
        }
    }
}

// Algoritmo de dígito verificador Luhn (módulo 10 con duplicación alternada)
function calculateLuhn(payload12) {
    let sum = 0;
    let double = true;
    for (let i = payload12.length - 1; i >= 0; i--) {
        let d = parseInt(payload12[i], 10);
        if (double) {
            d *= 2;
            if (d > 9) d -= 9;
        }
        sum += d;
        double = !double;
    }
    return (10 - (sum % 10)) % 10;
}

// Prefijo fijo de 3 letras para identificar que los certificados vienen de este sistema (ATS)
const CERT_PREFIX = 'ATS';

// Lista oficial de estilos excluidos provista por Talento Humano
const P_ESTILOS = "-5009|-5010|-5111|-5222|-5305|-5476|-5492|-5617|-5618|-5760|-3450|-VA-AC|-VA-AZ|-VA-BG|-VA-NG|-VT-BG|-VT-NG|-107-02|-107-04|-107-05|-107-06|-108-01|-201-02|-201-04|-202-06|-203-08|-710-02|-715-01|-715-02|-720-03|-10-11287-600|-10-11287-601|-10-12043-304|-10-12043-309|-10-12043-313|-10-12485-366|-10-12485-368|-10-12485-372|-10-12485-373|-10-12485-374|-10-12485-375|-10-12486-0833|-10-12486-0835|-10-12486-0837|-10-12486-0907|-10-12486-384|-10-12486-391|-10-12486-392|-10-12486-407|-10-12486-428|-CM1|-EF1|-PBW1|-PC1|-PE1|-PE2|-PE5|-SFE1|-SPV2|-SWI14|-SWI15|-VP2|-VP3|-VP4|-WC2|-WC8|-WI10|-WI11|-WI4|-AB4WS|-BBB11|-BR3CWS|-BR6WS|-CPROC|-CPRON|-CPWSB|-JR601|-JR602|-JR603|-JR604|-JR605|-MAT4WS001|-MAT4WS002|-MAT4WS003|-MAT6WS001|-MAT6WS002|-MAT6WS003|-MAT6WS005|-RWS105|-RWS106|-SA401|-SA402|-SP401|-CH50GSD|-FR50GSD|-GC50GSD";

// Mapeo por empresa
const COMPANY_RULES = {
    E200: {
        code: 'E200',
        name: 'Superdeporte S.A.',
        motivoSuffix: '_GRUPO_MARATHON',
        subsidiaria: '101|102|103|122|127|118|116',
        subCodePrefix: '118'
    },
    E100: {
        code: 'E100',
        name: 'Equinox',
        motivoSuffix: '_NIKE',
        subsidiaria: '121|126',
        subCodePrefix: '121'
    },
    E101: {
        code: 'E101',
        name: 'Mundo Dep',
        motivoSuffix: '_ADI_RBK',
        subsidiaria: '303|304',
        subCodePrefix: '303'
    }
};

/**
 * Procesa la generación de cupones en Oracle para los colaboradores pendientes
 */
export async function processOracleCoupons() {
    console.log(`\n===============================================================`);
    console.log(`🔍 [ORACLE CUPONES 90D] Buscando aprobaciones pendientes...`);
    console.log(`===============================================================`);

    // Consultar colaboradores aprobados sin código de descuento asignado en discount_id_ws
    const { data: pendingEmployees, error: fetchErr } = await supabase
        .from('digi_employee_benefits_90d')
        .select('*')
        .eq('estado', 'APROBADO')
        .or('discount_id_ws.is.null,discount_id_ws.eq.""')
        .order('aprobado_at', { ascending: true });

    if (fetchErr) {
        console.error('❌ Error consultando Supabase:', fetchErr);
        return { count: 0, error: fetchErr.message };
    }

    return processBatch(pendingEmployees || []);
}

async function getActiveOracleConfig() {
    let pEstilos = P_ESTILOS;
    let empresaDescuentos = { E200: 30, E100: 30, E101: 30 };
    let empresaSubsidiarias = {
        E200: '101|102|103|122|127|118|116',
        E100: '121|126',
        E101: '303|304'
    };
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
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                if (typeof parsed.p_estilos === 'string' && parsed.p_estilos.trim()) {
                    pEstilos = parsed.p_estilos.trim();
                }
                if (parsed.empresa_descuentos && typeof parsed.empresa_descuentos === 'object') {
                    empresaDescuentos = { ...empresaDescuentos, ...parsed.empresa_descuentos };
                }
                if (parsed.empresa_subsidiarias && typeof parsed.empresa_subsidiarias === 'object') {
                    empresaSubsidiarias = { ...empresaSubsidiarias, ...parsed.empresa_subsidiarias };
                }
            }
        }
    } catch (_) {}
    return { pEstilos, empresaDescuentos, empresaSubsidiarias };
}

async function processBatch(employees) {
    if (!employees || employees.length === 0) {
        console.log(`ℹ️ No hay colaboradores con certificados pendientes por generar.`);
        return { count: 0, success: true };
    }

    console.log(`📋 Se encontraron ${employees.length} colaborador(es) pendientes para generar certificados en Oracle.`);
    const {
        pEstilos: activePEstilos,
        empresaDescuentos: activeEmpresaDescuentos,
        empresaSubsidiarias: activeEmpresaSubsidiarias
    } = await getActiveOracleConfig();

    let oracleConn;
    try {
        console.log(`🔌 Conectando a Oracle (${ORACLE_CONFIG.connectString}, user: ${ORACLE_CONFIG.user})...`);
        oracleConn = await oracledb.getConnection(ORACLE_CONFIG);
        console.log(`✅ Conexión a Oracle establecida.`);

        const now = new Date();
        const currentYear = now.getFullYear();
        const isDecember = (now.getMonth() + 1) === 12;

        // Prefijo motivo: 'D' en diciembre, 'E' en cualquier otro mes
        const motivoPrefix = isDecember ? `D${currentYear}` : `E${currentYear}`;

        // Fechas de vigencia
        const p_validfrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const p_validto = isDecember
            ? new Date(currentYear, 11, 31, 23, 59, 59) // 31 de diciembre del año en curso
            : new Date(currentYear, 10, 30, 23, 59, 59); // 30 de noviembre del año en curso

        console.log(`📅 Parámetros de Vigencia:`);
        console.log(`   - Válido Desde (p_validfrom): ${p_validfrom.toISOString().split('T')[0]}`);
        console.log(`   - Válido Hasta (p_validto):   ${p_validto.toISOString().split('T')[0]}`);
        console.log(`   - Prefijo Motivo:             ${motivoPrefix}`);

        // Leer secuenciales actuales con bloqueo de fila
        const secRes = await oracleConn.execute(`SELECT SEC_LOTE, SEC_CERTIFICADO FROM SECUENCIALES FOR UPDATE`);
        let currentLote = secRes.rows && secRes.rows[0] ? Number(secRes.rows[0][0]) : 1809;
        let currentSecCert = secRes.rows && secRes.rows[0] ? Number(secRes.rows[0][1]) : 2567546;

        console.log(`🔢 Secuenciales iniciales: SEC_LOTE=${currentLote}, SEC_CERTIFICADO=${currentSecCert}`);

        let totalCertificadosGenerados = 0;

        for (const emp of employees) {
            const cupoBase = Number(emp.cupo_aprobado) || 1000;

            console.log(`\n---------------------------------------------------------------`);
            console.log(`👤 Procesando: ${emp.nombre_completo} (Cédula: ${emp.cedula}, PERNR: ${emp.pernr})`);
            console.log(`   Cupo Base Asignado: $${cupoBase}`);

            // Empresas a generar para este empleado (soporta columna empresas o metadata en observaciones)
            let empresas = ['E200'];
            if (Array.isArray(emp.empresas) && emp.empresas.length > 0) {
                empresas = emp.empresas;
            } else if (emp.observaciones) {
                try {
                    const parsed = JSON.parse(emp.observaciones);
                    if (Array.isArray(parsed.empresas) && parsed.empresas.length > 0) {
                        empresas = parsed.empresas;
                    }
                } catch {}
            }

            console.log(`   Empresas seleccionadas: [${empresas.join(', ')}]`);

            const generatedCoupons = [];
            currentLote++; // Cada asignación o grupo genera un nuevo lote

            for (const empCode of empresas) {
                const rule = COMPANY_RULES[empCode];
                if (!rule) {
                    console.warn(`   ⚠️ Código de empresa desconocido: ${empCode}, saltando...`);
                    continue;
                }

                // Descuento porcentaje configurable por empresa (default 30%)
                const pctDescuento = (activeEmpresaDescuentos && activeEmpresaDescuentos[empCode] !== undefined)
                    ? Number(activeEmpresaDescuentos[empCode])
                    : 30;

                // Subsidiaria configurable por empresa
                const activeSubsidiaria = (activeEmpresaSubsidiarias && activeEmpresaSubsidiarias[empCode]?.trim())
                    ? activeEmpresaSubsidiarias[empCode].trim()
                    : rule.subsidiaria;

                // El monto_maximo_descuento se calcula con el % de descuento asignado a la empresa
                const montoMaximoDescuento = Math.round(cupoBase * (pctDescuento / 100) * 100) / 100;

                const motivo = `${motivoPrefix}${rule.motivoSuffix}`;
                const subCode = rule.subCodePrefix;
                const paddedSec = String(currentSecCert).padStart(9, '0');
                const checkDigit = calculateLuhn(subCode + paddedSec);
                const prefix3 = CERT_PREFIX;
                const codigoCupon = `${prefix3}${subCode}${paddedSec}${checkDigit}`;

                const insertSql = `
                    INSERT INTO certificados (
                        lote,
                        certificado,
                        estatus,
                        subsidiaria,
                        tipo_certificado,
                        descuento_porcentaje,
                        tiendas,
                        fecha_inicio_validez,
                        fecha_vencimiento,
                        departamentos,
                        marcas,
                        estilos,
                        monto_minimo_factura,
                        monto_maximo_descuento,
                        fecha_modificacion,
                        monto_utilizado,
                        rut,
                        motivo,
                        clases,
                        subclases,
                        genero,
                        descuento_monto,
                        descuento_descuento
                    ) VALUES (
                        :lote,
                        :certificado,
                        1,
                        :subsidiaria,
                        1,
                        :descuento_porcentaje,
                        'ALL',
                        :fecha_inicio,
                        :fecha_vencimiento,
                        'ALL',
                        'ALL',
                        :estilos,
                        NULL,
                        :monto_maximo,
                        NULL,
                        0,
                        :rut,
                        :motivo,
                        'ALL',
                        'ALL',
                        'ALL',
                        0,
                        0
                    )
                `;

                await oracleConn.execute(insertSql, {
                    lote: currentLote,
                    certificado: codigoCupon,
                    subsidiaria: activeSubsidiaria,
                    descuento_porcentaje: pctDescuento,
                    fecha_inicio: p_validfrom,
                    fecha_vencimiento: p_validto,
                    estilos: activePEstilos,
                    monto_maximo: montoMaximoDescuento,
                    rut: String(emp.cedula).trim(),
                    motivo: motivo
                });

                console.log(`   ✅ [${empCode} - ${rule.name}] Certificado: ${codigoCupon} | Sub: ${activeSubsidiaria} | Cupo: $${cupoBase} | Descuento ${pctDescuento}%: $${montoMaximoDescuento} | Lote: ${currentLote} | Motivo: ${motivo}`);

                generatedCoupons.push({
                    empresa: empCode,
                    empresa_nombre: rule.name,
                    lote: currentLote,
                    certificado: codigoCupon,
                    motivo: motivo,
                    subsidiaria: activeSubsidiaria,
                    descuento_porcentaje: pctDescuento,
                    cupo_base: cupoBase,
                    monto_maximo: montoMaximoDescuento,
                    fecha_vencimiento: p_validto.toISOString().split('T')[0]
                });

                currentSecCert++;
                totalCertificadosGenerados++;
            }

            // Actualizar SECUENCIALES en Oracle para este avance
            await oracleConn.execute(
                `UPDATE SECUENCIALES SET SEC_LOTE = :lote, SEC_CERTIFICADO = :sec`,
                { lote: currentLote, sec: currentSecCert }
            );

            // Confirmar transacción en Oracle
            await oracleConn.commit();
            console.log(`   💾 Transacción confirmada en Oracle para ${emp.nombre_completo}`);

            // Actualizar registro en Supabase
            const primaryDiscountId = generatedCoupons.map(c => c.certificado).join(' | ');
            const updatePayload = {
                discount_id_ws: primaryDiscountId,
                updated_at: new Date().toISOString()
            };

            // Intentar actualizar campos adicionales si existen en la tabla
            const { error: errExt } = await supabase
                .from('digi_employee_benefits_90d')
                .update({
                    ...updatePayload,
                    cupon_oracle_estado: 'CREADO',
                    oracle_cupones: generatedCoupons
                })
                .eq('id', emp.id);

            if (errExt) {
                // Fallback defensivo a solo discount_id_ws
                const { error: errBase } = await supabase
                    .from('digi_employee_benefits_90d')
                    .update(updatePayload)
                    .eq('id', emp.id);
                if (errBase) {
                    console.error('❌ Error actualizando discount_id_ws en Supabase:', errBase);
                }
            }

            console.log(`   ☁️ Supabase actualizado con ID(s): ${primaryDiscountId}`);
        }

        console.log(`\n===============================================================`);
        console.log(`🎉 ¡PROCESO FINALIZADO EXITOSAMENTE!`);
        console.log(`   Total certificados creados en Oracle: ${totalCertificadosGenerados}`);
        console.log(`   Secuencial final SEC_CERTIFICADO: ${currentSecCert}`);
        console.log(`   Lote final SEC_LOTE: ${currentLote}`);
        console.log(`===============================================================\n`);

        return {
            success: true,
            count: employees.length,
            totalCertificados: totalCertificadosGenerados
        };
    } catch (err) {
        console.error('❌ Error en procesamiento de Oracle:', err);
        if (oracleConn) {
            try {
                await oracleConn.rollback();
                console.log('🔄 Se ejecutó ROLLBACK en Oracle debido a un error.');
            } catch (rbErr) {}
        }
        throw err;
    } finally {
        if (oracleConn) {
            try {
                await oracleConn.close();
            } catch (e) {}
        }
    }
}

// Ejecución directa desde CLI
if (process.argv[1] && process.argv[1].endsWith('process_oracle_coupons.mjs')) {
    const isWatch = process.argv.includes('--watch');

    if (isWatch) {
        const intervalSec = 30; // Consulta cada 30 segundos
        console.log(`👀 Modo Agente / Vigilante (Watch) activado en segundo plano.`);
        console.log(`⏱️ Verificando nuevas aprobaciones cada ${intervalSec} segundos...`);
        setInterval(async () => {
            try {
                await processOracleCoupons();
            } catch (e) {
                console.error('Error en ciclo watch:', e.message);
            }
        }, intervalSec * 1000);
        // Ejecución inmediata al arrancar el agente
        processOracleCoupons().catch(e => console.error(e));
    } else {
        processOracleCoupons()
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
    }
}
