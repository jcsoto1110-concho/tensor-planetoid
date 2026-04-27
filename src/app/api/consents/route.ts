import { NextRequest, NextResponse } from 'next/server';
import { executeOracleQuery } from '@/lib/oracledb';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const employeeCedula = searchParams.get('cedula');

        if (!employeeCedula) {
            return NextResponse.json({ success: false, error: 'Cedula is required' }, { status: 400 });
        }

        const sql = 'SELECT * FROM digi_consents WHERE employee_cedula = :cedula ORDER BY consent_date DESC';
        const result = await executeOracleQuery(sql, { cedula: employeeCedula });
        return NextResponse.json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error fetching consents:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { employee_cedula, country, consent_text, ip_address, user_agent, accepted } = body;

        const sql = `
            INSERT INTO digi_consents (employee_cedula, country, consent_date, consent_text, ip_address, user_agent, accepted)
            VALUES (:employee_cedula, :country, CURRENT_TIMESTAMP, :consent_text, :ip_address, :user_agent, :accepted)
        `;

        await executeOracleQuery(sql, { 
            employee_cedula, country, consent_text, ip_address, user_agent, accepted: accepted ? 1 : 0 
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error saving consent:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
