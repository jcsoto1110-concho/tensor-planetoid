const oracledb = require('oracledb');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve('.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

let supabaseUrl = '';
let supabaseKey = '';
let oracleUser = '';
let oraclePassword = '';
let oracleConnectString = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
  if (line.startsWith('ORACLE_USER=')) oracleUser = line.split('=')[1].trim();
  if (line.startsWith('ORACLE_PASSWORD=')) oraclePassword = line.split('=')[1].trim();
  if (line.startsWith('ORACLE_CONNECTION_STRING=')) {
      oracleConnectString = line.split('=')[1].trim();
      // Eliminar comillas dobles si las tiene (puede causar NJS-516)
      if (oracleConnectString.startsWith('"') && oracleConnectString.endsWith('"')) {
          oracleConnectString = oracleConnectString.slice(1, -1);
      }
  }
});

const supabase = createClient(supabaseUrl, supabaseKey);
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;

async function migrateTable(connection, tableName, supabaseTableName = tableName) {
    console.log(`Migrando ${tableName}...`);
    try {
        const result = await connection.execute(`SELECT * FROM ${tableName}`);
        if (!result.rows || result.rows.length === 0) {
            console.log(`- Sin registros en ${tableName}.`);
            return;
        }
        
        console.log(`- Encontrados ${result.rows.length} registros en Oracle.`);
        
        // Mapear los datos de Oracle a minúsculas porque Supabase/Postgres usa minúsculas por defecto
        const records = result.rows.map(row => {
            const cleanRow = {};
            for (const key of Object.keys(row)) {
                // Parse date appropriately
                if (row[key] instanceof Date) {
                    cleanRow[key.toLowerCase()] = row[key].toISOString();
                } else {
                    cleanRow[key.toLowerCase()] = row[key];
                }
            }
            return cleanRow;
        });

        // Insertar en Supabase uno por uno para evitar fallos masivos por llaves foráneas
        let inserted = 0;
        let failed = 0;
        
        console.log(`- Muestra del primer registro a insertar:`, records[0]);

        for (const record of records) {
            const { error } = await supabase.from(supabaseTableName).upsert(record, { onConflict: 'id' });
            if (error) {
                // Solo logueamos el ID que falló para no saturar la consola
                console.error(`- Error insertando registro ${record.id || 'desconocido'} en ${supabaseTableName}: ${error.details || error.message}`);
                failed++;
            } else {
                inserted++;
            }
        }
        console.log(`- Completada migración de ${supabaseTableName} (${inserted} insertados, ${failed} fallidos).`);
    } catch (e) {
        console.error(`- Error leyendo ${tableName} de Oracle:`, e.message);
    }
}

async function main() {
  let connection;
  try {
    console.log("Conectando a Oracle...");
    connection = await oracledb.getConnection({
      user: oracleUser,
      password: oraclePassword,
      connectString: oracleConnectString
    });
    console.log("Conexión a Oracle exitosa.");

    await migrateTable(connection, 'digi_employees');
    // Se removieron las demás tablas a petición

  } catch (err) {
    console.error("Fallo general:", err);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

main();
