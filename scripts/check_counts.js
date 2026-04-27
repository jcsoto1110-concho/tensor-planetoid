const oracledb = require('oracledb');
require('dotenv').config({ path: '.env.local' });

async function run() {
    let connection;
    try {
        connection = await oracledb.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectionString: process.env.ORACLE_CONNECTION_STRING
        });
        const tables = ['DIGI_EMPLOYEES', 'DIGI_DOCUMENTS', 'DIGI_AUDIT_LOGS'];
        for (const table of tables) {
            const res = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`Table ${table}: ${res.rows[0][0] || res.rows[0].COUNT} rows`);
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        if (connection) await connection.close();
    }
}
run();
