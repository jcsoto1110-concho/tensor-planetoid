import { NextRequest, NextResponse } from 'next/server';
import { executeOracleQuery } from '@/lib/oracledb';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const result = await executeOracleQuery('SELECT * FROM digi_employees');
        return NextResponse.json({ success: true, data: result.rows }, {
            headers: { 'Cache-Control': 'no-store, max-age=0' }
        });
    } catch (error: any) {
        console.error('Error fetching employees:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, codigo_sap, name, apellido, position, entry_date, region, ciudad, departamento, responsable, pais } = body;

        const sql = `
            MERGE INTO digi_employees e
            USING (SELECT :id as id FROM dual) s
            ON (e.id = s.id)
            WHEN MATCHED THEN
                UPDATE SET 
                    codigo_sap = :codigo_sap,
                    name = :name,
                    apellido = :apellido,
                    position = :position,
                    entry_date = TO_DATE(:entry_date, 'YYYY-MM-DD'),
                    region = :region,
                    ciudad = :ciudad,
                    departamento = :departamento,
                    responsable = :responsable,
                    pais = :pais,
                    estado = '1'
            WHEN NOT MATCHED THEN
                INSERT (id, codigo_sap, name, apellido, position, entry_date, region, ciudad, departamento, responsable, pais, estado)
                VALUES (:id, :codigo_sap, :name, :apellido, :position, TO_DATE(:entry_date, 'YYYY-MM-DD'), :region, :ciudad, :departamento, :responsable, :pais, '1')
        `;

        await executeOracleQuery(sql, {
            id, codigo_sap, name, apellido, position, entry_date, region, ciudad, departamento, responsable, pais
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error upserting employee:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}
