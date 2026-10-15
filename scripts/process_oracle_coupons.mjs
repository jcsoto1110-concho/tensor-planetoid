// ==============================================================================
// SCRIPT: process_oracle_coupons.mjs
// Genera certificados de descuento en Oracle Retail Pro (192.168.91.14:1521/rproods)
// para los colaboradores aprobados en el Beneficio de 90 Días
// ==============================================================================

import oracledb from 'oracledb';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Cargar variables de entorno desde .env.local
const envPath = path.resolve('.env.local');
const envConfig = {};
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    lines.forEach(l => {
        const trimmed = l.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
            envConfig[key] = val;
        }
    });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || envConfig.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Falta configurar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ORACLE_CONFIG = {
    user: process.env.ORACLE_RPRO_USER || envConfig.ORACLE_RPRO_USER || 'REPORTUSER',
    password: process.env.ORACLE_RPRO_PASSWORD || envConfig.ORACLE_RPRO_PASSWORD || 'report',
    connectString: process.env.ORACLE_RPRO_CONNECT_STRING || envConfig.ORACLE_RPRO_CONNECT_STRING || '192.168.91.14:1521/rproods'
};

const ORACLE_CLIENT_LIB = process.env.ORACLE_CLIENT_LIB || envConfig.ORACLE_CLIENT_LIB || 'C:\\SAP_Monitor\\instantclient_19_22';

// Inicializar Oracle Client en modo Thick
try {
    oracledb.initOracleClient({ libDir: ORACLE_CLIENT_LIB });
} catch (e) {
    // Si ya está inicializado, ignorar
    if (!e.message.includes('already been called')) {
        console.warn('⚠️ Nota sobre initOracleClient:', e.message);
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

// Generar 3 letras mayúsculas aleatorias para el prefijo del cupón
function generateRandomPrefix() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let res = '';
    for (let i = 0; i < 3; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
}

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

    // Consultar colaboradores aprobados sin código de descuento o en estado pendiente
    const { data: pendingEmployees, error: fetchErr } = await supabase
        .from('digi_employee_benefits_90d')
        .select('*')
        .eq('estado', 'APROBADO')
        .or('discount_id_ws.is.null,discount_id_ws.eq."",cupon_oracle_estado.eq.PENDIENTE')
        .order('aprobado_at', { ascending: true });

    if (fetchErr) {
        // En caso de que cupon_oracle_estado aún no esté en el schema cache, consultar solo por discount_id_ws
        const { data: fallbackList, error: fallbackErr } = await supabase
            .from('digi_employee_benefits_90d')
            .select('*')
            .eq('estado', 'APROBADO')
            .is('discount_id_ws', null);

        if (fallbackErr) {
            console.error('❌ Error consultando Supabase:', fallbackErr);
            return { count: 0, error: fallbackErr.message };
        }
        return processBatch(fallbackList || []);
    }

    return processBatch(pendingEmployees || []);
}

async function processBatch(employees) {
    if (!employees || employees.length === 0) {
        console.log(`ℹ️ No hay colaboradores con certificados pendientes por generar.`);
        return { count: 0, success: true };
    }

    console.log(`📋 Se encontraron ${employees.length} colaborador(es) pendientes para generar certificados en Oracle.`);

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
            console.log(`\n---------------------------------------------------------------`);
            console.log(`👤 Procesando: ${emp.nombre_completo} (Cédula: ${emp.cedula}, PERNR: ${emp.pernr})`);
            console.log(`   Monto Descuento: $${emp.cupo_aprobado}`);

            // Empresas a generar para este empleado
            const empresas = Array.isArray(emp.empresas) && emp.empresas.length > 0 
                ? emp.empresas 
                : ['E200'];

            console.log(`   Empresas seleccionadas: [${empresas.join(', ')}]`);

            const generatedCoupons = [];
            currentLote++; // Cada asignación o grupo genera un nuevo lote

            for (const empCode of empresas) {
                const rule = COMPANY_RULES[empCode];
                if (!rule) {
                    console.warn(`   ⚠️ Código de empresa desconocido: ${empCode}, saltando...`);
                    continue;
                }

                const motivo = `${motivoPrefix}${rule.motivoSuffix}`;
                const subCode = rule.subCodePrefix;
                const paddedSec = String(currentSecCert).padStart(9, '0');
                const checkDigit = calculateLuhn(subCode + paddedSec);
                const prefix3 = generateRandomPrefix();
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
                        30,
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
                    subsidiaria: rule.subsidiaria,
                    fecha_inicio: p_validfrom,
                    fecha_vencimiento: p_validto,
                    estilos: P_ESTILOS,
                    monto_maximo: Number(emp.cupo_aprobado),
                    rut: String(emp.cedula).trim(),
                    motivo: motivo
                });

                console.log(`   ✅ [${empCode} - ${rule.name}] Certificado: ${codigoCupon} | Lote: ${currentLote} | Motivo: ${motivo}`);

                generatedCoupons.push({
                    empresa: empCode,
                    empresa_nombre: rule.name,
                    lote: currentLote,
                    certificado: codigoCupon,
                    motivo: motivo,
                    subsidiaria: rule.subsidiaria,
                    monto_maximo: Number(emp.cupo_aprobado),
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
            try {
                await supabase
                    .from('digi_employee_benefits_90d')
                    .update({
                        ...updatePayload,
                        cupon_oracle_estado: 'CREADO',
                        oracle_cupones: generatedCoupons
                    })
                    .eq('id', emp.id);
            } catch (errSup) {
                // Fallback a solo discount_id_ws
                await supabase
                    .from('digi_employee_benefits_90d')
                    .update(updatePayload)
                    .eq('id', emp.id);
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
        console.log('👀 Modo Vigilante (Watch) activado. Verificando cada 60 segundos...');
        setInterval(async () => {
            try {
                await processOracleCoupons();
            } catch (e) {
                console.error('Error en ciclo watch:', e.message);
            }
        }, 60000);
        // Ejecución inmediata inicial
        processOracleCoupons().catch(e => console.error(e));
    } else {
        processOracleCoupons()
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
    }
}
