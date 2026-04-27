import { NextRequest, NextResponse } from 'next/server';
import { executeOracleQuery } from '@/lib/oracledb';

export async function GET() {
    try {
        const result = await executeOracleQuery('SELECT * FROM digi_audit_logs ORDER BY timestamp DESC');
        return NextResponse.json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { user_name, action, entity_type, entity_id, description } = body;

        const sql = `
            INSERT INTO digi_audit_logs (user_name, action, entity_type, entity_id, description)
            VALUES (:user_name, :action, :entity_type, :entity_id, :description)
        `;

        await executeOracleQuery(sql, { user_name, action, entity_type, entity_id, description });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error creating audit log:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}
