import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin as supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const username = searchParams.get('username');
        const cedula = searchParams.get('cedula');

        let query = supabase.from('digi_users').select('*');

        if (username) {
            query = query.eq('username', username);
        } else if (cedula) {
            query = query.eq('cedula', cedula);
        }

        const { data, error } = await query;
        if (error) throw error;
        
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

        const { error } = await supabase
            .from('digi_users')
            .upsert({ username, password, name, cedula }, { onConflict: 'username' });
            
        if (error) throw error;
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error creating/updating user:', error);
        return NextResponse.json({ success: false, error: String(error.message || error) }, { status: 500 });
    }
}
