import oracledb from 'oracledb';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

let user = '';
let password = '';
let connectString = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('ORACLE_USER=')) user = line.split('=')[1].trim();
  if (line.startsWith('ORACLE_PASSWORD=')) password = line.split('=')[1].trim();
  if (line.startsWith('ORACLE_CONNECTION_STRING=')) connectString = line.split('=')[1].trim();
});

async function main() {
  try {
    const connection = await oracledb.getConnection({
      user, password, connectString
    });
    console.log("Connected to Oracle DB");

    const result = await connection.execute(
      `SELECT id, name, apellido, position, estado FROM digi_employees WHERE id = :id`,
      { id: '1103435986' }
    );
    console.log(result.rows);
    
    await connection.close();
  } catch (err) {
    console.error(err);
  }
}

main();
