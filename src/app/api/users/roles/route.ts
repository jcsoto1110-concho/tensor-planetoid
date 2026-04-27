import { NextRequest, NextResponse } from 'next/server';
import { executeOracleQuery } from '@/lib/oracledb';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const cedula = searchParams.get('cedula');

        if (!userId && !cedula) {
            return NextResponse.json({ success: false, error: 'userId or cedula is required' }, { status: 400 });
        }

        let sql = '';
        const params: any = {};

        if (userId) {
            sql = 'SELECT role FROM digi_user_roles WHERE user_id = :userId';
            params.userId = userId;
        } else {
            sql = `
                SELECT r.role 
                FROM digi_user_roles r
                JOIN digi_users u ON r.user_id = u.id
                WHERE u.cedula = :cedula
            `;
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
        console.error('Error fetching roles:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, role } = body;

        const sql = `
            INSERT INTO digi_user_roles (user_id, role)
            VALUES (:userId, :role)
        `;

        await executeOracleQuery(sql, { userId, role });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error assigning role:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');
        const role = searchParams.get('role');

        const sql = 'DELETE FROM digi_user_roles WHERE user_id = :userId AND role = :role';
        await executeOracleQuery(sql, { userId, role });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting role:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}
