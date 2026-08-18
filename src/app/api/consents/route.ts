import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const employeeCedula = searchParams.get('cedula');

        if (!employeeCedula) {
            return NextResponse.json({ success: false, error: 'Cedula is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('digi_consents')
            .select('*')
            .eq('employee_cedula', employeeCedula)
            .order('consent_date', { ascending: false });

        if (error) throw error;
        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error('Error fetching consents:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { employee_cedula, country, consent_text, ip_address, user_agent, accepted } = body;

        const { error } = await supabase
            .from('digi_consents')
            .insert({
                employee_cedula,
                country,
                consent_text,
                ip_address,
                user_agent,
                accepted: accepted ? 1 : 0
            });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error saving consent:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
