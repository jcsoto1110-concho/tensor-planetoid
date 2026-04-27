import { NextRequest, NextResponse } from 'next/server';
import { executeOracleQuery } from '@/lib/oracledb';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get('employeeId');

        let sql = 'SELECT * FROM digi_documents';
        const params: any = {};

        if (employeeId) {
            sql += ' WHERE employee_id = :employeeId';
            params.employeeId = employeeId;
        }

        const result = await executeOracleQuery(sql, params);
        return NextResponse.json({ success: true, data: result.rows });
    } catch (error: any) {
        console.error('Error fetching documents:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, employee_id, file_name, file_type, file_url, status, uploaded_by, comments } = body;

        const sql = `
            INSERT INTO digi_documents (employee_id, file_name, file_type, file_url, status, uploaded_by, comments)
            VALUES (:employee_id, :file_name, :file_type, :file_url, :status, :uploaded_by, :comments)
        `;

        await executeOracleQuery(sql, {
            employee_id, file_name, file_type, file_url, status, uploaded_by, comments
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error creating document record:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, status, approved_by, comments, rejection_reason } = body;

        const sql = `
            UPDATE digi_documents 
            SET status = :status, 
                approved_by = :approved_by, 
                approved_date = CURRENT_TIMESTAMP,
                comments = :comments,
                rejection_reason = :rejection_reason
            WHERE id = :id
        `;

        await executeOracleQuery(sql, { id, status, approved_by, comments, rejection_reason });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating document:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}
