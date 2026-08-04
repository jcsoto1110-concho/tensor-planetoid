import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        let allData: any[] = [];
        let from = 0;
        const step = 1000;

        while (true) {
            const { data: chunk, error } = await supabase
                .from('digi_employees')
                .select('*')
                .range(from, from + step - 1);
                
            if (error) throw error;
            if (!chunk || chunk.length === 0) break;
            
            allData = [...allData, ...chunk];
            if (chunk.length < step) break;
            from += step;
        }
        
        return NextResponse.json({ success: true, data: allData }, {
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

        const { error } = await supabase
            .from('digi_employees')
            .upsert({
                id, codigo_sap, name, apellido, position, entry_date, region, ciudad, departamento, responsable, pais, estado: '1'
            }, { onConflict: 'id' });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error upserting employee:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}
