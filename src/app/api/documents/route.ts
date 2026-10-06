import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

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
        const { employee_id, file_name, file_type, file_url, status, uploaded_by, comments } = body;

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
        const { id, ids, status, approved_by, comments, rejection_reason } = body;

        const updatePayload: any = {
            status,
            approved_by,
            comments,
            rejection_reason,
            updated_at: new Date().toISOString()
        };

        if (ids && Array.isArray(ids) && ids.length > 0) {
            // Actualización masiva
            const { error } = await supabase
                .from('digi_documents')
                .update(updatePayload)
                .in('id', ids);

            if (error) throw error;
            return NextResponse.json({ success: true, count: ids.length });
        } else if (id) {
            // Actualización individual
            const { error } = await supabase
                .from('digi_documents')
                .update(updatePayload)
                .eq('id', id);

            if (error) throw error;
            return NextResponse.json({ success: true, count: 1 });
        } else {
            return NextResponse.json({ success: false, error: 'Se requiere id o lista de ids' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('Error updating document(s):', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}
