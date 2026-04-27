const oracledb = require('oracledb');
require('dotenv').config({ path: './.env.local' });

async function checkData() {
    let connection;
    try {
        console.log('Connecting to Oracle...');
        console.log('User:', process.env.ORACLE_USER);
        console.log('String:', process.env.ORACLE_CONNECTION_STRING);
        
        connection = await oracledb.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectString: process.env.ORACLE_CONNECTION_STRING
        });

        const result = await connection.execute('SELECT count(*) as total FROM digi_employees');
        console.log('Total employees in digi_employees:', result.rows[0][0] || result.rows[0].TOTAL);
        
        const first5 = await connection.execute('SELECT id, name FROM digi_employees FETCH FIRST 5 ROWS ONLY');
        console.log('First 5 employees:', JSON.stringify(first5.rows, null, 2));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        if (connection) await connection.close();
    }
}

checkData();
