import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const employeeId = searchParams.get('employeeId');

        if (employeeId) {
            const { data, error } = await supabase
                .from('digi_documents')
                .select('*')
                .eq('employee_id', employeeId);

            if (error) throw error;
            return NextResponse.json({ success: true, data }, {
                headers: { 'Cache-Control': 'no-store, max-age=0' }
            });
        } else {
            let allData: any[] = [];
            let from = 0;
            const step = 1000;

            while (true) {
                const { data: chunk, error } = await supabase
                    .from('digi_documents')
                    .select('*')
                    .range(from, from + step - 1);
                    
                if (error) throw error;
                if (!chunk || chunk.length === 0) break;
                
                allData = [...allData, ...chunk];
                if (chunk.length < step) break;
                from += step;
            }

            return NextResponse.json({ success: true, data: allData });
        }
    } catch (error: any) {
        console.error('Error fetching documents:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { id, employee_id, file_name, file_type, file_url, status, uploaded_by, comments } = body;

        const { error } = await supabase
            .from('digi_documents')
            .insert({
                employee_id, file_name, file_type, file_url, status, uploaded_by, comments
            });

        if (error) throw error;

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

        const { error } = await supabase
            .from('digi_documents')
            .update({
                status,
                approved_by,
                comments,
                rejection_reason,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating document:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}
