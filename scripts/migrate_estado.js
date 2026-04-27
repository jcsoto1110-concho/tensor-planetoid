const oracledb = require('oracledb');
const fs = require('fs');
const path = require('path');

// Try to load dotenv manually if needed, or just use process.env assuming it's set
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length === 2) {
            process.env[parts[0].trim()] = parts[1].trim();
        }
    });
}

async function run() {
    let connection;
    try {
        console.log('Connecting to Oracle...');
        connection = await oracledb.getConnection({
            user: process.env.ORACLE_USER,
            password: process.env.ORACLE_PASSWORD,
            connectionString: process.env.ORACLE_CONNECTION_STRING
        });
        console.log('Connected.');

        // 1. Check if column exists
        let exists = false;
        try {
            await connection.execute('SELECT ESTADO FROM DIGI_EMPLOYEES FETCH FIRST 1 ROWS ONLY');
            exists = true;
            console.log('Column ESTADO already exists.');
        } catch (e) {
            console.log('Column ESTADO does not exist, creating...');
        }

        // 2. Add column if not exists
        if (!exists) {
            await connection.execute('ALTER TABLE DIGI_EMPLOYEES ADD ESTADO NUMBER(1) DEFAULT 1');
            console.log('Column ESTADO added.');
        }

        await connection.commit();
        console.log('Migration successful.');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (e) {}
        }
    }
}
run();
