import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import oracledb from 'oracledb';

// ==============================================================================
// 1. CARGA DE CONFIGURACIÓN (.env en carpeta actual o .env.local en raíz)
// ==============================================================================
const envConfig = {};
const envPaths = [
    path.resolve('.env'),
    path.resolve('.env.local'),
    path.resolve('../.env.local')
];

for (const p of envPaths) {
    if (fs.existsSync(p)) {
        fs.readFileSync(p, 'utf8').split('\n').forEach(l => {
            const trimmed = l.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx > 0) {
                const key = trimmed.substring(0, eqIdx).trim();
                const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
                if (!envConfig[key]) envConfig[key] = val;
            }
        });
        break;
    }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || envConfig.NEXT_PUBLIC_SUPABASE_URL || 'https://zfbrwcflzbauycszajpc.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: Falta configurar NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el archivo .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ORACLE_CONFIG = {
    user: process.env.ORACLE_RPRO_USER || envConfig.ORACLE_RPRO_USER || 'REPORTUSER',
    password: process.env.ORACLE_RPRO_PASSWORD || envConfig.ORACLE_RPRO_PASSWORD || 'report',
    connectString: process.env.ORACLE_RPRO_CONNECT_STRING || envConfig.ORACLE_RPRO_CONNECT_STRING || '192.168.91.14:1521/rproods'
};

// Inicializar Oracle Client en modo Thick si la ruta existe
try {
    if (ORACLE_CLIENT_LIB && fs.existsSync(ORACLE_CLIENT_LIB)) {
        oracledb.initOracleClient({ libDir: ORACLE_CLIENT_LIB });
        console.log(`🔌 Oracle Instant Client cargado desde: ${ORACLE_CLIENT_LIB}`);
    } else if (process.platform === 'win32' && fs.existsSync('C:\\SAP_Monitor\\instantclient_19_22')) {
        oracledb.initOracleClient({ libDir: 'C:\\SAP_Monitor\\instantclient_19_22' });
        console.log('🔌 Oracle Instant Client cargado desde C:\\SAP_Monitor\\instantclient_19_22');
    } else if (process.platform === 'linux' && fs.existsSync('/opt/oracle/instantclient')) {
        oracledb.initOracleClient({ libDir: '/opt/oracle/instantclient' });
        console.log('🔌 Oracle Instant Client cargado desde /opt/oracle/instantclient');
    } else {
        console.log('ℹ️ Operando en modo directo/Thin o librerías por defecto del sistema.');
    }
} catch (e) {
    if (!e.message.includes('already been called')) {
        console.warn('⚠️ Nota sobre initOracleClient (continuando):', e.message);
    }
}

// ==============================================================================
// 2. REGLAS DE NEGOCIO Y ESTRUCTURA DEL CERTIFICADO
// ==============================================================================
const CERT_PREFIX = 'ATS'; // Prefijo fijo de 3 letras asignado al sistema

// Algoritmo de dígito verificador Luhn (Módulo 10)
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

// Lista oficial de estilos excluidos (Talento Humano)
const P_ESTILOS = "-5009|-5010|-5111|-5222|-5305|-5476|-5492|-5617|-5618|-5760|-3450|-VA-AC|-VA-AZ|-VA-BG|-VA-NG|-VT-BG|-VT-NG|-107-02|-107-04|-107-05|-107-06|-108-01|-201-02|-201-04|-202-06|-203-08|-710-02|-715-01|-715-02|-720-03|-10-11287-600|-10-11287-601|-10-12043-304|-10-12043-309|-10-12043-313|-10-12485-366|-10-12485-368|-10-12485-372|-10-12485-373|-10-12485-374|-10-12485-375|-10-12486-0833|-10-12486-0835|-10-12486-0837|-10-12486-0907|-10-12486-384|-10-12486-391|-10-12486-392|-10-12486-407|-10-12486-428|-CM1|-EF1|-PBW1|-PC1|-PE1|-PE2|-PE5|-SFE1|-SPV2|-SWI14|-SWI15|-VP2|-VP3|-VP4|-WC2|-WC8|-WI10|-WI11|-WI4|-AB4WS|-BBB11|-BR3CWS|-BR6WS|-CPROC|-CPRON|-CPWSB|-JR601|-JR602|-JR603|-JR604|-JR605|-MAT4WS001|-MAT4WS002|-MAT4WS003|-MAT6WS001|-MAT6WS002|-MAT6WS003|-MAT6WS005|-RWS105|-RWS106|-SA401|-SA402|-SP401|-CH50GSD|-FR50GSD|-GC50GSD";

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

