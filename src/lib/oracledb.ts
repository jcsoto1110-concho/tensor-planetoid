import oracledb from 'oracledb';

/**
 * Configuración de inicialización (opcional). 
 * Oracledb en modo "Thin" no necesita cliente de Oracle instalado por defecto.
 */
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

/**
 * Recursively removes non-serializable properties and ensures plain objects.
 * This is CRITICAL to avoid "Circular Structure" errors from Oracle driver internals.
 */
function sanitizeData(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) return obj.map(sanitizeData);
    if (typeof obj === 'object') {
        const clean: any = {};
        for (const key of Object.keys(obj)) {
            // Only copy enumerable own properties that are not internal driver junk
            if (key.startsWith('_')) continue; 
            clean[key] = sanitizeData(obj[key]);
        }
        return clean;
    }
    return obj;
}

/**
 * Obtener una conexión a la base de datos Oracle
 * Usado el string provisto para Buxis
 */
export async function getOracleConnection(): Promise<any> {
    const connectionString = process.env.ORACLE_CONNECTION_STRING || `(DESCRIPTION =
    (ADDRESS_LIST =
      (ADDRESS = (PROTOCOL = TCP)(HOST = 12.1.3.172)(PORT = 1521))
    )
    (CONNECT_DATA =
      (SERVICE_NAME = buxis.redbdd.redprod.oraclevcn.com)
    )
  )`;

    try {
        const connection = await oracledb.getConnection({
            user: process.env.ORACLE_USER || 'DIGITALIZACION',
            password: process.env.ORACLE_PASSWORD || '123456', 
            connectString: connectionString,
        });

        return connection;
    } catch (error) {
        console.error('Error al conectar a Oracle DB:', error);
        throw error;
    }
}

/**
 * Helpers para ejecutar queries fácilmente
 */
export async function executeOracleQuery(sql: string, bindParams: any = []) {
    let connection: any = null;
    try {
        connection = await getOracleConnection();
        const result = await connection.execute(sql, bindParams, {
            outFormat: oracledb.OUT_FORMAT_OBJECT,
            autoCommit: true
        });
        
        // Return sanitized rows directly to simplify API consumption
        return {
            rows: sanitizeData(result.rows || []),
            metaData: result.metaData
        };
    } catch (err: any) {
        console.error('Error executing query:', err.message);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error al cerrar la conexión:', err);
            }
        }
    }
}
