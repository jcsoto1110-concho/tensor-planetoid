import { NextRequest, NextResponse } from 'next/server';
import { executeOracleQuery } from '@/lib/oracledb';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get('username');
        const cedula = searchParams.get('cedula');

        let sql = 'SELECT * FROM digi_users';
        const params: any = {};

        if (username) {
            sql += ' WHERE username = :username';
            params.username = username;
        } else if (cedula) {
            sql += ' WHERE cedula = :cedula';
            params.cedula = cedula;
        }

        const result = await executeOracleQuery(sql, params);
        // Manually map to plain objects to avoid circular refs from Oracle driver
        const data = (result.rows || []).map((row: any) => {
            const clean: any = {};
            for (const key of Object.keys(row)) {
                clean[key] = row[key] instanceof Date ? row[key].toISOString() : row[key];
            }
            return clean;
        });
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { username, password, name, cedula } = body;

        const sql = `
            MERGE INTO digi_users u
            USING (SELECT :username as username FROM dual) s
            ON (u.username = s.username)
            WHEN MATCHED THEN
                UPDATE SET name = :name, cedula = :cedula, password = :password
            WHEN NOT MATCHED THEN
                INSERT (username, password, name, cedula)
                VALUES (:username, :password, :name, :cedula)
        `;

        await executeOracleQuery(sql, { username, password, name, cedula });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error creating/updating user:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}
