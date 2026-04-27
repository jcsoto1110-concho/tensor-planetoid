import oracledb from 'oracledb';
import { NextRequest, NextResponse } from 'next/server';
import { getOracleConnection } from '@/lib/oracledb';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    let connection;
    try {
        console.log('🔄 Iniciando sincronización masiva de empleados desde ms_colaboradores...');
        connection = await getOracleConnection();

        // 1. Obtener datos de la tabla origen
        const sourceSql = `
            SELECT 
                cedide_mf as id, 
                colaborador as name, 
                cargo as position, 
                fecha_ing as entry_date, 
                empresa as pais,
                unidad_negocio as ubicacion
            FROM ms_colaboradores 
            WHERE estado = 1
        `;

        const sourceResult = await connection.execute(sourceSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        const sourceData = sourceResult.rows || [];

        console.log(`📊 Datos encontrados en origen: ${sourceData.length}`);

        if (sourceData.length === 0) {
            return NextResponse.json({ success: true, message: 'No hay datos para sincronizar', count: 0 });
        }

        // 2. Marcar todos como inactivos antes de sincronizar para identificar los que ya no están en RRHH
        console.log('⏳ Marcando empleados locales como inactivos para actualización...');
        await connection.execute(`UPDATE digi_employees SET estado = '0'`);
        await connection.commit();

        // 3. Procesar e insertar/actualizar en digi_employees using Batch or single connection
        let processedCount = 0;
        const mergeSql = `
            MERGE INTO digi_employees e
            USING (SELECT :id as id FROM dual) s
            ON (e.id = s.id)
            WHEN MATCHED THEN
                UPDATE SET 
                    name = :name,
                    position = :position,
                    entry_date = :entry_date,
                    pais = :pais,
                    region = :ubicacion,
                    estado = '1'
            WHEN NOT MATCHED THEN
                INSERT (id, name, apellido, position, entry_date, pais, region, estado)
                VALUES (:id, :name, ' ', :position, :entry_date, :pais, :ubicacion, '1')
        `;

        for (const emp of sourceData) {
            const row = emp as any;
            
            // Log sample keys safely
            if (processedCount === 0) {
                console.log('Sample keys from source:', Object.keys(row));
            }

            // Map data handling potential case differences and nulls
            const empId = String(row.ID || row.id || row.CEDIDE_MF);
            const empName = row.NAME || row.name || row.COLABORADOR || ' ';
            const empPosition = row.POSITION || row.position || row.CARGO || ' ';
            const empEntryDate = row.ENTRY_DATE || row.entry_date || row.FECHA_ING || new Date(); // Fallback to now if missing
            const empPais = row.PAIS || row.pais || row.EMPRESA || ' ';
            const empUbicacion = row.UBICACION || row.ubicacion || row.UNIDAD_NEGOCIO || ' ';

            await connection.execute(mergeSql, {
                id: empId,
                name: empName,
                position: empPosition,
                entry_date: empEntryDate,
                pais: empPais,
                ubicacion: empUbicacion
            });
            processedCount++;
            
            if (processedCount % 100 === 0) {
                console.log(`⏳ Procesados ${processedCount} empleados...`);
                await connection.commit();
            }
        }

        await connection.commit();
        console.log(`✅ Sincronización completada: ${processedCount} registros procesados`);

        return NextResponse.json({ 
            success: true, 
            message: 'Sincronización completada con éxito', 
            count: processedCount 
        });

    } catch (error: any) {
        console.error('❌ Error en sincronización de empleados:', error);
        return NextResponse.json({ 
            success: false, 
            error: String(error.message || error || 'Unknown error') 
        }, { status: 500 });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error cerrando conexión:', err);
            }
        }
    }
}