// ==============================================================================
// 3. PROCESAMIENTO PRINCIPAL DE EMISIÓN DE CUPONES
// ==============================================================================
export async function processOracleCoupons() {
    const timeStr = new Date().toLocaleTimeString();

    // Consultar colaboradores aprobados sin código de descuento emitido
    const { data: pendingEmployees, error: fetchErr } = await supabase
        .from('digi_employee_benefits_90d')
        .select('*')
        .eq('estado', 'APROBADO')
        .or('discount_id_ws.is.null,discount_id_ws.eq.""')
        .order('aprobado_at', { ascending: true });

    if (fetchErr) {
        console.error(`[${timeStr}] ❌ Error consultando Supabase:`, fetchErr.message);
        return { count: 0, error: fetchErr.message };
    }

    if (!pendingEmployees || pendingEmployees.length === 0) {
        // Nada pendiente en este ciclo
        return { count: 0, success: true };
    }

    console.log(`\n===============================================================`);
    console.log(`[${timeStr}] 📋 Encontrados ${pendingEmployees.length} colaborador(es) aprobados para emitir cupones en Oracle.`);
    console.log(`===============================================================`);

    let oracleConn;
    try {
        oracleConn = await oracledb.getConnection(ORACLE_CONFIG);

        const now = new Date();
        const currentYear = now.getFullYear();
        const isDecember = (now.getMonth() + 1) === 12;
        const motivoPrefix = isDecember ? `D${currentYear}` : `E${currentYear}`;

        const p_validfrom = now;
        let p_validto;
        if (!isDecember) {
            p_validto = new Date(currentYear, 10, 30, 23, 59, 59); // 30 de Noviembre
        } else {
            p_validto = new Date(currentYear, 11, 31, 23, 59, 59); // 31 de Diciembre
        }

        // Obtener correlativos actuales de SECUENCIALES
        const secRes = await oracleConn.execute(
            `SELECT SEC_LOTE, SEC_CERTIFICADO FROM SECUENCIALES WHERE NOMBRE_SECUENCIAL = 'CERTIFICADOS'`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!secRes.rows || secRes.rows.length === 0) {
            throw new Error("No se encontró el registro 'CERTIFICADOS' en la tabla SECUENCIALES.");
        }

        let currentLote = Number(secRes.rows[0].SEC_LOTE || 0);
        let currentSecCert = Number(secRes.rows[0].SEC_CERTIFICADO || 0);

        let totalCertificadosGenerados = 0;

        for (const emp of pendingEmployees) {
            console.log(`\n👤 Procesando: ${emp.nombre_completo} (Cédula: ${emp.cedula}, PERNR: ${emp.pernr}) | Cupo: $${emp.cupo_aprobado}`);

            // Extraer empresas autorizadas (desde campo empresas o metadata en observaciones)
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

            console.log(`   Empresas asignadas: [${empresas.join(', ')}]`);

            const generatedCoupons = [];
            currentLote++;

            for (const empCode of empresas) {
                const rule = COMPANY_RULES[empCode];
                if (!rule) continue;

                const motivo = `${motivoPrefix}${rule.motivoSuffix}`;
                const subCode = rule.subCodePrefix;
                const paddedSec = String(currentSecCert).padStart(9, '0');
                const checkDigit = calculateLuhn(subCode + paddedSec);
                const codigoCupon = `${CERT_PREFIX}${subCode}${paddedSec}${checkDigit}`;

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

                console.log(`   ✅ [${empCode} - ${rule.name}] Emitido: ${codigoCupon} | Lote: ${currentLote} | Motivo: ${motivo}`);

                generatedCoupons.push({
                    empresa: empCode,
                    empresa_nombre: rule.name,
                    certificado: codigoCupon,
                    lote: currentLote,
                    motivo: motivo,
                    subsidiaria: rule.subsidiaria,
                    monto_maximo: Number(emp.cupo_aprobado),
                    fecha_vencimiento: p_validto.toISOString().split('T')[0]
                });

                currentSecCert++;
                totalCertificadosGenerados++;
            }

            // Actualizar SECUENCIALES en Oracle
            await oracleConn.execute(
                `UPDATE SECUENCIALES SET SEC_LOTE = :lote, SEC_CERTIFICADO = :sec WHERE NOMBRE_SECUENCIAL = 'CERTIFICADOS'`,
                { lote: currentLote, sec: currentSecCert }
            );

            // Confirmar transacción
            await oracleConn.commit();
            console.log(`   💾 Transacción confirmada en Oracle para ${emp.nombre_completo}`);

            // Actualizar Supabase con el ID generado
            const primaryDiscountId = generatedCoupons.map(c => c.certificado).join(' | ');
            const updatePayload = {
                discount_id_ws: primaryDiscountId,
                updated_at: new Date().toISOString()
            };

            const { error: errExt } = await supabase
                .from('digi_employee_benefits_90d')
                .update({
                    ...updatePayload,
                    cupon_oracle_estado: 'CREADO',
                    oracle_cupones: generatedCoupons
                })
                .eq('id', emp.id);

            if (errExt) {
                await supabase
                    .from('digi_employee_benefits_90d')
                    .update(updatePayload)
                    .eq('id', emp.id);
            }

            console.log(`   ☁️ Supabase sincronizado con éxito (discount_id_ws: ${primaryDiscountId})`);
        }

        console.log(`\n🎉 Ciclo completado: ${totalCertificadosGenerados} certificado(s) emitidos.`);
        return { success: true, count: pendingEmployees.length, totalCertificados: totalCertificadosGenerados };

    } catch (err) {
        console.error('❌ Error procesando en Oracle:', err);
        if (oracleConn) {
            try { await oracleConn.rollback(); } catch {}
        }
        throw err;
    } finally {
        if (oracleConn) {
            try { await oracleConn.close(); } catch {}
        }
    }
}

// ==============================================================================
// 4. ARRANQUE DEL AGENTE (MODO VIGILANTE / CICLO PERMANENTE)
// ==============================================================================
const isOnce = process.argv.includes('--once');

if (isOnce) {
    console.log('⚡ Ejecutando ciclo único (modo --once)...');
    processOracleCoupons()
        .then(() => process.exit(0))
        .catch(err => {
            console.error('Error en ciclo único:', err);
            process.exit(1);
        });
} else {
    // POR DEFECTO: El agente corre permanentemente cada 30 segundos (ideal para PM2)
    const intervalSec = 30;
    console.log('===============================================================');
    console.log('🤖 AGENTE VIGILANTE ORACLE RETAIL PRO (192.168.91.14)');
    console.log(`⏱️ Verificando nuevas aprobaciones cada ${intervalSec} segundos...`);
    console.log('===============================================================');

    // Intervalo continuo
    setInterval(async () => {
        try {
            await processOracleCoupons();
        } catch (e) {
            console.error('Error en ciclo vigilante:', e.message);
        }
    }, intervalSec * 1000);

    // Ejecución inicial inmediata
    processOracleCoupons().catch(e => console.error('Error en verificación inicial:', e));
}
